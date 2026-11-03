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

export type HistoryStatus = "success" | "error" | "info" | "win" | "hint" | "note";

export interface HistoryItem {
  id: string;
  /** The raw line the user submitted. Empty for system-emitted banners. */
  command: string;
  output: string;
  status: HistoryStatus;
  /** The prompt path shown beside the command, captured at submit time. */
  cwd?: string;
}

/* -------------------------------- Chapters -------------------------------- */

export interface Chapter {
  id: string;
  /** 1-based position in the curriculum; also the unlock order. */
  index: number;
  title: string;
  summary: string;
  /**
   * Commands this chapter introduces. A level allows everything unlocked by
   * its own chapter and every earlier one — guardrails accumulate rather than
   * being whitelisted per level.
   */
  unlocks: string[];
  /** `planned` chapters appear on the map with no levels behind them yet. */
  status: "ready" | "planned";
}

/* --------------------------------- Levels --------------------------------- */

/**
 * Guardrail entry. A command outside a level's allowed set is intercepted
 * before it can touch the filesystem.
 */
export interface CommandBehavior {
  /** One-line reminder, shown by `help`. */
  hint?: string;
}

/** One accepted line this level, with the directory it was typed from. */
export interface Submission {
  script: Script;
  /** Working directory *before* the line ran, for resolving its arguments. */
  cwd: string;
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
  /** Command names in *this* submission only. */
  lineCommands: string[];
  /** Operators in *this* submission only. */
  lineOperators: string[];
  /**
   * Every accepted line this level, oldest first. Levels that only read —
   * navigating, listing, printing — have no filesystem change to assert on,
   * so they assert on what was actually run instead.
   */
  submissions: Submission[];
}

export interface WinCondition {
  /** Operators the submitted line must contain, e.g. ["|"] or [">"]. */
  requiredOperators?: string[];
  /** Command names the submitted line must contain, e.g. ["cat", "grep"]. */
  requiredCommands?: string[];
  /** State/output assertion, so any equivalent syntax is accepted. */
  check: (args: WinCheckArgs) => boolean;
}

/**
 * A targeted response to a near miss. The first diagnostic whose `when`
 * matches an unsuccessful submission is shown instead of silence — the
 * difference between "I got it wrong" and "I see where I went wrong".
 */
export interface Diagnostic {
  when: (args: WinCheckArgs) => boolean;
  say: string;
}

/** The half of a level authored as markdown in `content/levels/`. */
export interface LevelContent {
  id: number;
  chapterId: string;
  title: string;
  description: string;
  /** One-line objective, rendered as the puzzle prompt. Markdown inline. */
  prompt: string;
  /** Markdown body: the teaching text. */
  lesson: string;
  successMessage: string;
  /** The commands this level is *about*, with the reminder `help` prints. */
  focus: Record<string, string>;
  /** Progressive hints, vaguest first. The last one may name the operator. */
  hints: string[];
}

/** The half of a level authored as code in `lib/levels/rules.ts`. */
export interface LevelRules {
  startingPath: string;
  fileTree: VirtualFileSystem;
  winCondition: WinCondition;
  diagnostics?: Diagnostic[];
  /**
   * Command sequences that must solve the level. The first is what `solve`
   * types into the prompt, one line per press.
   */
  solutions: string[][];
  /** Sequences that must NOT solve it — the near misses worth guarding. */
  nearMisses: string[][];
}

export type Level = LevelContent &
  LevelRules & {
    chapter: Chapter;
    /** Everything unlocked so far, keyed by command name. */
    allowedCommands: Record<string, CommandBehavior>;
  };
