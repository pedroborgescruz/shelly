"use client";

import Link from "next/link";
import { getLevel, lastLevelId } from "@/lib/levels";
import { useShellStore } from "@/store/useShellStore";
import { Markdown, MarkdownInline } from "./Markdown";
import styles from "./LessonPane.module.css";

export function LessonPane() {
  const currentLevelId = useShellStore((state) => state.currentLevelId);
  const isLevelSolved = useShellStore((state) => state.isLevelSolved);
  const hintsRevealed = useShellStore((state) => state.hintsRevealed);
  const revealHint = useShellStore((state) => state.revealHint);

  const level = getLevel(currentLevelId);
  const hasNext = currentLevelId < lastLevelId();
  const hintsLeft = level.hints.length - hintsRevealed;

  return (
    <div className={styles.pane}>
      <div className={`${styles.body} scroller`}>
        <div className={styles.heading}>
          <span className={styles.levelLabel}>
            {level.chapter.title} · level {String(level.id).padStart(2, "0")}
          </span>
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
        {!isLevelSolved && hintsLeft > 0 && (
          <button type="button" className={styles.hint} onClick={revealHint}>
            hint{hintsRevealed > 0 ? ` ${hintsRevealed + 1}/${level.hints.length}` : ""}
          </button>
        )}
      </div>

      {isLevelSolved && (
        <div className={styles.solvedBar}>
          <span className={styles.check}>✓</span>
          <span className={styles.solvedText}>
            {hasNext ? "Level complete." : "That is every level built so far — nicely done."}
          </span>
          {hasNext ? (
            <Link className={styles.next} href={`/level/${currentLevelId + 1}`}>
              next level →
            </Link>
          ) : (
            <Link className={styles.next} href="/">
              all chapters →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
