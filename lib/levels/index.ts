import type { Level } from "@/lib/types";
import { level1 } from "./level1";
import { level2 } from "./level2";
import { level3 } from "./level3";
import { level4 } from "./level4";

export const LEVELS: Level[] = [level1, level2, level3, level4];

export function getLevel(id: number): Level {
  const level = LEVELS.find((candidate) => candidate.id === id);
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}

export const FIRST_LEVEL_ID = LEVELS[0].id;
export const LAST_LEVEL_ID = LEVELS[LEVELS.length - 1].id;
