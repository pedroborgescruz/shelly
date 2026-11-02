import { isDir, isFile, listDir, lookup, readFile } from "@/lib/fs/vfs";
import type { LevelRules } from "@/lib/types";
import { APP_LOG, APP_LOG_ERRORS, SECRET } from "./data";
import { dir, file, homeAt } from "./fsBuilders";

const ENV_PATH = "/home/shelly/projects/.env";
const SRC_PATH = "/home/shelly/projects/src";

/**
 * The executable half of every level: starting world, win condition, near-miss
 * diagnostics, and the solutions the generic test suite asserts against.
 *
 * Keyed by level id; the prose half lives in `content/levels/`.
 */
export const LEVEL_RULES: Record<number, LevelRules> = {
  1: {
    startingPath: "/home/shelly",
    fileTree: homeAt({
      "README.md": file("# shelly\n\nA sandbox. Nothing here can break.\n"),
      notes: dir({
        "missing-semester.md": file("Lecture 1: the shell.\n"),
      }),
      projects: dir({
        "hello.sh": file('echo "hello from the shell"\n'),
        logs: dir({}),
      }),
    }),

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
        when: ({ commandsRun }) =>
          !commandsRun.includes("pwd") && !commandsRun.includes("ls"),
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
    startingPath: "/home/shelly/projects",
    fileTree: homeAt({
      "README.md": file("# shelly\n"),
      projects: dir({
        "hello.sh": file('echo "hello from the shell"\n'),
        logs: dir({}),
      }),
    }),

    winCondition: {
      check: ({ fs }) =>
        isDir(lookup(fs, SRC_PATH)) && isFile(lookup(fs, `${SRC_PATH}/index.ts`)),
    },

    diagnostics: [
      {
        when: ({ fs }) => isDir(lookup(fs, SRC_PATH)) && !lookup(fs, `${SRC_PATH}/index.ts`),
        say: "The directory is there. Now put an empty file inside it — the path goes through `src`.",
      },
      {
        when: ({ fs, lineCommands }) => lineCommands.includes("touch") && !lookup(fs, SRC_PATH),
        say: "`touch` cannot create the parent directory for you. Make `src` first, then touch inside it.",
      },
      {
        when: ({ fs }) => isFile(lookup(fs, SRC_PATH)),
        say: "`src` came out as a file, not a directory. `touch` makes files; `mkdir` makes directories.",
      },
    ],

    solutions: [
      ["mkdir src", "touch src/index.ts"],
      ["mkdir -p src", "touch ./src/index.ts"],
      ["mkdir src", "cd src", "touch index.ts"],
    ],
    nearMisses: [["mkdir src"], ["touch src/index.ts"], ["touch src"], ["mkdir src/index.ts"]],
  },

  3: {
    startingPath: "/home/shelly/projects",
    fileTree: homeAt({
      projects: dir({
        "hello.sh": file('echo "hello from the shell"\n'),
        "config.example": file(`# copy me to .env\n${SECRET.split("=")[0]}=\n`),
        logs: dir({}),
      }),
    }),

    winCondition: {
      requiredOperators: [">"],
      check: ({ fs }) => readFile(fs, ENV_PATH)?.trim() === SECRET,
    },

    diagnostics: [
      {
        when: ({ lineCommands, lineOperators }) =>
          lineCommands.includes("echo") &&
          !lineOperators.includes(">") &&
          !lineOperators.includes(">>"),
        say: "You printed the text to the screen. Now point that output at a file instead.",
      },
      {
        when: ({ fs }) => {
          const content = readFile(fs, ENV_PATH);
          return content !== null && content.trim() !== SECRET;
        },
        say: "`.env` exists, but its contents are not the line asked for. `cat .env` to see what actually landed.",
      },
      {
        when: ({ fs }) => {
          const projects = lookup(fs, "/home/shelly/projects");
          if (!isDir(projects)) return false;
          return listDir(projects, { all: true }).includes("env");
        },
        say: "`env` and `.env` are different names. The hidden one starts with a dot.",
      },
    ],

    solutions: [
      [`echo ${SECRET} > .env`],
      [`echo "${SECRET}" > .env`],
      [`echo ${SECRET} > ${ENV_PATH}`],
    ],
    nearMisses: [
      [`echo ${SECRET}`],
      [`echo ${SECRET} > env`],
      ["touch .env"],
      [`echo API_KEY= > .env`],
    ],
  },

  4: {
    startingPath: "/home/shelly/projects",
    fileTree: homeAt({
      projects: dir({
        "hello.sh": file('echo "hello from the shell"\n'),
        ".env": file(SECRET),
        logs: dir({
          "app.log": file(APP_LOG),
          "access.log": file("127.0.0.1 - - GET / 200\n127.0.0.1 - - GET /favicon.ico 404"),
        }),
      }),
    }),

    winCondition: {
      requiredOperators: ["|"],
      requiredCommands: ["cat", "grep"],
      check: ({ stdout }) => {
        const lines = stdout.split("\n").filter((line) => line !== "");
        return (
          lines.length === APP_LOG_ERRORS.length &&
          lines.every((line, index) => line === APP_LOG_ERRORS[index])
        );
      },
    },

    diagnostics: [
      {
        when: ({ lineCommands, lineOperators }) =>
          lineCommands.includes("grep") && !lineOperators.includes("|"),
        say: "That works at a real terminal, but the lesson here is the pipe: let `cat` print the file and hand its output to `grep`.",
      },
      {
        when: ({ lineOperators, stdout }) => lineOperators.includes("|") && stdout.trim() === "",
        say: "The pipe is right but nothing came through. `grep` is case-sensitive — check the pattern against the file.",
      },
      {
        when: ({ lineCommands }) => lineCommands.includes("cat") && !lineCommands.includes("grep"),
        say: "That is the whole file. Now filter it: send those lines into `grep`.",
      },
      {
        when: ({ lineOperators, stdout }) => lineOperators.includes("|") && stdout.trim() !== "",
        say: "The shape is right, but those are not the ERROR lines. Check the pattern you handed to `grep`.",
      },
    ],

    solutions: [
      ["cat logs/app.log | grep ERROR"],
      ["cd logs", "cat app.log | grep ERROR"],
    ],
    nearMisses: [
      ["grep ERROR logs/app.log"],
      ["cat logs/app.log"],
      ["cat logs/app.log | grep error"],
      ["cat logs/app.log | grep WARN"],
    ],
  },
};
