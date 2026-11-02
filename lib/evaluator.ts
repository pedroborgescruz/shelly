import { COMMANDS, META_COMMANDS, isKnownCommand } from "@/lib/commands";
import type { Effects, ExecContext } from "@/lib/commands/types";
import { fail, ok, type CommandResult } from "@/lib/commands/types";
import { clone, readFile, resolve, writeFile } from "@/lib/fs/vfs";
import { ParseError, astOperators, commandNamesIn, commandsIn, parse } from "@/lib/parser/parse";
import { tldrIndex } from "@/lib/tldr";
import type {
  Command,
  HistoryStatus,
  Level,
  PipelineNode,
  Script,
  VirtualFileSystem,
} from "@/lib/types";

export interface EvaluateInput {
  input: string;
  fs: VirtualFileSystem;
  cwd: string;
  prevCwd: string | null;
  level: Level;
}

export interface EvaluateResult {
  /** New filesystem. Identical to the input one when nothing was written. */
  fs: VirtualFileSystem;
  cwd: string;
  prevCwd: string | null;
  output: string;
  /** Just the stdout chunks, so win conditions can assert on real output. */
  stdout: string;
  status: HistoryStatus;
  effects: Effects;
  /** Null when the line could not be parsed or was intercepted. */
  ast: Script | null;
  commandNames: string[];
  operators: string[];
  /** True when a guardrail stopped the line before it ran. */
  blocked: boolean;
}

/* ------------------------------- Guardrails ------------------------------- */

interface Guardrail {
  message: string;
}

function checkGuardrails(script: Script, level: Level): Guardrail | null {
  for (const command of commandsIn(script)) {
    const { name } = command;
    if (META_COMMANDS.has(name)) continue;

    if (!isKnownCommand(name)) {
      return { message: `shelly: ${name}: command not found` };
    }

    if (!(name in level.allowedCommands)) {
      const unlocked = Object.keys(level.allowedCommands).join(", ");
      return {
        message:
          `${name}: not needed for this puzzle.\n` +
          `This level unlocks: ${unlocked}. Type \`help\` for the objective.`,
      };
    }
  }
  return null;
}

/* ----------------------------- Meta commands ------------------------------ */

function runMeta(command: Command, level: Level, effects: Effects): CommandResult | null {
  if (command.name === "help") {
    const unlocked = Object.keys(level.allowedCommands)
      .map((name) => `  ${name.padEnd(8)}${level.allowedCommands[name].hint ?? ""}`)
      .join("\n");
    return ok(
      [
        `Level ${level.id} — ${level.title}`,
        ``,
        `  objective  ${level.prompt}`,
        ``,
        `Commands unlocked here:`,
        unlocked,
        ``,
        `  tldr <cmd>  practical examples in the right pane (${tldrIndex().length} pages)`,
        `  reset       start this level over`,
        `  clear       wipe the scrollback`,
        ``,
      ].join("\n"),
    );
  }

  if (command.name === "reset") {
    effects.reset = true;
    return ok("level reset\n");
  }

  return null;
}

/* -------------------------------- Execution ------------------------------- */

function execCommand(
  command: Command,
  stdin: string,
  ctx: ExecContext,
  level: Level,
): CommandResult {
  const meta = runMeta(command, level, ctx.effects);
  if (meta) return meta;

  const impl = COMMANDS[command.name];
  if (!impl) return fail(`shelly: ${command.name}: command not found\n`);

  // `<` replaces standard input before the command ever sees it.
  const inputRedirect = command.redirects.find((redirect) => redirect.op === "<");
  let effectiveStdin = stdin;
  if (inputRedirect) {
    const abs = resolve(ctx.cwd, inputRedirect.file);
    const content = readFile(ctx.fs, abs);
    if (content === null) {
      return fail(`shelly: ${inputRedirect.file}: No such file or directory\n`);
    }
    effectiveStdin = content;
  }

  const result = impl(command.args, effectiveStdin, ctx);

  // `>` and `>>` divert standard output into the filesystem.
  const outputRedirects = command.redirects.filter((redirect) => redirect.op !== "<");
  if (outputRedirects.length === 0) return result;

  let stderr = result.stderr;
  for (const redirect of outputRedirects) {
    const abs = resolve(ctx.cwd, redirect.file);
    const wrote = writeFile(ctx.fs, abs, result.stdout, { append: redirect.op === ">>" });
    if (!wrote) stderr += `shelly: ${redirect.file}: No such file or directory\n`;
  }

  return { stdout: "", stderr, code: stderr ? 1 : result.code };
}

