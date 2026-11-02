import { ChapterMap } from "@/components/ChapterMap";
import { loadLevelContent } from "@/lib/levels/loadContent";

export default function Home() {
  return <ChapterMap content={loadLevelContent()} />;
}
