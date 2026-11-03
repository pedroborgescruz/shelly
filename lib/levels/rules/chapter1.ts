import { HOME, lookup, resolve } from "@/lib/fs/vfs";
import type { LevelRules, Script, VirtualFileSystem } from "@/lib/types";
import { operandsOf, ran } from "../assert";
import { orientationWorld } from "../worlds";

const PROJECTS = `${HOME}/projects`;
const WEB = `${PROJECTS}/web`;
const SRC = `${WEB}/src`;
const NOTES = `${HOME}/notes`;

/**
 * `ls -a` aimed at the home directory — either with no path at all while
 * standing there, or with a path that resolves to it. Without this, `ls -a
 * projects` would satisfy a level that asks about hidden entries in *home*.
 */
const revealedHiddenAtHome = (submissions: Parameters<typeof ran>[0]) =>
  ran(submissions, "ls", {
    flags: ["a"],
    where: (command, cwd) => {
      const operands = operandsOf(command);
      if (operands.length === 0) return cwd === HOME;
      return operands.every((operand) => resolve(cwd, operand) === HOME);
    },
  });

/** True when the submitted line pointed `ls` at a path that is not there. */
const lsMissedItsTarget = (ast: Script, cwd: string, fs: VirtualFileSystem) =>
  ran([{ script: ast, cwd }], "ls", {
    where: (command, from) =>
      operandsOf(command).some((operand) => !lookup(fs, resolve(from, operand))),
  });

/** True when a `cd` in this level was given an absolute path. */
const usedAbsoluteCd = (submissions: Parameters<typeof ran>[0]) =>
  ran(submissions, "cd", {
    where: (command) => operandsOf(command).some((operand) => operand.startsWith("/")),
  });