/** One chunk of terminal output, tagged with the stream it came from. */
interface OutputChunk {
  text: string;
  stream: "stdout" | "stderr";
}

function execNode(
  node: PipelineNode,
  ctx: ExecContext,
  level: Level,
  out: OutputChunk[],
): CommandResult {
  if (node.type === "LogicalExpression") {
    const left = execNode(node.left, ctx, level, out);
    const shouldRun = node.op === "&&" ? left.code === 0 : left.code !== 0;
    return shouldRun ? execNode(node.right, ctx, level, out) : left;
  }

  let stdin = "";
  let result: CommandResult = ok();

  for (const [index, command] of node.commands.entries()) {
    result = execCommand(command, stdin, ctx, level);
    if (result.stderr) out.push({ text: result.stderr, stream: "stderr" });
    const isLast = index === node.commands.length - 1;
    stdin = result.stdout;
    if (isLast && result.stdout) out.push({ text: result.stdout, stream: "stdout" });
  }

  return result;
}

/* --------------------------------- Entry ---------------------------------- */

export function evaluate({ input, fs, cwd, prevCwd, level }: EvaluateInput): EvaluateResult {
  const base: Omit<EvaluateResult, "output" | "stdout" | "status"> = {
    fs,
    cwd,
    prevCwd,
    effects: {},
    ast: null,
    commandNames: [],
    operators: [],
    blocked: false,
  };

  let script: Script;
  try {
    script = parse(input);
  } catch (error) {
    const message = error instanceof ParseError ? error.message : "syntax error";
    return { ...base, output: `shelly: ${message}\n`, stdout: "", status: "error" };
  }

  if (script.statements.length === 0) {
    return { ...base, output: "", stdout: "", status: "info" };
  }

  const guardrail = checkGuardrails(script, level);
  if (guardrail) {
    return {
      ...base,
      blocked: true,
      output: guardrail.message + "\n",
      stdout: "",
      status: "error",
      ast: script,
      commandNames: commandNamesIn(script),
      operators: astOperators(script),
    };
  }

  // Everything runs against a copy, so a failed line cannot leave the
  // filesystem half-mutated and React still sees a new object to render.
  const workingFs = clone(fs);
  const ctx: ExecContext = {
    fs: workingFs,
    cwd,
    prevCwd,
    setCwd(path: string) {
      ctx.prevCwd = ctx.cwd;
      ctx.cwd = path;
    },
    effects: {},
  };

  const out: OutputChunk[] = [];
  for (const statement of script.statements) {
    execNode(statement, ctx, level, out);
  }

  // A diagnostic on stderr is what makes a line an error. An exit code alone
  // is not: `grep` exits 1 when nothing matched, which is a real answer.
  const hadError = out.some((chunk) => chunk.stream === "stderr");

  return {
    fs: workingFs,
    cwd: ctx.cwd,
    prevCwd: ctx.prevCwd,
    output: out.map((chunk) => chunk.text).join(""),
    stdout: out
      .filter((chunk) => chunk.stream === "stdout")
      .map((chunk) => chunk.text)
      .join(""),
    status: hadError ? "error" : "success",
    effects: ctx.effects,
    ast: script,
    commandNames: commandNamesIn(script),
    operators: astOperators(script),
    blocked: false,
  };
}
