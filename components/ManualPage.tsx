"use client";

import { tldrPage } from "@/lib/tldr";
import styles from "./ManualPage.module.css";

/** Render `{{placeholder}}` segments the way the tldr client highlights them. */
function renderCommand(command: string) {
  return command.split(/(\{\{[^}]+\}\})/g).map((part, index) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      return (
        <span key={index} className={styles.placeholder}>
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function ManualPage({ command }: { command: string }) {
  const page = tldrPage(command);

  if (!page) {
    return (
      <div className={styles.manual}>
        <p className={styles.missing}>No tldr page for `{command}`.</p>
      </div>
    );
  }

  return (
    <div className={styles.manual}>
      <h2 className={styles.name}>{page.name}</h2>
      <p className={styles.description}>{page.description}</p>

      <ol className={styles.examples}>
        {page.examples.map((example, index) => (
          <li key={index} className={styles.example}>
            <p className={styles.text}>- {example.text}:</p>
            <p className={styles.command}>{renderCommand(example.command)}</p>
          </li>
        ))}
      </ol>

      <p className={styles.footer}>
        Abridged in the style of <span className={styles.tldrName}>tldr</span>. Placeholders in{" "}
        <span className={styles.placeholder}>orange</span> are yours to fill in.
      </p>
    </div>
  );
}
