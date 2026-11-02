import { notFound } from "next/navigation";
import { Game } from "@/components/Game";
import { loadLevelContent } from "@/lib/levels/loadContent";

export function generateStaticParams() {
  return loadLevelContent().map((level) => ({ id: String(level.id) }));
}

export default async function LevelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const levelId = Number.parseInt(id, 10);
  const content = loadLevelContent();

  if (!content.some((level) => level.id === levelId)) notFound();

  return <Game content={content} levelId={levelId} />;
}
