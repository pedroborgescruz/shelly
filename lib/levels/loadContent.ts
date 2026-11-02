/**
 * Reads the markdown half of the level catalog from disk.
 *
 * Node-only: import it from server components, scripts and tests. The browser
 * receives the parsed result as props and merges it with `LEVEL_RULES`.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { LevelContent } from "@/lib/types";
import { getChapter, unlockedBy } from "./chapters";
import {
  FrontmatterError,
  parseFrontmatter,
  requireList,
  requireMap,
  requireNumber,
  requireString,
} from "./frontmatter";

export const CONTENT_DIR = path.join(process.cwd(), "content", "levels");

export function parseLevelFile(source: string, label: string): LevelContent {
  const { data, body } = parseFrontmatter(source, label);

  const chapterId = requireString(data, "chapter", label);
  getChapter(chapterId); // throws on an unknown chapter id
  const focus = requireMap(data, "focus", label);

  // Authoring guard: a level cannot teach a command its chapter has not
  // unlocked, or the guardrails would intercept the lesson's own example.
  const available = new Set(unlockedBy(chapterId));
  for (const name of Object.keys(focus)) {
    if (!available.has(name)) {
      throw new FrontmatterError(
        `${label}: focus command \`${name}\` is not unlocked by chapter \`${chapterId}\` ` +
          `or any earlier one (see lib/levels/chapters.ts)`,
      );
    }
  }

  if (body.trim() === "") throw new FrontmatterError(`${label}: lesson body is empty`);

  return {
    id: requireNumber(data, "id", label),
    chapterId,
    title: requireString(data, "title", label),
    description: requireString(data, "description", label),
    prompt: requireString(data, "prompt", label),
    successMessage: requireString(data, "success", label),
    lesson: body,
    focus,
    hints: requireList(data, "hints", label),
  };
}

export function loadLevelContent(): LevelContent[] {
  const files = readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort();

  const levels = files.map((name) =>
    parseLevelFile(readFileSync(path.join(CONTENT_DIR, name), "utf8"), name),
  );

  const seen = new Set<number>();
  for (const level of levels) {
    if (seen.has(level.id)) throw new FrontmatterError(`duplicate level id ${level.id}`);
    seen.add(level.id);
  }

  return levels.sort((a, b) => a.id - b.id);
}