export const CHAPTER_1_RULES: Record<number, LevelRules> = {
  1: {
    startingPath: HOME,
    fileTree: orientationWorld(),

    winCondition: {
      check: ({ commandsRun }) => commandsRun.includes("pwd") && commandsRun.includes("ls"),
    },

    diagnostics: [
      {
        when: ({ commandsRun }) => commandsRun.includes("pwd") && !commandsRun.includes("ls"),
        say: "Good — that answers *where*. Now ask *what*, with `ls`.",
      },
      {
        when: ({ commandsRun }) => commandsRun.includes("ls") && !commandsRun.includes("pwd"),
        say: "Good — that answers *what*. You still have not asked *where*: `pwd`.",
      },
      {
        when: ({ commandsRun }) => !commandsRun.includes("pwd") && !commandsRun.includes("ls"),
        say: "Neither question is answered yet. `pwd` tells you where you are; `ls` tells you what is here.",
      },
    ],

    solutions: [
      ["pwd", "ls"],
      ["ls -la", "pwd"],
    ],
    nearMisses: [["pwd"], ["ls"], ["cd notes"]],
  },

  2: {
    startingPath: HOME,
    fileTree: orientationWorld(),

    winCondition: {
      check: ({ submissions }) =>
        revealedHiddenAtHome(submissions) &&
        ran(submissions, "ls", { operandPaths: [PROJECTS] }),
    },

    diagnostics: [
      {
        when: ({ ast, cwd, fs }) => lsMissedItsTarget(ast, cwd, fs),
        say: "That path does not exist from where you are standing. You are *already in* your home directory — `ls -a` on its own lists what is here.",
      },
      {
        when: ({ cwd }) => cwd !== HOME,
        say: "You moved. The point is to look without going: `ls` takes a path, so you can read `projects` from here.",
      },
      {
        when: ({ submissions }) => !revealedHiddenAtHome(submissions),
        say: "Plain `ls` skips every name that begins with a dot. There is a one-letter flag that stops it doing that.",
      },
      {
        when: ({ submissions }) => !ran(submissions, "ls", { operandPaths: [PROJECTS] }),
        say: "Hidden entries found. Now point `ls` at `projects` instead of moving into it.",
      },
    ],

    solutions: [
      ["ls -a", "ls projects"],
      ["ls -la", "ls ./projects"],
      ["ls -a", "ls ~/projects"],
    ],
    nearMisses: [
      ["ls"],
      ["ls -a"],
      ["ls -a home"],
      ["ls -a projects", "ls projects"],
      ["cd projects", "ls"],
      ["ls projects"],
    ],
  },

  3: {
    startingPath: HOME,
    fileTree: orientationWorld(),

    winCondition: {
      check: ({ cwd, commandsRun }) => cwd === WEB && commandsRun.includes("pwd"),
    },

    diagnostics: [
      {
        when: ({ cwd, commandsRun }) => cwd === WEB && !commandsRun.includes("pwd"),
        say: "You are standing in the right place. Confirm it with `pwd` — never trust a prompt you have not checked.",
      },
      {
        when: ({ cwd, commandsRun }) => cwd !== WEB && commandsRun.includes("cd"),
        say: "Not there yet. `pwd` will tell you where you actually ended up.",
      },
      {
        when: ({ cwd }) => cwd !== "/home/shelly/projects/web",
        say: "`cd` is how you move; nothing else here will. The target is `projects/web`.",
      },
    ],

    solutions: [
      ["cd projects/web", "pwd"],
      ["cd projects", "cd web", "pwd"],
      ["cd /home/shelly/projects/web", "pwd"],
    ],
    nearMisses: [["cd projects", "pwd"], ["cd web"], ["cd projects/web"], ["pwd"]],
  },

  4: {
    startingPath: SRC,
    fileTree: orientationWorld(),

    winCondition: {
      check: ({ cwd, submissions }) => cwd === HOME && !usedAbsoluteCd(submissions),
    },

    diagnostics: [
      {
        when: ({ submissions }) => usedAbsoluteCd(submissions),
        say: "That gets you there, but typing the full address is the thing this level is asking you to avoid. `..` means *up one*.",
      },
      {
        when: ({ cwd }) => cwd !== HOME && cwd !== SRC,
        say: "Partway. Count the levels between you and home, and climb the rest.",
      },
      {
        when: ({ cwd, commandsRun }) => cwd === SRC && commandsRun.includes("cd"),
        say: "You have not moved. `cd ..` goes up one level; `..` can be chained with `/`.",
      },
      {
        when: ({ cwd }) => cwd !== "/home/shelly",
        say: "Still not home. `cd ..` climbs one level — and `..` can be chained with `/`.",
      },
    ],

    solutions: [
      ["cd ../../.."],
      ["cd ..", "cd ..", "cd .."],
      ["cd ~"],
      ["cd"],
    ],
    nearMisses: [["cd /home/shelly"], ["cd ../.."], ["cd .."], ["pwd"]],
  },

  5: {
    startingPath: NOTES,
    fileTree: orientationWorld(),

    winCondition: {
      check: ({ cwd, submissions }) =>
        cwd === NOTES && ran(submissions, "ls", { operandPaths: [SRC] }),
    },

    diagnostics: [
      {
        when: ({ cwd }) => cwd !== NOTES,
        say: "You left `notes`. Reaching across the tree is the whole point — `ls` accepts any path from where you stand.",
      },
      {
        when: ({ submissions }) =>
          ran(submissions, "ls", { where: (command) => operandsOf(command).length > 0 }) &&
          !ran(submissions, "ls", { operandPaths: [SRC] }),
        say: "Closer — but the path has to reach all the way down to `src`.",
      },
      {
        when: ({ submissions }) =>
          !ran(submissions, "ls", { where: (command) => operandsOf(command).length > 0 }),
        say: "`ls` with no argument only ever shows you where you already are. Give it a path.",
      },
    ],

    solutions: [
      ["ls ../projects/web/src"],
      ["ls /home/shelly/projects/web/src"],
      ["ls ~/projects/web/src"],
    ],
    nearMisses: [["ls"], ["cd ../projects/web/src", "ls"], ["ls ../projects"]],
  },
};
