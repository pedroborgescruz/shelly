import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile above the project is ignored.
  turbopack: { root: __dirname },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
