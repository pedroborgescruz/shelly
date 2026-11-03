import {
  HOME,
  basename,
  displayPath,
  dirname,
  isDir,
  isFile,
  listDir,
  lookup,
  mkdir as mkdirAt,
  mkdirp,
  readFile,
  resolve,
  touch as touchAt,
} from "@/lib/fs/vfs";
import { tldrIndex, tldrPage } from "@/lib/tldr";
import { cp, mv, rm } from "./files";
import { cut, sort, tee, tr, uniq } from "./text";
import {
  fail,
  fromLines,
  ok,
  parseArgs,
  toLines,
  type CommandImpl,
  type CommandResult,
} from "./types";

/* ---------------------------------- pwd ----------------------------------- */

const pwd: CommandImpl = (_args, _stdin, ctx) => ok(ctx.cwd + "\n");

/* ----------------------------------- ls ----------------------------------- */

function longFormat(name: string, node: ReturnType<typeof lookup>): string {
  const isDirectory = isDir(node);
  const mode = isDirectory ? "drwxr-xr-x" : "-rw-r--r--";
  const size = isDirectory ? 128 : isFile(node) ? node.content.length : 0;
  const padded = String(size).padStart(5, " ");
  return `${mode}  shelly  staff  ${padded}  ${name}`;
}

const ls: CommandImpl = (args, _stdin, ctx) => {
  const { flags, operands } = parseArgs(args);
  const all = flags.has("a");
  const long = flags.has("l");
  const classify = flags.has("F");

  const targets = operands.length > 0 ? operands : ["."];
  const blocks: string[] = [];
  const errors: string[] = [];

  for (const target of targets) {
    const abs = resolve(ctx.cwd, target);
    const node = lookup(ctx.fs, abs);

    if (!node) {
      errors.push(`ls: ${target}: No such file or directory`);
      continue;
    }

    if (isFile(node)) {
      blocks.push(long ? longFormat(target, node) : target);
      continue;
    }

    const names = listDir(node, { all });
    const decorate = (name: string) => {
      const child = node.children[name];
      return classify && child.type === "dir" ? name + "/" : name;
    };

    const body = long
      ? names.map((name) => longFormat(decorate(name), node.children[name])).join("\n")
      : names.map(decorate).join("  ");

    const header = targets.length > 1 ? `${target}:\n` : "";
    blocks.push(header + body);
  }

  const stdout = blocks.filter((block) => block !== "").join("\n\n");
  return {
    stdout: stdout ? stdout + "\n" : "",
    stderr: errors.length ? errors.join("\n") + "\n" : "",
    code: errors.length ? 1 : 0,
  };
};

/* ----------------------------------- cd ----------------------------------- */

const cd: CommandImpl = (args, _stdin, ctx) => {
  const { operands } = parseArgs(args);
  const target = operands[0];

  if (target === "-") {
    if (!ctx.prevCwd) return fail("cd: OLDPWD not set\n");
    const previous = ctx.prevCwd;
    ctx.setCwd(previous);
    return ok(previous + "\n");
  }

  const abs = resolve(ctx.cwd, target ?? HOME);
  const node = lookup(ctx.fs, abs);

  if (!node) return fail(`cd: ${target}: No such file or directory\n`);
  if (!isDir(node)) return fail(`cd: ${target}: Not a directory\n`);

  ctx.setCwd(abs);
  return ok();
};

/* ---------------------------------- mkdir --------------------------------- */

const mkdir: CommandImpl = (args, _stdin, ctx) => {
  const { flags, operands } = parseArgs(args);
  if (operands.length === 0) return fail("mkdir: missing operand\n");

  const errors: string[] = [];
  for (const operand of operands) {
    const abs = resolve(ctx.cwd, operand);

    if (flags.has("p")) {
      if (!mkdirp(ctx.fs, abs)) errors.push(`mkdir: ${operand}: Not a directory`);
      continue;
    }

    if (lookup(ctx.fs, abs)) {
      errors.push(`mkdir: ${operand}: File exists`);
      continue;
    }
    if (!isDir(lookup(ctx.fs, dirname(abs)))) {
      errors.push(`mkdir: ${operand}: No such file or directory`);
      continue;
    }
    mkdirAt(ctx.fs, abs);
  }

  return errors.length ? fail(errors.join("\n") + "\n") : ok();
};

/* ---------------------------------- touch --------------------------------- */

const touch: CommandImpl = (args, _stdin, ctx) => {
  const { operands } = parseArgs(args);
  if (operands.length === 0) return fail("touch: missing file operand\n");

  const errors: string[] = [];
  for (const operand of operands) {
    const abs = resolve(ctx.cwd, operand);
    if (!touchAt(ctx.fs, abs)) {
      errors.push(`touch: ${operand}: No such file or directory`);
    }
  }

  return errors.length ? fail(errors.join("\n") + "\n") : ok();
};

