"use client";

import { getLevel, LAST_LEVEL_ID } from "@/lib/levels";
import { useShellStore } from "@/store/useShellStore";
import { Markdown, MarkdownInline } from "./Markdown";
import styles from "./LessonPane.module.css";

export function LessonPane() {
  const currentLevelId = useShellStore((state) => state.currentLevelId);
  const isLevelSolved = useShellStore((state) => state.isLevelSolved);
  const nextLevel = useShellStore((state) => state.nextLevel);

  const level = getLevel(currentLevelId);
  const hasNext = currentLevelId < LAST_LEVEL_ID;

  return (
    <div className={styles.pane}>
      <div className={`${styles.body} scroller`}>
        <div className={styles.heading}>
          <span className={styles.levelLabel}>level {String(level.id).padStart(2, "0")}</span>
          <h1 className={styles.title}>{level.title}</h1>
          <p className={styles.description}>{level.description}</p>
        </div>

        <Markdown source={level.lesson} />
      </div>

      {/* Pinned below the scroller: the objective must never scroll away. */}
      <div className={styles.objective} data-solved={isLevelSolved || undefined}>
        <span className={styles.objectiveLabel}>{isLevelSolved ? "solved" : "objective"}</span>
        <p className={styles.objectiveText}>
          <MarkdownInline source={level.prompt} />
        </p>
      </div>

      {isLevelSolved && (
        <div className={styles.solvedBar}>
          <span className={styles.check}>✓</span>
          <span className={styles.solvedText}>
            {hasNext ? "Level complete." : "That is the whole MVP — nicely done."}
          </span>
          {hasNext && (
            <button type="button" className={styles.next} onClick={nextLevel}>
              next level →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
