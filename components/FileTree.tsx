"use client";

import { treeLines } from "@/lib/fs/vfs";
import { useShellStore } from "@/store/useShellStore";
import styles from "./FileTree.module.css";

/** Pick a colour role for an entry the way `ls --color` would. */
function roleFor(name: string, kind: "dir" | "file"): string {
  if (kind === "dir") return "dir";
  if (name.endsWith(".sh")) return "exec";
  if (name.endsWith(".log")) return "log";
  if (name.startsWith(".")) return "hidden";
  return "file";
}

export function FileTree() {
  const fileSystem = useShellStore((state) => state.fileSystem);
  const currentDirectory = useShellStore((state) => state.currentDirectory);
  const createdPaths = useShellStore((state) => state.createdPaths);

  const created = new Set(createdPaths);
  const lines = treeLines(fileSystem, "");

  return (
    <div className={styles.tree}>
      <div className={styles.rootLine}>
        <span className={styles.root}>/</span>
      </div>

      {lines.map((line) => {
        const isCwd = line.path === currentDirectory;
        return (
          <div
            key={line.path}
            className={styles.line}
            data-cwd={isCwd || undefined}
            data-new={created.has(line.path) || undefined}
          >
            <span className={styles.prefix}>{line.prefix}</span>
            <span className={styles.name} data-role={roleFor(line.name, line.kind)}>
              {line.name}
              {line.kind === "dir" ? "/" : ""}
            </span>
            {isCwd && <span className={styles.youAreHere}>← you are here</span>}
          </div>
        );
      })}

      <div className={styles.legend}>
        <span>
          <i className={styles.swatchDir} /> directory
        </span>
        <span>
          <i className={styles.swatchNew} /> created by you
        </span>
      </div>
    </div>
  );
}
