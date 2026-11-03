"use client";

import Link from "next/link";
import { allLevels, hydrateCatalog, levelsByChapter } from "@/lib/levels";
import type { LevelContent } from "@/lib/types";
import { useIsHydrated } from "@/lib/useIsHydrated";
import { useShellStore } from "@/store/useShellStore";
import styles from "./ChapterMap.module.css";

export function ChapterMap({ content }: { content: LevelContent[] }) {
  hydrateCatalog(content);
  const levels = allLevels();

  const solvedLevelIds = useShellStore((state) => state.solvedLevelIds);
  const helpedLevelIds = useShellStore((state) => state.helpedLevelIds);
  const lastVisitedLevelId = useShellStore((state) => state.lastVisitedLevelId);
  const hydrated = useIsHydrated();

  const solved = hydrated ? solvedLevelIds : [];
  const helped = hydrated ? helpedLevelIds : [];
  const resumeId = hydrated ? lastVisitedLevelId : levels[0]?.id;

  const chapters = levelsByChapter(levels);
  const readyCount = levels.length;

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>
          <span className={styles.sigil}>$</span> shelly
        </p>
        <h1 className={styles.title}>Learn the Unix shell by using one.</h1>
        <p className={styles.lede}>
          A terminal that teaches itself, in the shape of{" "}
          <a href="https://missing.csail.mit.edu/" target="_blank" rel="noreferrer">
            The Missing Semester
          </a>
          . Read the lesson, type real commands, watch the filesystem change.
        </p>

        <div className={styles.actions}>
          <Link className={styles.start} href={`/level/${resumeId ?? 1}`}>
            {solved.length > 0 ? "resume →" : "start at level 01 →"}
          </Link>
          <span className={styles.progress}>
            {solved.length} of {readyCount} levels solved
          </span>
        </div>
      </header>

      <ol className={styles.chapters}>
        {chapters.map(({ chapter, levels: chapterLevels }) => (
          <li key={chapter.id} className={styles.chapter} data-status={chapter.status}>
            <div className={styles.chapterHead}>
              <span className={styles.chapterIndex}>
                {String(chapter.index).padStart(2, "0")}
              </span>
              <h2 className={styles.chapterTitle}>{chapter.title}</h2>
              {chapter.status === "planned" && <span className={styles.soon}>planned</span>}
            </div>
            <p className={styles.chapterSummary}>{chapter.summary}</p>

            {chapterLevels.length > 0 && (
              <ul className={styles.levels}>
                {chapterLevels.map((level) => {
                  const isSolved = solved.includes(level.id);
                  return (
                    <li key={level.id}>
                      <Link
                        href={`/level/${level.id}`}
                        className={styles.level}
                        data-solved={isSolved || undefined}
                      >
                        <span className={styles.levelMark}>{isSolved ? "✓" : "·"}</span>
                        <span className={styles.levelName}>{level.title}</span>
                        <span className={styles.levelDescription}>{level.description}</span>
                        {isSolved && helped.includes(level.id) && (
                          <span className={styles.helped}>with help</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ol>

      <footer className={styles.footer}>
        <p>
          Not a replacement for the course — a place to build the muscle memory it
          assumes. Vim and Git are separate engines, and still to come.
        </p>
      </footer>
    </main>
  );
}
