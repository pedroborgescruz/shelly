"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { displayPath, isDir, listDir, lookup, resolve } from "@/lib/fs/vfs";
import { getLevel } from "@/lib/levels";
import { META_COMMANDS } from "@/lib/commands";
import { useShellStore } from "@/store/useShellStore";
import styles from "./Terminal.module.css";

/** Longest string that every candidate starts with. */
function commonPrefix(values: string[]): string {
  if (values.length === 0) return "";
  let prefix = values[0];
  for (const value of values.slice(1)) {
    while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

export function Terminal() {
  const history = useShellStore((state) => state.history);
  const inputHistory = useShellStore((state) => state.inputHistory);
  const currentDirectory = useShellStore((state) => state.currentDirectory);
  const fileSystem = useShellStore((state) => state.fileSystem);
  const currentLevelId = useShellStore((state) => state.currentLevelId);
  const executeCommand = useShellStore((state) => state.executeCommand);
  const printInfo = useShellStore((state) => state.printInfo);
  const markHelpUsed = useShellStore((state) => state.markHelpUsed);

  const [value, setValue] = useState("");
  /** How far back in `inputHistory` the arrow keys have walked. */
  const [recallIndex, setRecallIndex] = useState<number | null>(null);
  /** How many lines of the canonical solution `solve` has typed so far. */
  const [solveStep, setSolveStep] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  /* Keep the newest line in view as output arrives. */
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [history]);

  function complete() {
    const level = getLevel(currentLevelId);
    const beforeCursor = value;
    const tokens = beforeCursor.split(/\s+/);
    const isFirstWord = tokens.length === 1;
    const word = tokens[tokens.length - 1] ?? "";

    let candidates: string[];
    let replaceFrom = word;

    if (isFirstWord) {
      candidates = [...Object.keys(level.allowedCommands), ...META_COMMANDS].filter((name) =>
        name.startsWith(word),
      );
    } else {
      const cut = word.lastIndexOf("/");
      const dirPart = cut === -1 ? "" : word.slice(0, cut + 1);
      const prefix = cut === -1 ? word : word.slice(cut + 1);
      const node = lookup(fileSystem, resolve(currentDirectory, dirPart || "."));
      if (!isDir(node)) return;
      candidates = listDir(node, { all: prefix.startsWith(".") })
        .filter((name) => name.startsWith(prefix))
        .map((name) => dirPart + name + (node.children[name].type === "dir" ? "/" : ""));
      replaceFrom = word;
    }

    if (candidates.length === 0) return;

    const completion =
      candidates.length === 1 ? candidates[0] : commonPrefix(candidates);

    if (completion.length > replaceFrom.length) {
      const next = beforeCursor.slice(0, beforeCursor.length - replaceFrom.length) + completion;
      setValue(candidates.length === 1 && !completion.endsWith("/") ? next + " " : next);
      return;
    }

    if (candidates.length > 1) printInfo(candidates.join("  "));
  }

  /**
   * The last rung of the help ladder: type the answer into the prompt instead
   * of printing it, so the solution still passes through the player's fingers.
   */
  function solve() {
    const level = getLevel(currentLevelId);
    const steps = level.solutions[0] ?? [];
    const step = steps[solveStep];

    if (!step) {
      printInfo("Nothing left to type — press Enter to run the line in the prompt.");
      return;
    }

    markHelpUsed();
    printInfo(
      `solve — step ${solveStep + 1} of ${steps.length} is in the prompt. Read it, then press Enter.`,
    );
    setValue(step);
    setSolveStep(solveStep + 1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();

      if (value.trim().split(/\s+/)[0] === "solve") {
        solve();
        return;
      }

      executeCommand(value);
      setValue("");
      setRecallIndex(null);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      complete();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (inputHistory.length === 0) return;
      const next = recallIndex === null ? inputHistory.length - 1 : Math.max(0, recallIndex - 1);
      setRecallIndex(next);
      setValue(inputHistory[next]);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (recallIndex === null) return;
      const next = recallIndex + 1;
      if (next >= inputHistory.length) {
        setRecallIndex(null);
        setValue("");
        return;
      }
      setRecallIndex(next);
      setValue(inputHistory[next]);
      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      executeCommand("clear");
      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      printInfo(`${displayPath(currentDirectory)} $ ${value}^C`);
      setValue("");
      setRecallIndex(null);
    }
  }

  return (
    <div
      className={styles.terminal}
      onClick={() => inputRef.current?.focus()}
      role="presentation"
    >
      <div className={`${styles.scrollback} scroller`} ref={scrollerRef}>
        {history.map((item) => (
          <div key={item.id} className={styles.entry}>
            {item.command !== "" && (
              <div className={styles.commandLine}>
                <Prompt path={item.cwd ?? displayPath(currentDirectory)} />
                <span className={styles.command}>{item.command}</span>
              </div>
            )}
            {item.output !== "" && (
              <pre className={styles.output} data-status={item.status}>
                {item.output}
              </pre>
            )}
          </div>
        ))}

        <div className={styles.inputLine}>
          <Prompt path={displayPath(currentDirectory)} />
          <input
            ref={inputRef}
            className={styles.input}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-label="Terminal input"
            autoFocus
          />
        </div>
      </div>

      <div className={styles.hints}>
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> history
        </span>
        <span>
          <kbd>Tab</kbd> complete
        </span>
        <span>
          <kbd>Ctrl</kbd>+<kbd>L</kbd> clear
        </span>
        <span>
          <code>help</code> · <code>tldr &lt;cmd&gt;</code> · <code>hint</code> ·{" "}
          <code>solve</code> · <code>reset</code>
        </span>
      </div>
    </div>
  );
}

function Prompt({ path }: { path: string }) {
  return (
    <span className={styles.prompt} aria-hidden="true">
      <span className={styles.promptUser}>shelly</span>
      <span className={styles.promptPath}>{path}</span>
      <span className={styles.promptSigil}>$</span>
    </span>
  );
}
