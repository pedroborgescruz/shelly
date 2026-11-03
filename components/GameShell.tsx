"use client";

import { hydrateCatalog } from "@/lib/levels";
import type { LevelContent } from "@/lib/types";
import { useShellStore } from "@/store/useShellStore";
import { Header } from "./Header";
import { LessonPane } from "./LessonPane";
import { Stage } from "./Stage";
import { Terminal } from "./Terminal";
import styles from "./Game.module.css";

export interface GameProps {
  content: LevelContent[];
  levelId: number;
}

/**
 * Installs the catalog and starts the requested level before anything reads the
 * store.
 *
 * Both calls are idempotent and run in the render body rather than in a
 * one-shot initialiser, so a module reload — or any other reason the modules
 * lose their state while React keeps its own — repairs itself on the next
 * render instead of leaving the game stranded. GameShell deliberately
 * subscribes to nothing: it writes to the store during this render, and only
 * its children may observe the result.
 */
export default function GameShell({ content, levelId }: GameProps) {
  hydrateCatalog(content);
  if (useShellStore.getState().currentLevelId !== levelId) {
    useShellStore.getState().loadLevel(levelId);
  }

  return (
    <main className={styles.shell}>
      <Header />
      <div className={styles.panes}>
        <section className={styles.sandbox} aria-label="Lesson and terminal">
          <LessonPane />
          <Terminal />
        </section>
        <aside className={styles.stage} aria-label="Filesystem and manual">
          <Stage />
        </aside>
      </div>
    </main>
  );
}
