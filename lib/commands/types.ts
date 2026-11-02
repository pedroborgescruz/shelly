import type { VirtualFileSystem } from "@/lib/types";

/** Side effects a command can request from the UI layer. */
export interface Effects {
  /** Render this command's tldr page in the right pane. */
  manual?: string;
  /** Wipe the scrollback. */
  clear?: boolean;
  /** Restart the level with a fresh filesystem. */
  reset?: boolean;
}

export interface ExecContext {
  /** Mutable working copy of the filesystem for this submission. */
  fs: VirtualFileSystem;
  cwd: string;
  /** Where `cd -` goes back to. Null at the start of a level. */
  prevCwd: string | null;
  setCwd(path: string): void;
  effects: Effects;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  code: number;
}

export type CommandImpl = (
  args: string[],
  stdin: string,
  ctx: ExecContext,
) => CommandResult;

export function ok(stdout = ""): CommandResult {
  return { stdout, stderr: "", code: 0 };
}

export function fail(stderr: string, code = 1): CommandResult {
  return { stdout: "", stderr, code };
}

/** Split a stream into lines, dropping the trailing newline's empty tail. */
export function toLines(text: string): string[] {
  if (text === "") return [];
  const lines = text.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/** Join lines back into a stream with a trailing newline. */
export function fromLines(lines: string[]): string {
  return lines.length === 0 ? "" : lines.join("\n") + "\n";
}

export interface ParsedArgs {
  flags: Set<string>;
  values: Record<string, string>;
  operands: string[];
}

/**
 * Minimal POSIX-ish option parsing: bundled short flags (`-la`), flags that
 * take a value (`-n 5` or `-n5`), `--` to stop parsing.
 */
export function parseArgs(
  args: string[],
  { valueFlags = [] }: { valueFlags?: string[] } = {},
): ParsedArgs {
  const flags = new Set<string>();
  const values: Record<string, string> = {};
  const operands: string[] = [];

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--") {
      operands.push(...args.slice(i + 1));
      break;
    }

    if (arg.length > 1 && arg.startsWith("-") && !/^-\d+$/.test(arg)) {
      const chars = arg.slice(1).split("");
      for (let j = 0; j < chars.length; j += 1) {
        const char = chars[j];
        if (!valueFlags.includes(char)) {
          flags.add(char);
          continue;
        }
        const inline = chars.slice(j + 1).join("");
        if (inline) {
          values[char] = inline;
          j = chars.length;
        } else {
          i += 1;
          values[char] = args[i] ?? "";
        }
      }
      i += 1;
      continue;
    }

    operands.push(arg);
    i += 1;
  }

  return { flags, values, operands };
}
