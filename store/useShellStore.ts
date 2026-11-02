"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { evaluate } from "@/lib/evaluator";
import { allPaths, clone, displayPath } from "@/lib/fs/vfs";
import { getLevel, hasLevel, lastLevelId } from "@/lib/levels";
import type {
  HistoryItem,
  HistoryStatus,
  Level,
  VirtualFileSystem,
  WinCheckArgs,
} from "@/lib/types";

/** Right-pane contents: the live tree, or a manual page. */
export type StagePanel = { kind: "tree" } | { kind: "manual"; command: string };

/** Attempts without progress before the game offers help unprompted. */
const NUDGE_AFTER = 3;

interface ShellState {
  /* Game state */
  currentLevelId: number;
  isLevelSolved: boolean;

  /* Persisted progress */
  solvedLevelIds: number[];
  /** Levels finished after using `hint` or `solve`, tracked without judgement. */
  helpedLevelIds: number[];
  lastVisitedLevelId: number;

  /* Environment state */
  currentDirectory: string;
  previousDirectory: string | null;
  fileSystem: VirtualFileSystem;
  /** Paths that did not exist when the level started, for tree highlighting. */
  createdPaths: string[];

  /* Terminal state */
  history: HistoryItem[];
  /** Lines the user submitted, newest last — drives arrow-key recall. */
  inputHistory: string[];

  /* Right pane */
  stage: StagePanel;

  /* Help ladder */
  hintsRevealed: number;
  attempts: number;
  nudged: boolean;

  /* Progress bookkeeping used by win conditions */
  commandsRun: string[];
  operatorsUsed: string[];
}

interface ShellActions {
  executeCommand(input: string): void;
  loadLevel(levelId: number): void;
  resetLevel(): void;
  nextLevel(): void;
  showTree(): void;
  showManual(command: string): void;
  printInfo(output: string): void;
  revealHint(): void;
  /** Called when `solve` fills the prompt, so the level is marked as helped. */
  markHelpUsed(): void;
}

export type ShellStore = ShellState & ShellActions;

/* -------------------------------- Helpers --------------------------------- */

let historyCounter = 0;

function makeHistoryItem(
  partial: Omit<HistoryItem, "id"> & { status: HistoryStatus },
): HistoryItem {
  historyCounter += 1;
  return { id: `h${historyCounter}`, ...partial };
}

