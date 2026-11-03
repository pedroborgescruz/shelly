import {
  basename,
  contains,
  isDir,
  lookup,
  putNode,
  removeNode,
  resolve,
} from "@/lib/fs/vfs";
import type { VNode } from "@/lib/types";
import { fail, ok, parseArgs, type CommandImpl, type CommandResult } from "./types";

/**
 * Resolve where a copy or move should land.
 *
 * `cp a b` means "call it b" unless `b` is an existing directory, in which
 * case it means "put it inside b" — the single rule behind most `cp`/`mv`
 * surprises.
 */
function destinationFor(
  cwd: string,
  fs: Parameters<typeof lookup>[0],
  sourceAbs: string,
  rawDestination: string,
): string {
  const destAbs = resolve(cwd, rawDestination);
  const node = lookup(fs, destAbs);
  if (isDir(node)) return `${destAbs === "/" ? "" : destAbs}/${basename(sourceAbs)}`;
  return destAbs;
}

function transfer(
  name: "cp" | "mv",
  args: string[],
  ctx: Parameters<CommandImpl>[2],
): CommandResult {
  const { flags, operands } = parseArgs(args);
  const recursive = flags.has("r") || flags.has("R");

  if (operands.length < 2) {
    return fail(`${name}: missing destination file operand\n`);
  }

  const sources = operands.slice(0, -1);
  const rawDestination = operands[operands.length - 1];
  const destinationAbs = resolve(ctx.cwd, rawDestination);
  const destinationIsDir = isDir(lookup(ctx.fs, destinationAbs));

  if (sources.length > 1 && !destinationIsDir) {
    return fail(`${name}: target ${rawDestination} is not a directory\n`);
  }

  const errors: string[] = [];

  for (const source of sources) {
    const sourceAbs = resolve(ctx.cwd, source);
    const node = lookup(ctx.fs, sourceAbs);

    if (!node) {
      errors.push(`${name}: ${source}: No such file or directory`);
      continue;
    }

    if (node.type === "dir" && name === "cp" && !recursive) {
      errors.push(`cp: ${source} is a directory (not copied)`);
      continue;
    }

    const targetAbs = destinationFor(ctx.cwd, ctx.fs, sourceAbs, rawDestination);

    if (contains(sourceAbs, targetAbs)) {
      errors.push(`${name}: cannot ${name === "cp" ? "copy" : "move"} \`${source}\` into itself`);
      continue;
    }

    const payload: VNode = name === "cp" ? structuredClone(node) : node;

    if (!putNode(ctx.fs, targetAbs, payload)) {
      errors.push(`${name}: ${rawDestination}: No such file or directory`);
      continue;
    }

    if (name === "mv") removeNode(ctx.fs, sourceAbs);
  }

  return errors.length ? fail(errors.join("\n") + "\n") : ok();
}

export const cp: CommandImpl = (args, _stdin, ctx) => transfer("cp", args, ctx);
export const mv: CommandImpl = (args, _stdin, ctx) => transfer("mv", args, ctx);

export const rm: CommandImpl = (args, _stdin, ctx) => {
  const { flags, operands } = parseArgs(args);
  const recursive = flags.has("r") || flags.has("R");
  const force = flags.has("f");

  if (operands.length === 0) {
    return force ? ok() : fail("rm: missing operand\n");
  }

  const errors: string[] = [];

  for (const operand of operands) {
    const abs = resolve(ctx.cwd, operand);
    const node = lookup(ctx.fs, abs);

    if (!node) {
      if (!force) errors.push(`rm: ${operand}: No such file or directory`);
      continue;
    }

    if (node.type === "dir" && !recursive) {
      errors.push(`rm: ${operand}: is a directory`);
      continue;
    }

    /* Deleting the directory you are standing in would strand the prompt. */
    if (contains(abs, ctx.cwd)) {
      errors.push(`rm: ${operand}: cannot remove the current directory`);
      continue;
    }

    removeNode(ctx.fs, abs);
  }

  return errors.length ? fail(errors.join("\n") + "\n") : ok();
};
