"use client";

import { useShellStore } from "@/store/useShellStore";
import { Header } from "./Header";
import { LessonPane } from "./LessonPane";
import { Stage } from "./Stage";
import { Terminal } from "./Terminal";
import styles from "./Game.module.css";

export function Game() {
  // Remounting the terminal on a level change resets its draft line, recall
  // index and focus without an effect that fights React.
  const currentLevelId = useShellStore((state) => state.currentLevelId);

  return (
    <main className={styles.shell}>
      <Header />
      <div className={styles.panes}>
        <section className={styles.sandbox} aria-label="Lesson and terminal">
          <LessonPane />
          <Terminal key={currentLevelId} />
        </section>
        <aside className={styles.stage} aria-label="Filesystem and manual">
          <Stage />
        </aside>
      </div>
    </main>
  );
}
