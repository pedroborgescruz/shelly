import { HOME, isDir, listDir, lookup, readFile } from "@/lib/fs/vfs";
import type { LevelRules } from "@/lib/types";
import { APP_LOG, SECRET } from "../data";
import { dir, file, homeAt } from "../fsBuilders";
import { logsWorld } from "../worlds";

const PROJECTS = `${HOME}/projects`;
const at = (path: string) => `${PROJECTS}/${path}`;

const HELLO = 'echo "hello from the shell"\n';
const TODO = "buy milk\nwrite tests\nship it\n";
const STOCK = "# stock\nhello.sh\n";
const APP_LINES = APP_LOG.split("\n").length;

export const CHAPTER_4_RULES: Record<number, LevelRules> = {
  17: {
    startingPath: PROJECTS,
    fileTree: homeAt({ projects: dir({ "hello.sh": file(HELLO) }) }),

    winCondition: {
      check: ({ stdout }) => stdout === "hello   world\n",
    },

    diagnostics: [
      {
        when: ({ stdout, lineCommands }) =>
          lineCommands.includes("echo") && stdout.trim() === "hello world",
        say: "Look closely: one space came out, not three. The shell split your line into two arguments before `echo` saw it — the spaces were never part of either one.",
      },
      {
        when: ({ stdout, lineCommands }) =>
          lineCommands.includes("echo") && !stdout.includes("hello"),
        say: "Close, but the words have to come out exactly as asked.",
      },
    ],

    solutions: [['echo "hello   world"'], ["echo 'hello   world'"]],
    nearMisses: [["echo hello   world"], ["echo hello world"], ["echo 'hello world'"]],
  },

  18: {
    startingPath: PROJECTS,
    fileTree: homeAt({
      projects: dir({
        "hello.sh": file(HELLO),
        "config.example": file(`# copy me to .env\n${SECRET.split("=")[0]}=\n`),
        logs: dir({}),
      }),
    }),

    winCondition: {
      requiredOperators: [">"],
      check: ({ fs }) => readFile(fs, at(".env"))?.trim() === SECRET,
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
          const content = readFile(fs, at(".env"));
          return content !== null && content.trim() !== SECRET;
        },
        say: "`.env` exists, but its contents are not the line asked for. `cat .env` to see what actually landed.",
      },
      {
        when: ({ fs }) => {
          const projects = lookup(fs, PROJECTS);
          return isDir(projects) && listDir(projects, { all: true }).includes("env");
        },
        say: "`env` and `.env` are different names. The hidden one starts with a dot.",
      },
    ],

    solutions: [
      [`echo ${SECRET} > .env`],
      [`echo "${SECRET}" > .env`],
      [`echo ${SECRET} > ${at(".env")}`],
    ],
    nearMisses: [
      [`echo ${SECRET}`],
      [`echo ${SECRET} > env`],
      ["touch .env"],
      ["echo API_KEY= > .env"],
    ],
  },

  19: {
    startingPath: PROJECTS,
    fileTree: homeAt({ projects: dir({ "hello.sh": file(HELLO) }) }),

    winCondition: {
      check: ({ fs }) => readFile(fs, at("todo.txt")) === TODO,
    },

    diagnostics: [
      {
        when: ({ fs }) => readFile(fs, at("todo.txt")) === "ship it\n",
        say: "Only the last line survived. Each `>` threw away the file and started over — `>>` is the one that adds.",
      },
      {
        when: ({ fs }) => {
          const content = readFile(fs, at("todo.txt"));
          return content !== null && content !== TODO && content.split("\n").length <= 3;
        },
        say: "Partway there. `cat todo.txt` to see which lines actually made it, and in what order.",
      },
      {
        when: ({ fs }) => readFile(fs, at("todo.txt")) === null,
        say: "No `todo.txt` yet. Start it with `>`, then add to it with `>>`.",
      },
    ],

    solutions: [
      ["echo buy milk > todo.txt", "echo write tests >> todo.txt", "echo ship it >> todo.txt"],
      [
        "touch todo.txt",
        "echo buy milk >> todo.txt",
        "echo write tests >> todo.txt",
        "echo ship it >> todo.txt",
      ],
    ],
    nearMisses: [
      ["echo buy milk > todo.txt", "echo write tests > todo.txt", "echo ship it > todo.txt"],
      ["echo buy milk > todo.txt"],
      ["echo buy milk > todo.txt", "echo write tests >> todo.txt"],
    ],
  },

  20: {
    startingPath: PROJECTS,
    fileTree: homeAt({
      projects: dir({
        "hello.sh": file(HELLO),
        "config.example": file("API_KEY=\n"),
        logs: dir({}),
      }),
    }),

    winCondition: {
      requiredOperators: [">"],
      requiredCommands: ["ls"],
      check: ({ fs }) => (readFile(fs, at("inventory.txt")) ?? "").includes("hello.sh"),
    },

    diagnostics: [
      {
        when: ({ lineCommands, lineOperators }) =>
          lineCommands.includes("ls") && !lineOperators.includes(">"),
        say: "That is the listing, on the screen. Send it to a file instead — the operator is the same one `echo` used.",
      },
      {
        when: ({ fs }) =>
          readFile(fs, at("inventory.txt")) !== null &&
          !(readFile(fs, at("inventory.txt")) ?? "").includes("hello.sh"),
        say: "`inventory.txt` has something in it, but not a listing of this directory. `cat inventory.txt` to see what you captured.",
      },
      {
        when: ({ fs, lineOperators }) =>
          lineOperators.includes(">") && readFile(fs, at("inventory.txt")) === null,
        say: "Something was written, but not to `inventory.txt`. Check the filename.",
      },
    ],

    solutions: [["ls > inventory.txt"], ["ls -1 > inventory.txt"], ["ls . > inventory.txt"]],
    nearMisses: [["ls"], ["ls > inventory"], ["cat hello.sh > inventory.txt"]],
  },

  21: {
    startingPath: PROJECTS,
    fileTree: logsWorld(),

    winCondition: {
      requiredOperators: ["<"],
      check: ({ stdout }) => stdout.trim() === String(APP_LINES),
    },

    diagnostics: [
      {
        when: ({ stdout, lineCommands, lineOperators }) =>
          lineCommands.includes("wc") &&
          !lineOperators.includes("<") &&
          stdout.includes(String(APP_LINES)),
        say: "Right number, wrong route — `wc` opened the file itself, which is why its name is printed beside the count. Hand it the file with `<` instead.",
      },
      {
        when: ({ lineOperators, stdout }) =>
          lineOperators.includes("<") && stdout.trim() !== String(APP_LINES),
        say: "The redirection is right, but that is not a line count. `wc` needs to be told which of its three numbers you want.",
      },
      {
        when: ({ lineOperators }) => !lineOperators.includes("<"),
        say: "Reading the file is not the task — feeding it into `wc` through `<` is.",
      },
    ],

    solutions: [["wc -l < logs/app.log"], ["cd logs", "wc -l < app.log"]],
    nearMisses: [["wc -l logs/app.log"], ["wc < logs/app.log"], ["cat logs/app.log"]],
  },

  22: {
    startingPath: PROJECTS,
    fileTree: homeAt({ projects: dir({ "hello.sh": file(HELLO) }) }),

    winCondition: {
      check: ({ fs }) => readFile(fs, at("docs/stock.txt")) === STOCK,
    },

    diagnostics: [
      {
        when: ({ fs }) => readFile(fs, at("docs/stock.txt")) === "\n",
        say: "The file is empty. `#` began a comment, so the shell discarded the rest of that line — quote it to make it a literal character.",
      },
      {
        when: ({ fs }) => readFile(fs, at("docs/stock.txt")) === "hello.sh\n",
        say: "Only the second line is there. Either the header never landed, or `>` replaced it.",
      },
      {
        when: ({ fs }) => !isDir(lookup(fs, at("docs"))),
        say: "There is no `docs` directory yet, so there is nowhere to redirect into.",
      },
      {
        when: ({ fs }) => {
          const content = readFile(fs, at("docs/stock.txt"));
          return content !== null && content !== STOCK;
        },
        say: "Close — `cat docs/stock.txt` and compare it line by line with what was asked for.",
      },
    ],

    solutions: [
      ["mkdir docs", "echo '# stock' > docs/stock.txt", "echo hello.sh >> docs/stock.txt"],
      ["mkdir -p docs", 'echo "# stock" > docs/stock.txt', "echo hello.sh >> docs/stock.txt"],
    ],
    nearMisses: [
      ["echo '# stock' > docs/stock.txt"],
      ["mkdir docs", "echo # stock > docs/stock.txt", "echo hello.sh >> docs/stock.txt"],
      ["mkdir docs", "echo '# stock' > docs/stock.txt", "echo hello.sh > docs/stock.txt"],
    ],
  },
};
