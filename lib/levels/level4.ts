import type { Level } from "@/lib/types";
import { APP_LOG, APP_LOG_ERRORS } from "./data";
import { dir, file, homeAt } from "./fsBuilders";

export const level4: Level = {
  id: 4,
  title: "Chaining",
  description: "Join small tools into one that does what you need.",

  lesson: `\`>\` redirects output into a *file*. The pipe, \`|\`, redirects it into
another *command's* standard input:

\`\`\`
cat logs/app.log | grep ERROR
\`\`\`

\`cat\` prints the file; \`grep\` reads those lines and keeps only the ones matching
\`ERROR\`. Neither command knows the other exists — that is the whole idea. Small
tools, one job each, composed at the command line.

Useful \`grep\` flags:

- \`-i\` ignore case
- \`-v\` invert: print the lines that do **not** match
- \`-n\` prefix each hit with its line number
- \`-c\` print how many lines matched instead of the lines

\`grep\` can open the file itself (\`grep ERROR logs/app.log\`), which is one process
instead of two — but the pipe is the pattern worth learning, because the left
side can be any command at all.`,

  prompt: "Print only the `ERROR` lines of `logs/app.log`, using `cat` and `grep` joined by a pipe.",

  initialState: {
    startingPath: "/home/shelly/projects",
    fileTree: homeAt({
      projects: dir({
        "hello.sh": file('echo "hello from the shell"\n'),
        ".env": file("API_KEY=shelly-dev-7f3a"),
        logs: dir({
          "app.log": file(APP_LOG),
          "access.log": file("127.0.0.1 - - GET / 200\n127.0.0.1 - - GET /favicon.ico 404"),
        }),
      }),
    }),
  },

  allowedCommands: {
    pwd: { hint: "print the current directory" },
    ls: { hint: "list directory contents" },
    cd: { hint: "change directory" },
    cat: { hint: "print a file's contents" },
    grep: { hint: "keep only matching lines (-i -v -n -c)" },
    wc: { hint: "count lines, words, bytes" },
  },

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

  successMessage:
    "That is the Unix philosophy in one line. Try `cat logs/app.log | grep ERROR | wc -l` to count them instead.",
};
