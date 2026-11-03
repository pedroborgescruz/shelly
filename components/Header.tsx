"use client";

import Link from "next/link";
import { allLevels, getLevel, lastLevelId } from "@/lib/levels";
import { useIsHydrated } from "@/lib/useIsHydrated";
import { useShellStore } from "@/store/useShellStore";
import styles from "./Header.module.css";

export function Header() {
  const currentLevelId = useShellStore((state) => state.currentLevelId);
  const solvedLevelIds = useShellStore((state) => state.solvedLevelIds);
  const resetLevel = useShellStore((state) => state.resetLevel);
  const hydrated = useIsHydrated();

  const level = getLevel(currentLevelId);
  const levels = allLevels();
  const solved = hydrated ? solvedLevelIds : [];

  const previousId = currentLevelId > 1 ? currentLevelId - 1 : null;
  const nextId = currentLevelId < lastLevelId() ? currentLevelId + 1 : null;

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <span className={styles.sigil}>$</span>
        <span className={styles.name}>shelly</span>
      </Link>

      <Link href="/" className={styles.chapter}>
        <span className={styles.chapterIndex}>
          {String(level.chapter.index).padStart(2, "0")}
        </span>
        {level.chapter.title}
      </Link>

      {/* One dot per level: compact enough to stay honest at seventy. */}
      <nav className={styles.track} aria-label="Levels">
        {levels.map((candidate, index) => (
          <Link
            key={candidate.id}
            href={`/level/${candidate.id}`}
            className={styles.dot}
            data-current={candidate.id === currentLevelId || undefined}
            data-solved={solved.includes(candidate.id) || undefined}
            data-chapter-start={
              candidate.chapterId !== levels[index - 1]?.chapterId || undefined
            }
            aria-label={`Level ${candidate.id} — ${candidate.title}`}
            aria-current={candidate.id === currentLevelId ? "step" : undefined}
            title={`${String(candidate.id).padStart(2, "0")} · ${candidate.title}`}
          />
        ))}
      </nav>

      <div className={styles.actions}>
        <span className={styles.counter}>
          {String(currentLevelId).padStart(2, "0")}/{String(lastLevelId()).padStart(2, "0")}
        </span>

        {previousId ? (
          <Link href={`/level/${previousId}`} className={styles.step} aria-label="Previous level">
            ‹
          </Link>
        ) : (
          <span className={`${styles.step} ${styles.stepDisabled}`} aria-hidden="true">
            ‹
          </span>
        )}

        {nextId ? (
          <Link href={`/level/${nextId}`} className={styles.step} aria-label="Next level">
            ›
          </Link>
        ) : (
          <span className={`${styles.step} ${styles.stepDisabled}`} aria-hidden="true">
            ›
          </span>
        )}

        <button type="button" className={styles.reset} onClick={resetLevel}>
          reset
        </button>
      </div>
    </header>
  );
}