/* ---------------------------------- echo ---------------------------------- */

const ESCAPES: Record<string, string> = { n: "\n", t: "\t", "\\": "\\" };

const echo: CommandImpl = (args) => {
  let words = args;
  let newline = true;
  let interpret = false;

  while (words[0] === "-n" || words[0] === "-e" || words[0] === "-ne" || words[0] === "-en") {
    if (words[0].includes("n")) newline = false;
    if (words[0].includes("e")) interpret = true;
    words = words.slice(1);
  }

  let text = words.join(" ");
  if (interpret) text = text.replace(/\\(.)/g, (match, char) => ESCAPES[char] ?? match);

  return ok(text + (newline ? "\n" : ""));
};

/* ----------------------------------- cat ---------------------------------- */

const cat: CommandImpl = (args, stdin, ctx) => {
  const { flags, operands } = parseArgs(args);

  let body: string;
  const errors: string[] = [];

  if (operands.length === 0 || operands.every((o) => o === "-")) {
    body = stdin;
  } else {
    const chunks: string[] = [];
    for (const operand of operands) {
      if (operand === "-") {
        chunks.push(stdin);
        continue;
      }
      const abs = resolve(ctx.cwd, operand);
      const node = lookup(ctx.fs, abs);
      if (!node) {
        errors.push(`cat: ${operand}: No such file or directory`);
        continue;
      }
      if (isDir(node)) {
        errors.push(`cat: ${operand}: Is a directory`);
        continue;
      }
      chunks.push(node.content);
    }
    body = chunks.join("");
  }

  if (flags.has("n")) {
    const width = String(toLines(body).length).length;
    body = fromLines(
      toLines(body).map((line, index) => `${String(index + 1).padStart(width + 1)}\t${line}`),
    );
  }

  return {
    stdout: body,
    stderr: errors.length ? errors.join("\n") + "\n" : "",
    code: errors.length ? 1 : 0,
  };
};

/* ---------------------------------- grep ---------------------------------- */

function buildMatcher(pattern: string, ignoreCase: boolean): (line: string) => boolean {
  const flags = ignoreCase ? "i" : "";
  try {
    const regexp = new RegExp(pattern, flags);
    return (line) => regexp.test(line);
  } catch {
    // Not a valid regex — fall back to a literal substring search, which is
    // what a learner typing `grep [ERROR]` almost certainly meant.
    const needle = ignoreCase ? pattern.toLowerCase() : pattern;
    return (line) => (ignoreCase ? line.toLowerCase() : line).includes(needle);
  }
}

const grep: CommandImpl = (args, stdin, ctx) => {
  const { flags, operands } = parseArgs(args);

  if (operands.length === 0) {
    return fail("usage: grep [-icnv] pattern [file ...]\n");
  }

  const [pattern, ...files] = operands;
  const matches = buildMatcher(pattern, flags.has("i"));
  const invert = flags.has("v");
  const showNumbers = flags.has("n");
  const countOnly = flags.has("c");

  const sources: { label: string; content: string }[] = [];
  const errors: string[] = [];

  if (files.length === 0) {
    sources.push({ label: "", content: stdin });
  } else {
    for (const file of files) {
      const abs = resolve(ctx.cwd, file);
      const node = lookup(ctx.fs, abs);
      if (!node) {
        errors.push(`grep: ${file}: No such file or directory`);
        continue;
      }
      if (isDir(node)) {
        errors.push(`grep: ${file}: Is a directory`);
        continue;
      }
      sources.push({ label: file, content: node.content });
    }
  }

  const withPrefix = sources.length > 1;
  const out: string[] = [];
  let total = 0;

  for (const source of sources) {
    const hits: string[] = [];
    toLines(source.content).forEach((line, index) => {
      if (matches(line) === invert) return;
      const prefix = [
        withPrefix ? source.label : null,
        showNumbers ? String(index + 1) : null,
      ]
        .filter((part) => part !== null)
        .join(":");
      hits.push(prefix ? `${prefix}:${line}` : line);
    });

    total += hits.length;
    if (countOnly) {
      out.push(withPrefix ? `${source.label}:${hits.length}` : String(hits.length));
    } else {
      out.push(...hits);
    }
  }

  return {
    stdout: fromLines(out),
    stderr: errors.length ? errors.join("\n") + "\n" : "",
    // grep exits 1 when nothing matched — that is a result, not a failure.
    code: errors.length ? 2 : total > 0 ? 0 : 1,
  };
};

