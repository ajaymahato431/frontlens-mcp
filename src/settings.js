/**
 * Server identity and configuration schema.
 *
 * Kept out of index.js so that tests and documentation checks can import it
 * without starting a server.
 */

export const NAME = "frontlens-mcp";
export const VERSION = "1.0.0";

const HOURS = 60 * 60 * 1000;

export const SCHEMA = {
  projectDir: {
    flag: "project-dir",
    env: "FRONTLENS_PROJECT_DIR",
    type: "string",
    default: "",
    description: "Default project directory to inspect if not specified in tool call",
  },
  githubToken: {
    secret: true,
    env: "GITHUB_TOKEN",
    type: "string",
    default: "",
    description: "Optional GitHub token; raises the anonymous rate limit for raw doc fetches",
  },
  requestTimeoutMs: {
    flag: "timeout",
    env: "REQUEST_TIMEOUT_MS",
    type: "number",
    default: 15000,
    description: "Per-request timeout in milliseconds",
  },
  retries: {
    flag: "retries",
    env: "REQUEST_RETRIES",
    type: "number",
    default: 2,
    description: "Retry attempts for transient upstream failures",
  },
  cacheMax: {
    flag: "cache-max",
    env: "CACHE_MAX_ENTRIES",
    type: "number",
    default: 100,
    description: "Maximum cached documents",
  },
  docTtlMs: {
    flag: "doc-ttl",
    env: "DOC_TTL_MS",
    type: "number",
    default: 3 * HOURS,
    description: "Cache lifetime for documentation pages",
  },
  indexTtlMs: {
    flag: "index-ttl",
    env: "INDEX_TTL_MS",
    type: "number",
    default: 6 * HOURS,
    description: "Cache lifetime for the documentation index",
  },
  negativeTtlMs: {
    flag: "negative-ttl",
    env: "NEGATIVE_TTL_MS",
    type: "number",
    default: 60 * 1000,
    description: "How long a failed fetch is remembered before retrying",
  },
  maxResults: {
    flag: "max-results",
    env: "SEARCH_MAX_RESULTS",
    type: "number",
    default: 5,
    description: "Default number of search results",
  },
};
