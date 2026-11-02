/** Core domain types for Shelly. */

/* ------------------------------- Filesystem ------------------------------- */

export interface VFile {
  type: "file";
  content: string;
}

export interface VDir {
  type: "dir";
  children: Record<string, VNode>;
}

export type VNode = VFile | VDir;

/** The root of a virtual filesystem is always a directory. */
export type VirtualFileSystem = VDir;

/* ---------------------------------- AST ----------------------------------- */

export interface Redirect {
  type: "Redirect";
  op: ">" | ">>" | "<";
  file: string;
}

export interface Command {
  type: "Command";
  name: string;
  args: string[];
  redirects: Redirect[];
}

export interface Pipeline {
  type: "Pipeline";
  commands: Command[];
}

export interface LogicalExpression {
  type: "LogicalExpression";
  op: "&&" | "||";
  left: PipelineNode;
  right: PipelineNode;
}

export type PipelineNode = Pipeline | LogicalExpression;

export interface Script {
  type: "Script";
  statements: PipelineNode[];
}

/* -------------------------------- Terminal -------------------------------- */

export type HistoryStatus = "success" | "error" | "info" | "win";

export interface HistoryItem {
  id: string;
  /** The raw line the user submitted. Empty for system-emitted banners. */
  command: string;
  output: string;
  status: HistoryStatus;
  /** The prompt path shown beside the command, captured at submit time. */
  cwd?: string;
}

/* --------------------------------- Levels --------------------------------- */

/**
 * Guardrail entry. A command absent from a level's `allowedCommands` is
 * intercepted before it can touch the filesystem.
 */
export interface CommandBehavior {
  /** Shown after an attempt that ran but did not satisfy the objective. */
  hint?: string;
}

export interface WinCheckArgs {
  /** The parsed script the user just submitted. */
  ast: Script;
  /** stdout of the final statement. */
  stdout: string;
  /** Filesystem after execution. */
  fs: VirtualFileSystem;
  /** Working directory after execution. */
  cwd: string;
  /** Every command name the user has successfully run during this level. */
  commandsRun: string[];
  /** Every operator the user has used during this level. */
  operatorsUsed: string[];
}

export interface WinCondition {
  /** Operators the submitted line must contain, e.g. ["|"] or [">"]. */
  requiredOperators?: string[];
  /** Command names the submitted line must contain, e.g. ["cat", "grep"]. */
  requiredCommands?: string[];
  /** State/output assertion, so any equivalent syntax is accepted. */
  check: (args: WinCheckArgs) => boolean;
}

export interface Level {
  id: number;
  title: string;
  /** Short subtitle for the lesson header. */
  description: string;
  /** Markdown body: the teaching text. */
  lesson: string;
  /** One-line objective, rendered as the puzzle prompt. */
  prompt: string;

  initialState: {
    startingPath: string;
    fileTree: VirtualFileSystem;
  };

  allowedCommands: Record<string, CommandBehavior>;

  winCondition: WinCondition;

  successMessage: string;
}
