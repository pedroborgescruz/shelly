import { HOME, isDir, isFile, lookup, readFile } from "@/lib/fs/vfs";
import type { LevelRules, VNode } from "@/lib/types";
import { ran } from "../assert";
import { dir, file, homeAt } from "../fsBuilders";

const PROJECTS = `${HOME}/projects`;
const INBOX = `${HOME}/inbox`;

const at = (path: string) => `${PROJECTS}/${path}`;
const inbox = (path: string) => `${INBOX}/${path}`;

const projectsWorld = (children: Record<string, VNode>) => homeAt({ projects: dir(children) });

const HELLO = 'echo "hello from the shell"\n';

export const CHAPTER_2_RULES: Record<number, LevelRules> = {
  6: {
    startingPath: PROJECTS,
    fileTree: projectsWorld({
      "hello.sh": file(HELLO),
      logs: dir({}),
    }),

    winCondition: {
      check: ({ fs }) => isDir(lookup(fs, at("src"))) && isFile(lookup(fs, at("src/index.ts"))),
    },

    diagnostics: [
      {
        when: ({ fs }) => isDir(lookup(fs, at("src"))) && !lookup(fs, at("src/index.ts")),
        say: "The directory is there. Now put an empty file inside it — the path goes through `src`.",
      },
      {
        when: ({ fs, lineCommands }) => lineCommands.includes("touch") && !lookup(fs, at("src")),
        say: "`touch` cannot create the parent directory for you. Make `src` first, then touch inside it.",
      },
      {
        when: ({ fs }) => isFile(lookup(fs, at("src"))),
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

  7: {
    startingPath: PROJECTS,
    fileTree: projectsWorld({ "hello.sh": file(HELLO) }),

    winCondition: {
      check: ({ fs, submissions }) =>
        isDir(lookup(fs, at("src/lib/utils"))) && ran(submissions, "mkdir", { flags: ["p"] }),
    },

    diagnostics: [
      {
        when: ({ fs, submissions }) =>
          isDir(lookup(fs, at("src/lib/utils"))) && !ran(submissions, "mkdir", { flags: ["p"] }),
        say: "It exists — but that took three commands. One flag makes `mkdir` build the whole chain by itself.",
      },
      {
        when: ({ fs }) => isDir(lookup(fs, at("src"))) && !lookup(fs, at("src/lib/utils")),
        say: "Partway down the chain. `-p` would have created every level in one go.",
      },
    ],

    solutions: [["mkdir -p src/lib/utils"]],
    nearMisses: [
      ["mkdir src/lib/utils"],
      ["mkdir src", "mkdir src/lib", "mkdir src/lib/utils"],
      ["mkdir src"],
    ],
  },

  8: {
    startingPath: PROJECTS,
    fileTree: projectsWorld({
      "hello.sh": file(HELLO),
      "config.example": file("API_KEY=\n"),
    }),

    winCondition: {
      check: ({ fs }) =>
        isDir(lookup(fs, at("backup"))) &&
        isFile(lookup(fs, at("backup/hello.sh"))) &&
        isFile(lookup(fs, at("hello.sh"))),
    },

    diagnostics: [
      {
        when: ({ fs }) => isFile(lookup(fs, at("backup"))),
        say: "`backup` came out as a file. There was no directory by that name, so `cp` used the name for the copy itself.",
      },
      {
        when: ({ fs }) =>
          isFile(lookup(fs, at("backup/hello.sh"))) && !lookup(fs, at("hello.sh")),
        say: "The copy is in place, but the original is gone. `mv` moves; `cp` copies.",
      },
      {
        when: ({ fs }) => isDir(lookup(fs, at("backup"))) && !lookup(fs, at("backup/hello.sh")),
        say: "The directory is ready. Now copy `hello.sh` into it.",
      },
      {
        when: ({ fs }) => !lookup(fs, at("backup")),
        say: "There is nowhere to copy to yet — make the `backup` directory first.",
      },
    ],

    solutions: [
      ["mkdir backup", "cp hello.sh backup/"],
      ["mkdir backup", "cp hello.sh backup/hello.sh"],
      ["mkdir -p backup", "cp ./hello.sh ./backup/"],
    ],
    nearMisses: [
      ["cp hello.sh backup"],
      ["mkdir backup", "mv hello.sh backup/"],
      ["mkdir backup"],
    ],
  },

  9: {
    startingPath: PROJECTS,
    fileTree: projectsWorld({
      "draft.md": file("# Notes\n\nStill a draft.\n"),
      "hello.sh": file(HELLO),
      docs: dir({}),
    }),

    winCondition: {
      check: ({ fs }) =>
        isFile(lookup(fs, at("docs/README.md"))) &&
        !lookup(fs, at("draft.md")) &&
        !lookup(fs, at("README.md")),
    },

    diagnostics: [
      {
        when: ({ fs }) =>
          isFile(lookup(fs, at("docs/README.md"))) && !!lookup(fs, at("draft.md")),
        say: "`docs/README.md` is there, but `draft.md` still is too. You copied it — `mv` would have left only one.",
      },
      {
        when: ({ fs }) => isFile(lookup(fs, at("README.md"))),
        say: "Renamed. Now move it into `docs/`.",
      },
      {
        when: ({ fs }) => isFile(lookup(fs, at("docs/draft.md"))),
        say: "Moved, but it kept its old name. `mv file directory/` preserves the filename — give the destination a name instead.",
      },
    ],

    solutions: [
      ["mv draft.md README.md", "mv README.md docs/"],
      ["mv draft.md docs/README.md"],
      ["mv draft.md docs/", "mv docs/draft.md docs/README.md"],
    ],
    nearMisses: [
      ["cp draft.md docs/README.md"],
      ["mv draft.md README.md"],
      ["mv draft.md docs/"],
    ],
  },

  10: {
    startingPath: PROJECTS,
    fileTree: projectsWorld({
      "keep.txt": file("do not delete me\n"),
      ".DS_Store": file("macOS junk\n"),
      tmp: dir({
        "cache.bin": file("noise\n"),
        scratch: dir({ "a.txt": file("scratch\n") }),
      }),
    }),

    winCondition: {
      check: ({ fs }) =>
        !lookup(fs, at("tmp")) &&
        !lookup(fs, at(".DS_Store")) &&
        isFile(lookup(fs, at("keep.txt"))),
    },

    diagnostics: [
      {
        when: ({ fs }) => !lookup(fs, at("keep.txt")),
        say: "`keep.txt` is gone — that one was meant to survive. There is no undo, but `reset` puts the level back.",
      },
      {
        when: ({ fs }) => !lookup(fs, at("tmp")) && !!lookup(fs, at(".DS_Store")),
        say: "`tmp` is gone. The other one is hidden — `ls -a` will show it.",
      },
      {
        when: ({ fs }) => !!lookup(fs, at("tmp")) && !lookup(fs, at(".DS_Store")),
        say: "The dotfile is gone. `tmp` is a directory, so `rm` needs permission to go inside it.",
      },
    ],

    solutions: [
      ["rm -r tmp", "rm .DS_Store"],
      ["rm .DS_Store", "rm -rf tmp"],
      ["rm -r tmp .DS_Store"],
    ],
    nearMisses: [["rm tmp"], ["rm -r tmp"], ["rm .DS_Store"], ["rm keep.txt"]],
  },

  11: {
    startingPath: INBOX,
    fileTree: homeAt({
      inbox: dir({
        "a.log": file("first log\n"),
        "b.log": file("second log\n"),
        notes: file("remember to tidy up\n"),
        logs: dir({}),
        tmp: dir({ "junk.bin": file("noise\n") }),
      }),
    }),

    winCondition: {
      check: ({ fs }) =>
        isFile(lookup(fs, inbox("logs/a.log"))) &&
        isFile(lookup(fs, inbox("logs/b.log"))) &&
        !lookup(fs, inbox("a.log")) &&
        !lookup(fs, inbox("b.log")) &&
        !lookup(fs, inbox("tmp")) &&
        !lookup(fs, inbox("notes")) &&
        readFile(fs, inbox("NOTES.md")) === "remember to tidy up\n",
    },

    diagnostics: [
      {
        when: ({ fs }) => !!lookup(fs, inbox("a.log")) || !!lookup(fs, inbox("b.log")),
        say: "Still a `.log` sitting loose in `inbox`. `mv` takes several sources when the last argument is a directory.",
      },
      {
        when: ({ fs }) => !!lookup(fs, inbox("tmp")),
        say: "`tmp` is still here, and it is a directory — `rm` will want `-r`.",
      },
      {
        when: ({ fs }) => !!lookup(fs, inbox("notes")),
        say: "`notes` has not been renamed yet. Renaming is just moving it to a new name.",
      },
    ],

    solutions: [
      ["mv a.log logs/", "mv b.log logs/", "rm -r tmp", "mv notes NOTES.md"],
      ["mv a.log b.log logs/", "rm -rf tmp", "mv notes NOTES.md"],
    ],
    nearMisses: [
      ["mv a.log logs/", "rm -r tmp", "mv notes NOTES.md"],
      ["mv a.log b.log logs/", "mv notes NOTES.md"],
      ["mv a.log b.log logs/", "rm -r tmp"],
    ],
  },
};
