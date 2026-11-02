"use client";

import { create } from "zustand";
import { evaluate } from "@/lib/evaluator";
import { allPaths, clone, displayPath } from "@/lib/fs/vfs";
import { FIRST_LEVEL_ID, LAST_LEVEL_ID, getLevel } from "@/lib/levels";
import type { HistoryItem, HistoryStatus, Level, VirtualFileSystem } from "@/lib/types";

/** Right-pane contents: the live tree, or a manual page. */
export type StagePanel = { kind: "tree" } | { kind: "manual"; command: string };

interface ShellState {
  /* Game state */
  currentLevelId: number;
  isLevelSolved: boolean;
  solvedLevelIds: number[];

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
  /** Append a system line to the scrollback, e.g. tab-completion candidates. */
  printInfo(output: string): void;
}

export type ShellStore = ShellState & ShellActions;

/* -------------------------------- Helpers --------------------------------- */

let historyCounter = 0;

/** Strip Markdown emphasis from copy that lands in the plain-text scrollback. */
function plain(text: string): string {
  return text.replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");
}

function makeHistoryItem(
  partial: Omit<HistoryItem, "id"> & { status: HistoryStatus },
): HistoryItem {
  historyCounter += 1;
  return { id: `h${historyCounter}`, ...partial };
}

function banner(level: Level): HistoryItem[] {
  return [
    makeHistoryItem({
      command: "",
      status: "info",
      output: `shelly · level ${level.id} — ${level.title}\n${plain(level.prompt)}\n\nType \`help\` for the commands this level unlocks, or \`tldr <cmd>\` for examples.`,
    }),
  ];
}

function freshLevelState(levelId: number): ShellState {
  const level = getLevel(levelId);
  const fileSystem = clone(level.initialState.fileTree);

  return {
    currentLevelId: level.id,
    isLevelSolved: false,
    solvedLevelIds: [],
    currentDirectory: level.initialState.startingPath,
    previousDirectory: null,
    fileSystem,
    createdPaths: [],
    history: banner(level),
    inputHistory: [],
    stage: { kind: "tree" },
    commandsRun: [],
    operatorsUsed: [],
  };
}

/* --------------------------------- Store ---------------------------------- */

export const useShellStore = create<ShellStore>((set, get) => ({
  ...freshLevelState(FIRST_LEVEL_ID),

  loadLevel(levelId) {
    const solved = get().solvedLevelIds;
    set({ ...freshLevelState(levelId), solvedLevelIds: solved });
  },

  resetLevel() {
    get().loadLevel(get().currentLevelId);
  },

  nextLevel() {
    const { currentLevelId } = get();
    if (currentLevelId >= LAST_LEVEL_ID) return;
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

    const inputHistory = [...state.inputHistory, trimmed];

    const commandsRun = result.blocked
      ? state.commandsRun
      : [...new Set([...state.commandsRun, ...result.commandNames])];
    const operatorsUsed = result.blocked
      ? state.operatorsUsed
      : [...new Set([...state.operatorsUsed, ...result.operators])];

    /* Does this submission satisfy the level? */
    const { winCondition } = level;
    const satisfiesAst =
      !result.blocked &&
      (winCondition.requiredOperators ?? []).every((op) => result.operators.includes(op)) &&
      (winCondition.requiredCommands ?? []).every((name) => result.commandNames.includes(name));

    const justSolved =
      !state.isLevelSolved &&
      satisfiesAst &&
      winCondition.check({
        ast: result.ast ?? { type: "Script", statements: [] },
        stdout: result.stdout,
        fs: result.fs,
        cwd: result.cwd,
        commandsRun,
        operatorsUsed,
      });

    const initialPaths = new Set(allPaths(level.initialState.fileTree));
    const createdPaths = allPaths(result.fs).filter((path) => !initialPaths.has(path));

    const history = [...state.history];
    if (result.effects.clear) {
      history.length = 0;
    }
    history.push(
      makeHistoryItem({
        command: trimmed,
        output: result.output.replace(/\n$/, ""),
        status: result.status,
        cwd: promptCwd,
      }),
    );
    if (justSolved) {
      history.push(
        makeHistoryItem({
          command: "",
          output: plain(level.successMessage),
          status: "win",
        }),
      );
    }

    set({
      fileSystem: result.fs,
      currentDirectory: result.cwd,
      previousDirectory: result.prevCwd,
      createdPaths,
      history,
      inputHistory,
      commandsRun,
      operatorsUsed,
      isLevelSolved: state.isLevelSolved || justSolved,
      solvedLevelIds: justSolved
        ? [...new Set([...state.solvedLevelIds, level.id])]
        : state.solvedLevelIds,
      stage: result.effects.manual
        ? { kind: "manual", command: result.effects.manual }
        : state.stage,
    });
  },
}));
