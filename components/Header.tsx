"use client";

import Link from "next/link";
import { allLevels } from "@/lib/levels";
import { useIsHydrated } from "@/lib/useIsHydrated";
import { useShellStore } from "@/store/useShellStore";
import styles from "./Header.module.css";

export function Header() {
  const currentLevelId = useShellStore((state) => state.currentLevelId);
  const solvedLevelIds = useShellStore((state) => state.solvedLevelIds);
  const resetLevel = useShellStore((state) => state.resetLevel);
  const hydrated = useIsHydrated();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <span className={styles.sigil}>$</span>
        <span className={styles.name}>shelly</span>
        <span className={styles.tagline}>all levels</span>
      </Link>

      <nav className={styles.levels} aria-label="Levels">
        {allLevels().map((level) => {
          const isCurrent = level.id === currentLevelId;
          const isSolved = hydrated && solvedLevelIds.includes(level.id);
          return (
            <Link
              key={level.id}
              href={`/level/${level.id}`}
              className={styles.level}
              data-current={isCurrent || undefined}
              data-solved={isSolved || undefined}
              aria-current={isCurrent ? "step" : undefined}
              title={`Level ${level.id} — ${level.title}`}
            >
              <span className={styles.levelNumber}>
                {isSolved ? "✓" : String(level.id).padStart(2, "0")}
              </span>
              <span className={styles.levelTitle}>{level.title}</span>
            </Link>
          );
        })}
      </nav>

      <button type="button" className={styles.reset} onClick={resetLevel}>
        reset level
      </button>
    </header>
  );
}
