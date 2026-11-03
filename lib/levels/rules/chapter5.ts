import { HOME } from "@/lib/fs/vfs";
import type { LevelRules } from "@/lib/types";
import { ACCESS_LOG, APP_LOG, APP_LOG_ERRORS, NAMES } from "../data";
import { pipesWorld } from "../worlds";

const PROJECTS = `${HOME}/projects`;

/* Everything expected is derived from the fixtures, so editing a fixture
   cannot silently leave a level asserting a stale answer. */
const WARN_LINES = String(
  APP_LOG.split("\n").filter((line) => /warn/i.test(line)).length,
);

const SORTED_NAMES = NAMES.split("\n").sort((a, b) => a.localeCompare(b, "en"));

const NAME_TALLY = (() => {
  const runs: { line: string; count: number }[] = [];
  for (const name of SORTED_NAMES) {
    const last = runs[runs.length - 1];
    if (last && last.line === name) last.count += 1;
    else runs.push({ line: name, count: 1 });
  }
  return runs.map((run) => `${String(run.count).padStart(4, " ")} ${run.line}`);
})();

const IPS = ACCESS_LOG.split("\n").map((line) => line.split(" ")[0]);

const IP_TALLY = (() => {
  const counts = new Map<string, number>();
  for (const ip of IPS) counts.set(ip, (counts.get(ip) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([ip, count]) => `${String(count).padStart(4, " ")} ${ip}`);
})();

const lines = (stdout: string) => stdout.split("\n").filter((line) => line !== "");

export const CHAPTER_5_RULES: Record<number, LevelRules> = {
  23: {
    startingPath: PROJECTS,
    fileTree: pipesWorld(),

    winCondition: {
      requiredOperators: ["|"],
      requiredCommands: ["cat", "grep"],
      check: ({ stdout }) => {
        const out = lines(stdout);
        return (
          out.length === APP_LOG_ERRORS.length &&
          out.every((line, index) => line === APP_LOG_ERRORS[index])
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
        when: ({ lineOperators, stdout }) =>
          lineOperators.includes("|") && stdout.trim() === "",
        say: "The pipe is right but nothing came through. `grep` is case-sensitive — check the pattern against the file.",
      },
      {
        when: ({ lineCommands }) =>
          lineCommands.includes("cat") && !lineCommands.includes("grep"),
        say: "That is the whole file. Now filter it: send those lines into `grep`.",
      },
      {
        when: ({ lineOperators, stdout }) =>
          lineOperators.includes("|") && stdout.trim() !== "",
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

  24: {
    startingPath: PROJECTS,
    fileTree: pipesWorld(),

    winCondition: {
      requiredOperators: ["|"],
      check: ({ stdout }) => stdout.trim() === WARN_LINES,
    },

    diagnostics: [
      {
        when: ({ stdout, lineCommands }) =>
          lineCommands.includes("grep") && stdout.trim() === "0",
        say: "Zero matches — but the log definitely mentions it. `grep` is case-sensitive unless you tell it not to be.",
      },
      {
        when: ({ stdout, lineCommands }) =>
          lineCommands.includes("grep") && lines(stdout).length > 1,
        say: "Those are the matching lines. The question asked how *many* — `-c`, or a pipe into `wc -l`.",
      },
      {
        when: ({ lineOperators }) => !lineOperators.includes("|"),
        say: "Build it as a pipeline: print the file, then filter it, then count.",
      },
      {
        when: ({ stdout }) => stdout.trim() !== WARN_LINES,
        say: "Not the number the log actually holds. Check both the pattern and whether case is being ignored.",
      },
    ],

    solutions: [
      ["cat logs/app.log | grep -ic warn"],
      ["cat logs/app.log | grep -i warn | wc -l"],
      ["cat logs/app.log | grep -ci WARN"],
    ],
    nearMisses: [
      ["cat logs/app.log | grep -c warn"],
      ["cat logs/app.log | grep -i warn"],
      ["cat logs/app.log | grep -c WARN"],
    ],
  },

  25: {
    startingPath: PROJECTS,
    fileTree: pipesWorld(),

    winCondition: {
      check: ({ stdout }) =>
        lines(stdout).join("\n") === SORTED_NAMES.join("\n"),
    },

    diagnostics: [
      {
        when: ({ stdout, lineCommands }) =>
          lineCommands.includes("sort") &&
          lines(stdout).join("\n") === [...SORTED_NAMES].reverse().join("\n"),
        say: "Sorted, but backwards. Drop the `-r`.",
      },
      {
        when: ({ lineCommands }) =>
          lineCommands.includes("cat") && !lineCommands.includes("sort"),
        say: "That is the file in its original order. One command puts it in alphabetical order.",
      },
      {
        when: ({ lineCommands }) => lineCommands.includes("sort"),
        say: "Sorted, but not the plain alphabetical order asked for — drop the extra flags.",
      },
    ],

    solutions: [["sort names.txt"], ["cat names.txt | sort"]],
    nearMisses: [["cat names.txt"], ["sort -r names.txt"], ["sort -u names.txt"]],
  },

  26: {
    startingPath: PROJECTS,
    fileTree: pipesWorld(),

    winCondition: {
      requiredOperators: ["|"],
      requiredCommands: ["sort", "uniq"],
      check: ({ stdout }) => lines(stdout).join("\n") === NAME_TALLY.join("\n"),
    },

    diagnostics: [
      {
        when: ({ lineCommands, stdout }) =>
          lineCommands.includes("uniq") &&
          !lineCommands.includes("sort") &&
          stdout.trim() !== "",
        say: "`uniq` only ever compares a line with the one before it, so scattered duplicates never meet. Sort first.",
      },
      {
        when: ({ lineCommands, stdout }) =>
          lineCommands.includes("sort") &&
          lineCommands.includes("uniq") &&
          !stdout.includes("3"),
        say: "The names are collapsed, but without their counts. `uniq` has a flag for that.",
      },
      {
        when: ({ lineCommands }) => !lineCommands.includes("uniq"),
        say: "Sorting groups the duplicates. Another command turns each group into a count.",
      },
    ],

    solutions: [
      ["sort names.txt | uniq -c"],
      ["cat names.txt | sort | uniq -c"],
    ],
    nearMisses: [
      ["cat names.txt | uniq -c"],
      ["sort names.txt | uniq"],
      ["sort names.txt"],
    ],
  },

  27: {
    startingPath: PROJECTS,
    fileTree: pipesWorld(),

    winCondition: {
      check: ({ stdout }) => lines(stdout).join("\n") === IPS.join("\n"),
    },

    diagnostics: [
      {
        when: ({ stdout, lineCommands }) =>
          lineCommands.includes("cut") && lines(stdout).some((line) => line.includes("GET")),
        say: "Every line came through whole. `cut` splits on TAB by default, and this file has none — say which delimiter with `-d`.",
      },
      {
        when: ({ stdout, lineCommands }) =>
          lineCommands.includes("cut") &&
          lines(stdout).length > 0 &&
          !lines(stdout)[0].startsWith("203"),
        say: "Right idea, wrong column. Fields are counted from 1.",
      },
      {
        when: ({ lineCommands }) => !lineCommands.includes("cut"),
        say: "Look at a line first — the fields are separated by spaces, and you want the first one.",
      },
    ],

    solutions: [
      ["cut -d ' ' -f 1 logs/access.log"],
      ["cat logs/access.log | cut -d ' ' -f 1"],
      ["cut -d' ' -f1 logs/access.log"],
    ],
    nearMisses: [
      ["cut -f 1 logs/access.log"],
      ["cut -d ' ' -f 2 logs/access.log"],
      ["cat logs/access.log"],
    ],
  },

  28: {
    startingPath: PROJECTS,
    fileTree: pipesWorld(),

    winCondition: {
      requiredCommands: ["tr"],
      check: ({ stdout }) => stdout.trim() === ACCESS_LOG.toLowerCase().trim(),
    },

    diagnostics: [
      {
        when: ({ stdout, lineCommands }) =>
          lineCommands.includes("tr") && stdout.trim() === ACCESS_LOG.toUpperCase().trim(),
        say: "That went the other way. The first set is what to replace, the second is what to replace it with.",
      },
      {
        when: ({ stdout, lineCommands }) => lineCommands.includes("tr") && stdout.trim() === "",
        say: "Nothing came out — `tr` cannot open a file by name. It reads standard input, so give it one.",
      },
      {
        when: ({ lineCommands }) => !lineCommands.includes("tr"),
        say: "`cat` alone will not change the case. There is a command that maps characters to other characters.",
      },
    ],

    solutions: [
      ["cat logs/access.log | tr A-Z a-z"],
      ["tr A-Z a-z < logs/access.log"],
    ],
    nearMisses: [
      ["cat logs/access.log | tr a-z A-Z"],
      ["cat logs/access.log"],
      ["tr A-Z a-z"],
    ],
  },

  29: {
    startingPath: PROJECTS,
    fileTree: pipesWorld(),

    winCondition: {
      requiredOperators: ["|"],
      requiredCommands: ["sort", "uniq"],
      check: ({ stdout }) => lines(stdout).join("\n") === IP_TALLY.join("\n"),
    },

    diagnostics: [
      {
        when: ({ stdout, lineCommands }) =>
          lineCommands.includes("uniq") &&
          lines(stdout).length === IP_TALLY.length &&
          lines(stdout).join("\n") !== IP_TALLY.join("\n"),
        say: "Every IP is counted — now order them. `sort -rn` reads the leading number and puts the biggest first.",
      },
      {
        when: ({ stdout, lineCommands }) =>
          lineCommands.includes("cut") &&
          !lineCommands.includes("uniq") &&
          lines(stdout).length === IPS.length,
        say: "That is the IP column. Group it with `sort`, then tally it with `uniq -c`.",
      },
      {
        when: ({ lineCommands, stdout }) =>
          lineCommands.includes("uniq") &&
          !lineCommands.includes("sort") &&
          stdout.trim() !== "",
        say: "`uniq` needs its input sorted, or the repeats never end up next to each other.",
      },
      {
        when: ({ lineCommands }) => !lineCommands.includes("cut"),
        say: "Start by getting the IP column on its own, then build the rest of the pipeline one stage at a time.",
      },
      {
        when: () => true,
        say: "Build it one stage at a time and read the output after each pipe: extract the column, group it, count it, then order it.",
      },
    ],

    solutions: [
      ["cat logs/access.log | cut -d ' ' -f 1 | sort | uniq -c | sort -rn"],
      ["cut -d ' ' -f 1 logs/access.log | sort | uniq -c | sort -rn"],
    ],
    nearMisses: [
      ["cut -d ' ' -f 1 logs/access.log | sort | uniq -c"],
      ["cut -d ' ' -f 1 logs/access.log | uniq -c | sort -rn"],
      ["cut -d ' ' -f 1 logs/access.log"],
      ["cat logs/access.log | sort | uniq -c | sort -rn"],
    ],
  },
};
