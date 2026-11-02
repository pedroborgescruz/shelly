import { isDir, isFile, lookup } from "@/lib/fs/vfs";
import type { Level } from "@/lib/types";
import { dir, file, homeAt } from "./fsBuilders";

export const level2: Level = {
  id: 2,
  title: "Manipulation",
  description: "Make directories and files, and watch the tree change.",

  lesson: `Creating things is two commands, and they do not overlap:

- \`mkdir <name>\` makes a **directory**.
- \`touch <name>\` makes an empty **file** (or, on an existing file, just
  updates its timestamp).

Both take paths, not only names, so \`mkdir src\` and \`mkdir ./src\` are the same
thing — and \`touch src/index.ts\` only works once \`src\` exists. When you need the
whole chain at once, \`mkdir -p a/b/c\` creates every missing parent.

You can also pass several names: \`touch a.ts b.ts c.ts\`.

Keep an eye on the right pane. Every entry you create appears there the moment
the command returns.`,

  prompt: "Inside `~/projects`, create a `src` directory holding an empty file called `index.ts`.",

  initialState: {
    startingPath: "/home/shelly/projects",
    fileTree: homeAt({
      "README.md": file("# shelly\n"),
      projects: dir({
        "hello.sh": file('echo "hello from the shell"\n'),
        logs: dir({}),
      }),
    }),
  },

  allowedCommands: {
    pwd: { hint: "print the current directory" },
    ls: { hint: "list directory contents" },
    cd: { hint: "change directory" },
    mkdir: { hint: "create a directory (-p for parents)" },
    touch: { hint: "create an empty file" },
  },

  winCondition: {
    requiredCommands: [],
    check: ({ fs }) =>
      isDir(lookup(fs, "/home/shelly/projects/src")) &&
      isFile(lookup(fs, "/home/shelly/projects/src/index.ts")),
  },

  successMessage:
    "`mkdir` for the shape, `touch` for the leaves. `mkdir -p src/lib/utils` would have built the whole branch in one go.",
};
