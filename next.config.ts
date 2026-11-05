import type { NextConfig } from "next";

/*
 * GitHub Pages serves static files and nothing else, so the site is exported
 * as plain HTML. The game is a client-side shell session with no server work
 * of any kind, so nothing is lost by it.
 *
 * `basePath` is only applied in CI: the site lives at /shelly/ on Pages, but
 * at / during local development.
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repository = "/shelly";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile above the project is ignored.
  turbopack: { root: __dirname },

  output: "export",

  /*
   * Pages resolves /level/1/ to level/1/index.html. Without this, the export
   * writes level/1.html, which that URL never reaches.
   */
  trailingSlash: true,

  basePath: isGithubPages ? repository : undefined,
  assetPrefix: isGithubPages ? repository : undefined,

  /* The optimizer needs a server; there is none. */
  images: { unoptimized: true },

  /*
   * Cache Components and partial prefetching are off on purpose: the game is a
   * client-side shell session, so there is no server-rendered content for the
   * PPR shell to validate, and leaving them on makes the dynamic import of the
   * game fail that validation.
   */
};

export default nextConfig;
