import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile above the project is ignored.
  turbopack: { root: __dirname },
  /*
   * Cache Components and partial prefetching are off on purpose: the game is a
   * client-side shell session, so there is no server-rendered content for the
   * PPR shell to validate, and leaving them on makes the dynamic import of the
   * game fail that validation.
   */
};

export default nextConfig;
