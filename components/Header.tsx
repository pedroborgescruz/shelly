"use client";

import { LEVELS } from "@/lib/levels";
import { useShellStore } from "@/store/useShellStore";
import styles from "./Header.module.css";

export function Header() {
  const currentLevelId = useShellStore((state) => state.currentLevelId);
  const solvedLevelIds = useShellStore((state) => state.solvedLevelIds);
  const loadLevel = useShellStore((state) => state.loadLevel);
  const resetLevel = useShellStore((state) => state.resetLevel);

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.sigil}>$</span>
        <span className={styles.name}>shelly</span>
        <span className={styles.tagline}>learn the shell by using it</span>
      </div>

      <nav className={styles.levels} aria-label="Levels">
        {LEVELS.map((level) => {
          const isCurrent = level.id === currentLevelId;
          const isSolved = solvedLevelIds.includes(level.id);
          return (
            <button
              key={level.id}
              type="button"
              className={styles.level}
              data-current={isCurrent || undefined}
              data-solved={isSolved || undefined}
              aria-current={isCurrent ? "step" : undefined}
              onClick={() => loadLevel(level.id)}
              title={`Level ${level.id} — ${level.title}`}
            >
              <span className={styles.levelNumber}>{String(level.id).padStart(2, "0")}</span>
              <span className={styles.levelTitle}>{level.title}</span>
            </button>
          );
        })}
      </nav>

      <button type="button" className={styles.reset} onClick={resetLevel}>
        reset level
      </button>
    </header>
  );
}
