import type { Chapter } from "@/lib/types";

/**
 * The curriculum spine. `planned` chapters have no levels yet but still show
 * on the map, so the shape of the course is visible from level 1.
 *
 * See docs/ROADMAP.md for what each planned chapter is meant to cover.
 */
export const CHAPTERS: Chapter[] = [
  {
    id: "orientation",
    index: 1,
    title: "Orientation",
    summary: "Where you are, and what is around you.",
    unlocks: ["pwd", "ls", "cd"],
    status: "ready",
  },
  {
    id: "manipulation",
    index: 2,
    title: "Making and breaking",
    summary: "Create and remove files and directories.",
    unlocks: ["mkdir", "touch"],
    status: "ready",
  },
  {
    id: "streams",
    index: 3,
    title: "Streams",
    summary: "Where a command's output actually goes.",
    unlocks: ["echo", "cat"],
    status: "ready",
  },
  {
    id: "pipes",
    index: 4,
    title: "Pipes and filters",
    summary: "Small tools, composed into one that does the job.",
    unlocks: ["grep", "wc", "head", "tail"],
    status: "ready",
  },
  {
    id: "globbing",
    index: 5,
    title: "Globbing",
    summary: "Wildcards, and why quoting matters.",
    unlocks: [],
    status: "planned",
  },
  {
    id: "finding",
    index: 6,
    title: "Finding things",
    summary: "find, xargs, and searching a whole tree.",
    unlocks: [],
    status: "planned",
  },
  {
    id: "permissions",
    index: 7,
    title: "Permissions",
    summary: "Who may read, write and execute — and $PATH.",
    unlocks: [],
    status: "planned",
  },
  {
    id: "variables",
    index: 8,
    title: "Variables and substitution",
    summary: "$foo, quoting, $(…) and exit codes.",
    unlocks: [],
    status: "planned",
  },
  {
    id: "scripting",
    index: 9,
    title: "Scripting",
    summary: "if, for, while, arguments and functions.",
    unlocks: [],
    status: "planned",
  },
  {
    id: "wrangling",
    index: 10,
    title: "Wrangling",
    summary: "sed, awk, and taking a log file apart.",
    unlocks: [],
    status: "planned",
  },
  {
    id: "jobs",
    index: 11,
    title: "Jobs and processes",
    summary: "Backgrounding, listing and killing work.",
    unlocks: [],
    status: "planned",
  },
];

export function getChapter(id: string): Chapter {
  const chapter = CHAPTERS.find((candidate) => candidate.id === id);
  if (!chapter) throw new Error(`Unknown chapter: ${id}`);
  return chapter;
}

/**
 * Every command available to a level in the given chapter: that chapter's
 * unlocks plus all earlier ones.
 */
export function unlockedBy(chapterId: string): string[] {
  const chapter = getChapter(chapterId);
  return CHAPTERS.filter((candidate) => candidate.index <= chapter.index).flatMap(
    (candidate) => candidate.unlocks,
  );
}
