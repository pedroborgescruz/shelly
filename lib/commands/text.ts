import { isDir, lookup, readFile, resolve, writeFile } from "@/lib/fs/vfs";
import {
  fail,
  fromLines,
  ok,
  parseArgs,
  toLines,
  type CommandImpl,
  type CommandResult,
  type ExecContext,
} from "./types";

interface Gathered {
  lines: string[];
  errors: string[];
}

/** Read every operand as a file, falling back to stdin when there are none. */
function gather(
  name: string,
  operands: string[],
  stdin: string,
  ctx: ExecContext,
): Gathered {
  if (operands.length === 0) return { lines: toLines(stdin), errors: [] };

  const lines: string[] = [];
  const errors: string[] = [];

  for (const operand of operands) {
    const abs = resolve(ctx.cwd, operand);
    if (isDir(lookup(ctx.fs, abs))) {
      errors.push(`${name}: ${operand}: Is a directory`);
      continue;
    }
    const content = readFile(ctx.fs, abs);
    if (content === null) {
      errors.push(`${name}: ${operand}: No such file or directory`);
      continue;
    }
    lines.push(...toLines(content));
  }

  return { lines, errors };
}

function finish(lines: string[], errors: string[]): CommandResult {
  return {
    stdout: fromLines(lines),
    stderr: errors.length ? errors.join("\n") + "\n" : "",
    code: errors.length ? 1 : 0,
  };
}

/* ---------------------------------- sort ---------------------------------- */

/** Leading numeric value of a line, for `sort -n`. */
function numericKey(line: string): number {
  const match = /^\s*(-?\d+(?:\.\d+)?)/.exec(line);
  return match ? Number.parseFloat(match[1]) : Number.NEGATIVE_INFINITY;
}

export const sort: CommandImpl = (args, stdin, ctx) => {
  const { flags, operands } = parseArgs(args);
  const { lines, errors } = gather("sort", operands, stdin, ctx);

  const sorted = [...lines].sort((a, b) =>
    flags.has("n")
      ? numericKey(a) - numericKey(b) || a.localeCompare(b, "en")
      : a.localeCompare(b, "en"),
  );

  if (flags.has("r")) sorted.reverse();

  const output = flags.has("u")
    ? sorted.filter((line, index) => index === 0 || line !== sorted[index - 1])
    : sorted;

  return finish(output, errors);
};

/* ---------------------------------- uniq ---------------------------------- */

export const uniq: CommandImpl = (args, stdin, ctx) => {
  const { flags, operands } = parseArgs(args);
  const { lines, errors } = gather("uniq", operands, stdin, ctx);

  /* uniq only ever compares a line with the one before it — hence `sort | uniq`. */
  const runs: { line: string; count: number }[] = [];
  for (const line of lines) {
    const last = runs[runs.length - 1];
    if (last && last.line === line) last.count += 1;
    else runs.push({ line, count: 1 });
  }

  let kept = runs;
  if (flags.has("d")) kept = runs.filter((run) => run.count > 1);
  if (flags.has("u")) kept = runs.filter((run) => run.count === 1);

  const output = kept.map((run) =>
    flags.has("c") ? `${String(run.count).padStart(4, " ")} ${run.line}` : run.line,
  );

  return finish(output, errors);
};

/* ----------------------------------- cut ---------------------------------- */

/** Expand a field list like `1,3-5` into concrete 1-based indices. */
function fieldList(spec: string): number[] | null {
  const fields: number[] = [];

  for (const part of spec.split(",")) {
    const range = /^(\d+)-(\d+)$/.exec(part);
    if (range) {
      const from = Number.parseInt(range[1], 10);
      const to = Number.parseInt(range[2], 10);
      if (from < 1 || to < from) return null;
      for (let i = from; i <= to; i += 1) fields.push(i);
      continue;
    }
    const single = /^(\d+)$/.exec(part);
    if (!single) return null;
    const value = Number.parseInt(single[1], 10);
    if (value < 1) return null;
    fields.push(value);
  }

  return fields;
}

export const cut: CommandImpl = (args, stdin, ctx) => {
  const { values, operands } = parseArgs(args, { valueFlags: ["d", "f", "c"] });

  const spec = values.f ?? values.c;
  if (spec === undefined) return fail("usage: cut -f <list> [-d <delim>] [file ...]\n");

  const fields = fieldList(spec);
  if (!fields) return fail(`cut: invalid field list: ${spec}\n`);

  const delimiter = values.d ?? "\t";
  const byCharacter = values.f === undefined;

  const { lines, errors } = gather("cut", operands, stdin, ctx);

  const output = lines.map((line) => {
    if (byCharacter) {
      return fields.map((index) => line[index - 1] ?? "").join("");
    }
    /* A line without the delimiter is passed through whole, as cut does. */
    if (!line.includes(delimiter)) return line;
    const parts = line.split(delimiter);
    return fields
      .filter((index) => index <= parts.length)
      .map((index) => parts[index - 1])
      .join(delimiter);
  });

  return finish(output, errors);
};

/* ----------------------------------- tr ----------------------------------- */

const TR_ESCAPES: Record<string, string> = { n: "\n", t: "\t", r: "\r", "\\": "\\" };

/** Expand `a-z` ranges and `\n` style escapes into the characters they stand for. */
function expandSet(spec: string): string[] {
  const unescaped = spec.replace(/\\(.)/g, (match, char) => TR_ESCAPES[char] ?? match);
  const chars: string[] = [];
  let index = 0;

  while (index < unescaped.length) {
    const next = unescaped[index + 1];
    const after = unescaped[index + 2];
    if (next === "-" && after !== undefined) {
      const from = unescaped.charCodeAt(index);
      const to = unescaped.charCodeAt(index + 2);
      const step = from <= to ? 1 : -1;
      for (let code = from; step > 0 ? code <= to : code >= to; code += step) {
        chars.push(String.fromCharCode(code));
      }
      index += 3;
      continue;
    }
    chars.push(unescaped[index]);
    index += 1;
  }

  return chars;
}

export const tr: CommandImpl = (args, stdin) => {
  const { flags, operands } = parseArgs(args);
  const deleting = flags.has("d");

  if (operands.length < (deleting ? 1 : 2)) {
    return fail("usage: tr [-d] set1 [set2]\n");
  }

  const from = expandSet(operands[0]);

  if (deleting) {
    const drop = new Set(from);
    return ok([...stdin].filter((char) => !drop.has(char)).join(""));
  }

  const to = expandSet(operands[1]);
  const mapping = new Map<string, string>();
  from.forEach((char, index) => {
    /* A short second set repeats its last character, as tr does. */
    mapping.set(char, to[index] ?? to[to.length - 1]);
  });

  return ok([...stdin].map((char) => mapping.get(char) ?? char).join(""));
};

/* ----------------------------------- tee ---------------------------------- */

export const tee: CommandImpl = (args, stdin, ctx) => {
  const { flags, operands } = parseArgs(args);
  const errors: string[] = [];

  for (const operand of operands) {
    const abs = resolve(ctx.cwd, operand);
    if (!writeFile(ctx.fs, abs, stdin, { append: flags.has("a") })) {
      errors.push(`tee: ${operand}: No such file or directory`);
    }
  }

  return {
    stdout: stdin,
    stderr: errors.length ? errors.join("\n") + "\n" : "",
    code: errors.length ? 1 : 0,
  };
};
