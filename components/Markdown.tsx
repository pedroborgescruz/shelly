import type { ReactNode } from "react";
import styles from "./Markdown.module.css";

/**
 * A deliberately tiny Markdown renderer for lesson copy. It handles exactly
 * what the lessons use — paragraphs, bullet lists, fenced code blocks, and
 * inline code/bold/italic — which keeps the whole lesson pipeline dependency
 * free and the output predictable inside a monospace layout.
 */

type Block =
  | { kind: "paragraph"; lines: string[] }
  | { kind: "list"; items: string[] }
  | { kind: "code"; lines: string[] };

function toBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    if (line.trimStart().startsWith("```")) {
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trimStart().startsWith("```")) {
        body.push(lines[index]);
        index += 1;
      }
      index += 1; // closing fence
      blocks.push({ kind: "code", lines: body });
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        let item = lines[index].replace(/^\s*[-*]\s+/, "");
        index += 1;
        // Continuation lines are indented under the bullet.
        while (index < lines.length && /^\s{2,}\S/.test(lines[index]) && !/^\s*[-*]\s+/.test(lines[index])) {
          item += " " + lines[index].trim();
          index += 1;
        }
        items.push(item);
      }
      blocks.push({ kind: "list", items });
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !lines[index].trimStart().startsWith("```")
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ kind: "paragraph", lines: paragraph });
  }

  return blocks;
}

/** `code`, **bold** and *italic*, in one pass so nesting cannot double-wrap. */
const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;

function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return (
        <code key={index} className={styles.inlineCode}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 3) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export function Markdown({ source }: { source: string }) {
  return (
    <div className={styles.prose}>
      {toBlocks(source).map((block, index) => {
        if (block.kind === "code") {
          return (
            <pre key={index} className={styles.codeBlock}>
              <code>{block.lines.join("\n")}</code>
            </pre>
          );
        }
        if (block.kind === "list") {
          return (
            <ul key={index} className={styles.list}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{renderInline(block.lines.join(" "))}</p>;
      })}
    </div>
  );
}

/** Inline-only rendering, for one-line prompts and objectives. */
export function MarkdownInline({ source }: { source: string }) {
  return <>{renderInline(source)}</>;
}
