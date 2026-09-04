#!/usr/bin/env node
/**
 * Regenerates src/frameworks/fallback-index.json from the live upstreams.
 *
 * The snapshot is what the server serves when a documentation site is
 * unreachable or rate-limited, so it should be refreshed as part of preparing a
 * release. It is committed deliberately: the package must be useful offline.
 *
 *     node scripts/build-fallback-index.mjs
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { createHttpClient } from "../src/core/http.js";
import { ADAPTERS, FRAMEWORKS } from "../src/frameworks/index.js";
import { NAME, VERSION } from "../src/settings.js";

const http = createHttpClient({
  userAgent: `${NAME}/${VERSION} (+https://github.com/ajaymahato431/frontlens-mcp)`,
  timeoutMs: 30000,
  headers: process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {},
});

const snapshot = {};
let total = 0;
let failed = 0;

for (const framework of FRAMEWORKS) {
  try {
    const entries = await ADAPTERS[framework].fetchIndex(http, { ttl: 0 });

    // `framework` is re-attached on load, so storing it here would just bloat
    // the file by a thousand copies of a string the loader already knows.
    snapshot[framework] = entries.map(({ path, title, category, sources }) => ({
      path,
      title,
      category,
      sources,
    }));

    total += entries.length;
    console.log(`${framework.padEnd(11)} ${String(entries.length).padStart(5)} pages`);
  } catch (error) {
    failed++;
    console.error(`${framework.padEnd(11)} FAILED: ${error.message}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} framework(s) failed; refusing to write a partial snapshot.`);
  process.exit(1);
}

const target = fileURLToPath(new URL("../src/frameworks/fallback-index.json", import.meta.url));
writeFileSync(target, `${JSON.stringify(snapshot)}\n`, "utf8");

console.log(`\nWrote ${total} pages to src/frameworks/fallback-index.json`);
