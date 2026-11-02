import { readFile } from "@/lib/fs/vfs";
import type { Level } from "@/lib/types";
import { dir, file, homeAt } from "./fsBuilders";

export const SECRET = "API_KEY=shelly-dev-7f3a";

export const level3: Level = {
  id: 3,
  title: "Redirection",
  description: "Point a command's output somewhere other than the screen.",

  lesson: `Every command writes to a stream called **standard output**. By default
that stream is drawn on your screen — but it is just a pipe, and you can point
it elsewhere.

- \`>\` sends stdout into a file, **replacing** whatever was there.
- \`>>\` **appends** to the end of the file instead.

So \`echo hello\` prints \`hello\`, while \`echo hello > greeting.txt\` prints nothing
and leaves a file behind. The file is created if it does not exist.

\`>\` truncates without asking. That is the single most common way people destroy
a config file: \`echo one > f\` then \`echo two > f\` leaves only \`two\`.

A name beginning with a dot is **hidden** — conventional for config, not
secure. Plain \`ls\` will not show it; \`ls -a\` and \`cat\` will.`,

  prompt: "Write the line `" + SECRET + "` into a hidden file named `.env` in `~/projects`.",

  initialState: {
    startingPath: "/home/shelly/projects",
    fileTree: homeAt({
      projects: dir({
        "hello.sh": file('echo "hello from the shell"\n'),
        "config.example": file(`# copy me to .env\n${SECRET.split("=")[0]}=\n`),
        logs: dir({}),
      }),
    }),
  },

  allowedCommands: {
    pwd: { hint: "print the current directory" },
    ls: { hint: "list contents (-a reveals dotfiles)" },
    cd: { hint: "change directory" },
    cat: { hint: "print a file's contents" },
    echo: { hint: "print its arguments" },
  },

  winCondition: {
    requiredOperators: [">"],
    check: ({ fs }) => {
      const content = readFile(fs, "/home/shelly/projects/.env");
      return content !== null && content.trim() === SECRET;
    },
  },

  successMessage:
    "You just wrote a file without an editor. `>` replaces, `>>` appends — and `ls -a` is how you find the dotfiles you forgot about.",
};
