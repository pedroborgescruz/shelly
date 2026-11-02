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
].join("\n");

export const APP_LOG_ERRORS = APP_LOG.split("\n").filter((line) => line.includes("ERROR"));

/** The line level 3 asks you to write into `.env`. */
export const SECRET = "API_KEY=shelly-dev-7f3a";
