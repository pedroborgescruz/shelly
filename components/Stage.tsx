"use client";

import { useShellStore } from "@/store/useShellStore";
import { FileTree } from "./FileTree";
import { ManualPage } from "./ManualPage";
import styles from "./Stage.module.css";

export function Stage() {
  const stage = useShellStore((state) => state.stage);
  const showTree = useShellStore((state) => state.showTree);
  const showManual = useShellStore((state) => state.showManual);

  const isManual = stage.kind === "manual";

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Right pane">
        <button
          type="button"
          role="tab"
          aria-selected={!isManual}
          className={styles.tab}
          data-active={!isManual || undefined}
          onClick={showTree}
        >
          filesystem
        </button>

        {isManual && (
          <button
            type="button"
            role="tab"
            aria-selected
            className={styles.tab}
            data-active
            onClick={() => showManual(stage.command)}
          >
            tldr {stage.command}
          </button>
        )}

        <span className={styles.hint}>
          {isManual ? "esc the docs by clicking filesystem" : "updates as the shell runs"}
        </span>
      </div>

      <div
        className={`${styles.content} scroller`}
        // Keying on the panel identity restarts the fade whenever it swaps.
        key={isManual ? `manual:${stage.command}` : "tree"}
      >
        {isManual ? <ManualPage command={stage.command} /> : <FileTree />}
      </div>
    </>
  );
}
