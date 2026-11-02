import type { VDir, VFile, VNode } from "@/lib/types";

/** Build a directory node from a plain map of children. */
export function dir(children: Record<string, VNode> = {}): VDir {
  return { type: "dir", children };
}

/** Build a file node. Trailing newline is added unless the content is empty. */
export function file(content = ""): VFile {
  return { type: "file", content: content && !content.endsWith("\n") ? content + "\n" : content };
}

/** Wrap a home directory in the `/home/shelly` prefix every level shares. */
export function homeAt(children: Record<string, VNode>): VDir {
  return dir({ home: dir({ shelly: dir(children) }) });
}