/** Strip Markdown emphasis from copy that lands in the plain-text scrollback. */
function plain(text: string): string {
  return text.replace(/`([^`]+)`/g, "$1").replace(/\*\*?([^*]+)\*\*?/g, "$1");
}

function banner(level: Level): HistoryItem[] {
  return [
    makeHistoryItem({
      command: "",
      status: "info",
      output:
        `shelly · level ${level.id} — ${level.title}\n${plain(level.prompt)}\n\n` +
        "Type `help` for the commands this level unlocks, `tldr <cmd>` for examples, " +
        "or `hint` when you are stuck.",
    }),
  ];
}

/** Everything that resets when a level starts. Progress is layered on top. */
function freshLevelState(levelId: number) {
  const level = getLevel(levelId);

  return {
    currentLevelId: level.id,
    isLevelSolved: false,
    currentDirectory: level.startingPath,
    previousDirectory: null,
    fileSystem: clone(level.fileTree),
    createdPaths: [],
    history: banner(level),
    inputHistory: [],
    stage: { kind: "tree" } as StagePanel,
    hintsRevealed: 0,
    attempts: 0,
    nudged: false,
    commandsRun: [],
    operatorsUsed: [],
  };
}

/** The catalog is installed before any level loads, so start deliberately bare. */
const EMPTY_STATE: ShellState = {
  currentLevelId: 0,
  isLevelSolved: false,
  solvedLevelIds: [],
  helpedLevelIds: [],
  lastVisitedLevelId: 1,
  currentDirectory: "/",
  previousDirectory: null,
  fileSystem: { type: "dir", children: {} },
  createdPaths: [],
  history: [],
  inputHistory: [],
  stage: { kind: "tree" },
  hintsRevealed: 0,
  attempts: 0,
  nudged: false,
  commandsRun: [],
  operatorsUsed: [],
};

/* --------------------------------- Store ---------------------------------- */

export const useShellStore = create<ShellStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      loadLevel(levelId) {
        if (!hasLevel(levelId)) return;
        set({ ...freshLevelState(levelId), lastVisitedLevelId: levelId });
      },

      resetLevel() {
        get().loadLevel(get().currentLevelId);
      },

      nextLevel() {
        const { currentLevelId } = get();
        if (currentLevelId >= lastLevelId()) return;
        get().loadLevel(currentLevelId + 1);
      },

      showTree() {
        set({ stage: { kind: "tree" } });
      },

      showManual(command) {
        set({ stage: { kind: "manual", command } });
      },

      printInfo(output) {
        set((state) => ({
          history: [...state.history, makeHistoryItem({ command: "", output, status: "info" })],
        }));
      },

      markHelpUsed() {
        const { currentLevelId, helpedLevelIds } = get();
        if (helpedLevelIds.includes(currentLevelId)) return;
        set({ helpedLevelIds: [...helpedLevelIds, currentLevelId] });
      },

      revealHint() {
        const state = get();
        const level = getLevel(state.currentLevelId);
        const index = state.hintsRevealed;

        if (index >= level.hints.length) {
          state.printInfo(
            level.hints.length === 0
              ? "No hints for this level."
              : "That was the last hint. `solve` will type the answer into the prompt for you.",
          );
          return;
        }

        get().markHelpUsed();
        set({
          hintsRevealed: index + 1,
          history: [
            ...state.history,
            makeHistoryItem({
              command: "",
              status: "hint",
              output:
                `hint ${index + 1}/${level.hints.length} — ${plain(level.hints[index])}` +
                (index + 1 < level.hints.length ? "\n(`hint` again for a more specific one)" : ""),
            }),
          ],
        });
      },

      executeCommand(input) {
        const state = get();
        const trimmed = input.trim();
        const level = getLevel(state.currentLevelId);
        const promptCwd = displayPath(state.currentDirectory);

        if (trimmed === "") {
          set({
            history: [
              ...state.history,
              makeHistoryItem({ command: "", output: "", status: "info", cwd: promptCwd }),
            ],
          });
          return;
        }

        /* `hint` is a game command, not a shell command. */
        if (trimmed.split(/\s+/)[0] === "hint") {
          set({
            history: [
              ...state.history,
              makeHistoryItem({ command: trimmed, output: "", status: "info", cwd: promptCwd }),
            ],
            inputHistory: [...state.inputHistory, trimmed],
          });
          get().revealHint();
          return;
        }

        const result = evaluate({
          input: trimmed,
          fs: state.fileSystem,
          cwd: state.currentDirectory,
          prevCwd: state.previousDirectory,
          level,
        });

        /* `reset` throws away everything, including the line that asked for it. */
        if (result.effects.reset) {
          get().resetLevel();
          return;
        }

        const commandsRun = result.blocked
          ? state.commandsRun
          : [...new Set([...state.commandsRun, ...result.commandNames])];
        const operatorsUsed = result.blocked
          ? state.operatorsUsed
          : [...new Set([...state.operatorsUsed, ...result.operators])];

        const winArgs: WinCheckArgs = {
          ast: result.ast ?? { type: "Script", statements: [] },
          stdout: result.stdout,
          fs: result.fs,
          cwd: result.cwd,
          commandsRun,
          operatorsUsed,
          lineCommands: result.commandNames,
          lineOperators: result.operators,
        };

        const { winCondition } = level;
        const satisfiesAst =
          !result.blocked &&
          (winCondition.requiredOperators ?? []).every((op) => result.operators.includes(op)) &&
          (winCondition.requiredCommands ?? []).every((name) =>
            result.commandNames.includes(name),
          );

        const justSolved =
          !state.isLevelSolved && satisfiesAst && winCondition.check(winArgs);

        const initialPaths = new Set(allPaths(level.fileTree));
        const createdPaths = allPaths(result.fs).filter((path) => !initialPaths.has(path));

        const history = [...state.history];
        if (result.effects.clear) history.length = 0;

        history.push(
          makeHistoryItem({
            command: trimmed,
            output: result.output.replace(/\n$/, ""),
            status: result.status,
            cwd: promptCwd,
          }),
        );

        let attempts = state.attempts;
        let nudged = state.nudged;

        if (justSolved) {
          history.push(
            makeHistoryItem({
              command: "",
              output: plain(level.successMessage),
              status: "win",
            }),
          );
        } else if (!state.isLevelSolved && !result.blocked) {
          attempts += 1;

          /* A near miss earns a specific answer rather than silence. */
          const diagnostic = (level.diagnostics ?? []).find((candidate) =>
            candidate.when(winArgs),
          );
          if (diagnostic) {
            history.push(
              makeHistoryItem({ command: "", output: plain(diagnostic.say), status: "note" }),
            );
          }

          if (!nudged && attempts >= NUDGE_AFTER && state.hintsRevealed === 0) {
            nudged = true;
            history.push(
              makeHistoryItem({
                command: "",
                output: "stuck? type `hint` for a nudge, or `tldr <cmd>` to read the docs.",
                status: "note",
              }),
            );
          }
        }

        set({
          fileSystem: result.fs,
          currentDirectory: result.cwd,
          previousDirectory: result.prevCwd,
          createdPaths,
          history,
          inputHistory: [...state.inputHistory, trimmed],
          commandsRun,
          operatorsUsed,
          attempts,
          nudged,
          isLevelSolved: state.isLevelSolved || justSolved,
          solvedLevelIds: justSolved
            ? [...new Set([...state.solvedLevelIds, level.id])]
            : state.solvedLevelIds,
          stage: result.effects.manual
            ? { kind: "manual", command: result.effects.manual }
            : state.stage,
        });
      },
    }),
    {
      name: "shelly.progress",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      /* Only progress survives a reload; the sandbox always starts clean. */
      partialize: (state) => ({
        solvedLevelIds: state.solvedLevelIds,
        helpedLevelIds: state.helpedLevelIds,
        lastVisitedLevelId: state.lastVisitedLevelId,
      }),
    },
  ),
);
