import { HOME } from "@/lib/fs/vfs";
import type { Command, LevelRules } from "@/lib/types";
import { flagValue, operandsOf, ran } from "../assert";
import { logsWorld } from "../worlds";

const PROJECTS = `${HOME}/projects`;
const APP = `${PROJECTS}/logs/app.log`;
const ACCESS = `${PROJECTS}/logs/access.log`;
const README = `${PROJECTS}/README.md`;

/** `head -n 3`, `head -n3` and `head -3` all mean the same thing. */
const countsThree = (command: Command) => flagValue(command, "n") === "3";

const hasOperands = (command: Command) => operandsOf(command).length > 0;

export const CHAPTER_3_RULES: Record<number, LevelRules> = {
  12: {
    startingPath: PROJECTS,
    fileTree: logsWorld(),

    winCondition: {
      check: ({ submissions }) => ran(submissions, "cat", { operandPaths: [README] }),
    },

    diagnostics: [
      {
        when: ({ submissions }) =>
          ran(submissions, "cat", { where: (command) => !hasOperands(command) }),
        say: "`cat` with no filename reads from your keyboard instead of from disk. Give it the file you want to see.",
      },
      {
        when: ({ lineCommands }) => lineCommands.includes("ls"),
        say: "`ls` shows you that the file exists. `cat` shows you what is inside it.",
      },
      {
        when: ({ submissions }) => !ran(submissions, "cat"),
        say: "Reading a file is one command and one argument.",
      },
    ],

    solutions: [["cat README.md"], ["cat ./README.md"], ["cat /home/shelly/projects/README.md"]],
    nearMisses: [["ls"], ["cat"], ["cat logs"], ["cat readme.md"]],
  },

  13: {
    startingPath: PROJECTS,
    fileTree: logsWorld(),

    winCondition: {
      check: ({ submissions }) =>
        ran(submissions, "head", { operandPaths: [APP], where: countsThree }) &&
        ran(submissions, "tail", { operandPaths: [APP], where: countsThree }),
    },

    diagnostics: [
      {
        when: ({ submissions }) =>
          ran(submissions, "head", { operandPaths: [APP] }) &&
          !ran(submissions, "head", { operandPaths: [APP], where: countsThree }),
        say: "That printed the default 10 lines. Ask for a specific count with `-n 3` (or just `-3`).",
      },
      {
        when: ({ submissions }) =>
          ran(submissions, "head", { operandPaths: [APP], where: countsThree }) &&
          !ran(submissions, "tail", { operandPaths: [APP] }),
        say: "That is the top of the file. Now the other end — `tail`.",
      },
      {
        when: ({ submissions }) =>
          ran(submissions, "tail", { operandPaths: [APP], where: countsThree }) &&
          !ran(submissions, "head", { operandPaths: [APP] }),
        say: "That is the bottom of the file. The first three lines still need `head`.",
      },
      {
        when: ({ submissions }) => !ran(submissions, "head") || !ran(submissions, "tail"),
        say: "Two commands are needed: one for the first lines, one for the last.",
      },
    ],

    solutions: [
      ["head -n 3 logs/app.log", "tail -n 3 logs/app.log"],
      ["head -3 logs/app.log", "tail -3 logs/app.log"],
      ["cd logs", "head -n3 app.log", "tail -n3 app.log"],
    ],
    nearMisses: [
      ["head logs/app.log"],
      ["head -n 3 logs/app.log"],
      ["tail -n 3 logs/app.log"],
      ["cat logs/app.log"],
    ],
  },

  14: {
    startingPath: PROJECTS,
    fileTree: logsWorld(),

    winCondition: {
      check: ({ submissions }) =>
        ran(submissions, "wc", { flags: ["l"], operandPaths: [APP] }),
    },

    diagnostics: [
      {
        when: ({ submissions }) =>
          ran(submissions, "wc", { operandPaths: [APP] }) &&
          !ran(submissions, "wc", { flags: ["l"], operandPaths: [APP] }),
        say: "Three numbers: lines, words, bytes. One flag narrows it to the one you were asked for.",
      },
      {
        when: ({ submissions }) =>
          ran(submissions, "wc", { where: (command) => !hasOperands(command) }),
        say: "`wc` with no file counted an empty stream. Hand it the path to the log.",
      },
      {
        when: ({ lineCommands }) => lineCommands.includes("cat"),
        say: "Reading all of it works, but counting by eye does not scale. There is a command that counts for you.",
      },
    ],

    solutions: [
      ["wc -l logs/app.log"],
      ["cd logs", "wc -l app.log"],
      ["wc -l /home/shelly/projects/logs/app.log"],
    ],
    nearMisses: [["wc logs/app.log"], ["wc -l"], ["cat logs/app.log"], ["wc -w logs/app.log"]],
  },

  15: {
    startingPath: PROJECTS,
    fileTree: logsWorld(),

    winCondition: {
      check: ({ submissions }) => ran(submissions, "cat", { operandPaths: [APP, ACCESS] }),
    },

    diagnostics: [
      {
        when: ({ submissions }) =>
          ran(submissions, "cat", { operandPaths: [APP] }) ||
          ran(submissions, "cat", { operandPaths: [ACCESS] }),
        say: "One file at a time works, but `cat` does not need two commands — hand it both filenames.",
      },
      {
        when: ({ submissions }) => !ran(submissions, "cat"),
        say: "The command that prints a file also prints several of them. Check `ls logs` for the names.",
      },
    ],

    solutions: [
      ["cat logs/app.log logs/access.log"],
      ["cat logs/access.log logs/app.log"],
      ["cd logs", "cat app.log access.log"],
    ],
    nearMisses: [
      ["cat logs/app.log"],
      ["cat logs/app.log", "cat logs/access.log"],
      ["cat logs"],
    ],
  },

  16: {
    startingPath: PROJECTS,
    fileTree: logsWorld(),

    winCondition: {
      check: ({ submissions }) =>
        ran(submissions, "wc", { flags: ["l"], operandPaths: [APP, ACCESS] }),
    },

    diagnostics: [
      {
        when: ({ submissions }) =>
          ran(submissions, "wc", { flags: ["l"], operandPaths: [APP] }) ||
          ran(submissions, "wc", { flags: ["l"], operandPaths: [ACCESS] }),
        say: "Counting them one at a time gives you the same numbers — but `wc -l` takes a list, and adds a total.",
      },
      {
        when: ({ submissions }) =>
          ran(submissions, "wc", { operandPaths: [APP, ACCESS] }) &&
          !ran(submissions, "wc", { flags: ["l"], operandPaths: [APP, ACCESS] }),
        say: "Both files, but three columns each. Narrow it to lines.",
      },
      {
        when: ({ lineCommands }) => lineCommands.includes("cat"),
        say: "You could count those by eye. `wc -l` with both filenames is the version that still works at ten thousand lines.",
      },
    ],

    solutions: [
      ["wc -l logs/app.log logs/access.log"],
      ["cd logs", "wc -l access.log app.log"],
    ],
    nearMisses: [
      ["wc -l logs/app.log"],
      ["wc -l logs/app.log", "wc -l logs/access.log"],
      ["wc logs/app.log logs/access.log"],
      ["cat logs/app.log logs/access.log"],
    ],
  },
};
