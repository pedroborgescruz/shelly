import type { LevelRules } from "@/lib/types";
import { CHAPTER_1_RULES } from "./chapter1";
import { CHAPTER_2_RULES } from "./chapter2";
import { CHAPTER_3_RULES } from "./chapter3";
import { CHAPTER_4_RULES } from "./chapter4";
import { CHAPTER_5_RULES } from "./chapter5";

/**
 * The executable half of every level, keyed by id. One file per chapter; the
 * prose half lives in `content/levels/`.
 */
export const LEVEL_RULES: Record<number, LevelRules> = {
  ...CHAPTER_1_RULES,
  ...CHAPTER_2_RULES,
  ...CHAPTER_3_RULES,
  ...CHAPTER_4_RULES,
  ...CHAPTER_5_RULES,
};
