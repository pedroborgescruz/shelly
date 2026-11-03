import { TLDR_PAGES } from "@/lib/tldr";
import type { CommandBehavior, Chapter, Level, LevelContent } from "@/lib/types";
import { CHAPTERS, getChapter, unlockedBy } from "./chapters";
import { LEVEL_RULES } from "./rules";

export { CHAPTERS, getChapter } from "./chapters";

/**
 * Join the markdown half of a level to its rules.
 *
 * `allowedCommands` is derived, never authored: a level allows everything its
 * chapter and all earlier chapters unlock. The level's own `focus` map only
 * supplies the friendlier one-liner that `help` prints.
 */
export function buildLevels(content: LevelContent[]): Level[] {
  return content.map((entry) => {
    const rules = LEVEL_RULES[entry.id];
    if (!rules) throw new Error(`Level ${entry.id} has content but no rules in lib/levels/rules.ts`);

    const chapter = getChapter(entry.chapterId);

    const allowedCommands: Record<string, CommandBehavior> = {};
    for (const name of unlockedBy(entry.chapterId)) {
      allowedCommands[name] = { hint: entry.focus[name] ?? TLDR_PAGES[name]?.description };
    }

    return { ...entry, ...rules, chapter, allowedCommands };
  });
}

/* -------------------------------- Catalog --------------------------------- */

/**
 * The catalog is static, but it is read from disk on the server and handed to
 * the client as props, so it is installed at render time rather than being
 * importable directly from browser code.
 */
let catalog: Level[] = [];
let installedFrom: LevelContent[] | null = null;

/**
 * Idempotent: safe to call on every render. It rebuilds only when handed a
 * different content array — which also means a module reload during
 * development repopulates the catalog instead of leaving it empty.
 */
export function hydrateCatalog(content: LevelContent[]): void {
  if (installedFrom === content && catalog.length > 0) return;
  installedFrom = content;
  catalog = buildLevels(content);
}

export function allLevels(): Level[] {
  return catalog;
}

export function getLevel(id: number): Level {
  const level = catalog.find((candidate) => candidate.id === id);
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}

export function hasLevel(id: number): boolean {
  return catalog.some((candidate) => candidate.id === id);
}

export function firstLevelId(): number {
  return catalog[0]?.id ?? 1;
}

export function lastLevelId(): number {
  return catalog[catalog.length - 1]?.id ?? 1;
}

/** Levels grouped by chapter, in curriculum order, including empty chapters. */
export function levelsByChapter(levels: Level[] = catalog): { chapter: Chapter; levels: Level[] }[] {
  return CHAPTERS.map((chapter) => ({
    chapter,
    levels: levels.filter((level) => level.chapterId === chapter.id),
  }));
}
