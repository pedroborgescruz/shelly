"use client";

import { useState } from "react";
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
 * store. Game itself deliberately subscribes to nothing — the store is written
 * to during this render, and only its children may observe the result.
 */
export default function GameShell({ content, levelId }: GameProps) {
  useState(() => {
    hydrateCatalog(content);
    if (useShellStore.getState().currentLevelId !== levelId) {
      useShellStore.getState().loadLevel(levelId);
    }
    return null;
  });

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
