import type { Level } from "@/lib/types";
import { dir, file, homeAt } from "./fsBuilders";

export const level1: Level = {
  id: 1,
  title: "Orientation",
  description: "Where am I, and what is here?",

  lesson: `A shell session always sits **somewhere**. Every relative path you type
is resolved from that one place, so knowing it is the difference between a
command that works and one that quietly does the wrong thing.

Two commands answer the only two questions that matter at the start:

- \`pwd\` — *print working directory*. Where am I right now?
- \`ls\` — *list*. What is in here?

\`ls\` hides anything whose name begins with a dot. Pass \`-a\` to see those too,
and \`-l\` for the long listing with permissions and sizes. Flags combine:
\`ls -la\`.

The pane on the right is the same filesystem drawn as a tree. Use it to check
your mental model against reality — that is exactly what \`pwd\` and \`ls\` do at
a real terminal.`,

  prompt: "Find out where you are with `pwd`, then list what is around you with `ls`.",

  initialState: {
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
  },

  allowedCommands: {
    pwd: { hint: "print the current directory" },
    ls: { hint: "list directory contents (try -a and -l)" },
  },

  winCondition: {
    check: ({ commandsRun }) => commandsRun.includes("pwd") && commandsRun.includes("ls"),
  },

  successMessage:
    "That is the whole orientation ritual: `pwd` for where, `ls` for what. You will type these thousands of times.",
};