/* ----------------------------------- wc ----------------------------------- */

const wc: CommandImpl = (args, stdin, ctx) => {
  const { flags, operands } = parseArgs(args);

  const sources: { label: string; content: string }[] = [];
  const errors: string[] = [];

  if (operands.length === 0) {
    sources.push({ label: "", content: stdin });
  } else {
    for (const operand of operands) {
      const content = readFile(ctx.fs, resolve(ctx.cwd, operand));
      if (content === null) {
        errors.push(`wc: ${operand}: No such file or directory`);
        continue;
      }
      sources.push({ label: operand, content });
    }
  }

  const only = ["l", "w", "c"].filter((flag) => flags.has(flag));
  const wanted = only.length > 0 ? only : ["l", "w", "c"];

  const out = sources.map((source) => {
    const counts: Record<string, number> = {
      l: toLines(source.content).length,
      w: source.content.split(/\s+/).filter(Boolean).length,
      c: source.content.length,
    };
    const columns = wanted.map((flag) => String(counts[flag]).padStart(wanted.length > 1 ? 8 : 1));
    return [...columns, source.label].filter(Boolean).join(" ").trimEnd();
  });

  return {
    stdout: fromLines(out),
    stderr: errors.length ? errors.join("\n") + "\n" : "",
    code: errors.length ? 1 : 0,
  };
};

/* ------------------------------- head / tail ------------------------------ */

function sliceLines(name: "head" | "tail"): CommandImpl {
  return (args, stdin, ctx) => {
    // `head -5 file` is still common shorthand alongside `head -n 5 file`.
    const shorthand = args.find((arg) => /^-\d+$/.test(arg));
    const rest = args.filter((arg) => arg !== shorthand);
    const { values, operands } = parseArgs(rest, { valueFlags: ["n"] });

    const requested = shorthand ? shorthand.slice(1) : values.n;
    const count = requested === undefined ? 10 : Number.parseInt(requested, 10);
    if (Number.isNaN(count) || count < 0) {
      return fail(`${name}: illegal line count -- ${requested}\n`);
    }

    const errors: string[] = [];
    const sources: { label: string; content: string }[] = [];

    if (operands.length === 0) {
      sources.push({ label: "", content: stdin });
    } else {
      for (const operand of operands) {
        const content = readFile(ctx.fs, resolve(ctx.cwd, operand));
        if (content === null) {
          errors.push(`${name}: ${operand}: No such file or directory`);
          continue;
        }
        sources.push({ label: operand, content });
      }
    }

    const blocks = sources.map((source) => {
      const lines = toLines(source.content);
      const picked = name === "head" ? lines.slice(0, count) : lines.slice(-count || lines.length);
      const header = sources.length > 1 ? `==> ${source.label} <==\n` : "";
      return header + fromLines(picked);
    });

    return {
      stdout: blocks.join(""),
      stderr: errors.length ? errors.join("\n") + "\n" : "",
      code: errors.length ? 1 : 0,
    };
  };
}

/* ---------------------------------- tldr ---------------------------------- */

const tldr: CommandImpl = (args, _stdin, ctx) => {
  const { operands } = parseArgs(args);

  if (args.includes("--list") || args.includes("-l")) {
    return ok(`pages: ${tldrIndex().join(", ")}\n`);
  }

  const name = operands[0];
  if (!name) return fail("usage: tldr <command>\n");

  if (!tldrPage(name)) {
    return fail(`tldr: no page for \`${name}\`. Try: ${tldrIndex().join(", ")}\n`);
  }

  ctx.effects.manual = name;
  return ok(`→ ${name} examples opened in the right pane\n`);
};

/* ---------------------------------- clear --------------------------------- */

const clear: CommandImpl = (_args, _stdin, ctx) => {
  ctx.effects.clear = true;
  return ok();
};

/* -------------------------------- Registry -------------------------------- */

export const COMMANDS: Record<string, CommandImpl> = {
  pwd,
  ls,
  cd,
  mkdir,
  touch,
  cp,
  mv,
  rm,
  echo,
  cat,
  grep,
  wc,
  sort,
  uniq,
  cut,
  tr,
  tee,
  head: sliceLines("head"),
  tail: sliceLines("tail"),
  tldr,
  clear,
};

/** Commands Shelly can run at all, as opposed to ones it has never heard of. */
export function isKnownCommand(name: string): boolean {
  return name in COMMANDS;
}

/**
 * Commands that bypass a level's guardrails, because they are about the game
 * rather than the puzzle.
 */
export const META_COMMANDS = new Set(["tldr", "clear", "help", "reset", "hint", "solve"]);

export type { CommandResult };
export { displayPath, basename };
