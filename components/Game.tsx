"use client";

import dynamic from "next/dynamic";
import type { LevelContent } from "@/lib/types";
import styles from "./Game.module.css";

/**
 * The game is rendered on the client only.
 *
 * A terminal is inert without JavaScript, so prerendering it buys nothing —
 * and it would mean server-rendering a shell session whose filesystem, history
 * and current level only exist once the store has been initialised in the
 * browser.
 */
const GameShell = dynamic(() => import("./GameShell"), {
  ssr: false,
  loading: () => (
    <div className={styles.booting}>
      <span className={styles.bootSigil}>$</span> booting shelly…
    </div>
  ),
});

export function Game({ content, levelId }: { content: LevelContent[]; levelId: number }) {
  return <GameShell content={content} levelId={levelId} />;
}
