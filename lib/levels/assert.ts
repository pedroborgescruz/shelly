import { resolve } from "@/lib/fs/vfs";
import { commandsIn } from "@/lib/parser/parse";
import type { Command, Submission } from "@/lib/types";

/**
 * Helpers for win conditions on levels that only read.
 *
 * They work on the AST, never on the raw line, so `ls -la`, `ls -a -l` and
 * `ls -al` are the same assertion.
 */

/** True when the command carries a short flag, bundled or not. */
export function hasFlag(command: Command, letter: string): boolean {
  return command.args.some(
    (arg) => arg.startsWith("-") && !arg.startsWith("--") && arg.slice(1).includes(letter),
  );
}

/** The command's non-flag arguments. */
export function operandsOf(command: Command): string[] {
  const operands: string[] = [];
  let skipNext = false;

  for (const arg of command.args) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    if (arg === "--") continue;
    if (arg.startsWith("-") && arg.length > 1) {
      /* `-n 3` and `-d ' '` carry their value in the next argument. */
      if (/^-[ndfc]$/.test(arg)) skipNext = true;
      continue;
    }
    operands.push(arg);
  }

  return operands;
}

/** The value of a flag written as `-n 3` or `-n3`. */
export function flagValue(command: Command, letter: string): string | null {
  for (const [index, arg] of command.args.entries()) {
    if (arg === `-${letter}`) return command.args[index + 1] ?? null;
    if (arg.startsWith(`-${letter}`) && arg.length > 2 && !arg.startsWith("--")) {
      return arg.slice(2);
    }
    if (letter === "n" && /^-\d+$/.test(arg)) return arg.slice(1);
  }
  return null;
}

export interface RanOptions {
  /** Every operand must resolve to one of these absolute paths. */
  operandPaths?: string[];
  /** The command must carry all of these short flags. */
  flags?: string[];
  /** Free-form extra check against the command and the directory it ran from. */
  where?: (command: Command, cwd: string) => boolean;
}

/** True when some accepted line ran `name` matching every given constraint. */
export function ran(
  submissions: Submission[],
  name: string,
  options: RanOptions = {},
): boolean {
  return submissions.some(({ script, cwd }) =>
    commandsIn(script)
      .filter((command) => command.name === name)
      .some((command) => {
        if (options.flags && !options.flags.every((flag) => hasFlag(command, flag))) {
          return false;
        }

        if (options.operandPaths) {
          const resolved = operandsOf(command).map((operand) => resolve(cwd, operand));
          const wanted = options.operandPaths;
          const matches =
            resolved.length === wanted.length &&
            wanted.every((path) => resolved.includes(path));
          if (!matches) return false;
        }

        return options.where ? options.where(command, cwd) : true;
      }),
  );
}

/** How many accepted lines ran `name`. */
export function countRan(submissions: Submission[], name: string): number {
  return submissions.filter(({ script }) =>
    commandsIn(script).some((command) => command.name === name),
  ).length;
}

/** Every absolute path any command in any submission referred to. */
export function allOperandPaths(submissions: Submission[]): string[] {
  return submissions.flatMap(({ script, cwd }) =>
    commandsIn(script).flatMap((command) =>
      operandsOf(command).map((operand) => resolve(cwd, operand)),
    ),
  );
}
