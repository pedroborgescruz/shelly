/** Fixtures the levels read. Kept in one place so several levels can share them. */

export const APP_LOG = [
  "2026-03-11 09:12:04 INFO  server listening on :3000",
  "2026-03-11 09:12:51 INFO  GET /healthz 200",
  "2026-03-11 09:13:02 WARN  slow query: users.findAll took 912ms",
  "2026-03-11 09:13:40 ERROR unhandled rejection: ECONNREFUSED 127.0.0.1:5432",
  "2026-03-11 09:14:15 INFO  GET /api/levels 200",
  "2026-03-11 09:14:58 ERROR failed to write session: disk quota exceeded",
  "2026-03-11 09:15:22 WARN  retrying connection (attempt 2)",
  "2026-03-11 09:15:23 INFO  GET /healthz 200",
  "2026-03-11 09:16:07 ERROR panic in worker shelly-3: out of memory",
  "2026-03-11 09:16:44 Warn  cache miss rate above 40%",
  "2026-03-11 09:17:02 INFO  GET /api/levels 200",
  "2026-03-11 09:17:35 INFO  POST /api/progress 201",
].join("\n");

export const APP_LOG_ERRORS = APP_LOG.split("\n").filter((line) => line.includes("ERROR"));

/** Deliberately repetitive, so `sort | uniq -c` has something to say. */
export const ACCESS_LOG = [
  "203.0.113.42 GET /healthz 200",
  "198.51.100.7 GET / 200",
  "203.0.113.42 GET /api/levels 200",
  "192.0.2.15 GET /favicon.ico 404",
  "203.0.113.42 POST /api/progress 201",
  "198.51.100.7 GET /api/levels 200",
  "203.0.113.42 GET /healthz 200",
  "192.0.2.15 GET /admin 403",
  "198.51.100.7 GET /healthz 200",
  "203.0.113.42 GET /healthz 200",
].join("\n");

/** Unsorted and repetitive on purpose: `sort | uniq -c` has to earn its keep. */
export const NAMES = ["ana", "bruno", "ana", "carla", "bruno", "ana", "dani"].join("\n");

/** The line level 18 asks you to write into `.env`. */
export const SECRET = "API_KEY=shelly-dev-7f3a";
