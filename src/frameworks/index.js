/**
 * Framework registry: turns five upstream documentation sites into one index.
 *
 * Each adapter owns the quirks of its own source. This module owns the promise
 * the tools depend on: **a framework that fails must never fail the index**. An
 * upstream outage, a rate limit or a renamed file degrades that one framework to
 * its vendored snapshot and leaves the other four live.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import * as react from "./react.js";
import * as nextjs from "./nextjs.js";
import * as vite from "./vite.js";
import * as tailwind from "./tailwind.js";
import * as typescript from "./typescript.js";

export const ADAPTERS = { react, nextjs, vite, tailwind, typescript };

/** Tool enums and `--help` text derive from this, so order is user-visible. */
export const FRAMEWORKS = ["react", "nextjs", "vite", "tailwind", "typescript"];

let fallbackCache = null;

/**
 * The snapshot shipped in the package, used when an upstream cannot be reached.
 * Read lazily so an unparseable file cannot stop the server from starting.
 */
export function loadFallbackIndex() {
  if (fallbackCache) return fallbackCache;

  try {
    const path = fileURLToPath(new URL("./fallback-index.json", import.meta.url));
    fallbackCache = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    fallbackCache = {};
  }

  return fallbackCache;
}

function fallbackFor(framework) {
  const entries = loadFallbackIndex()[framework];
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => ({ ...entry, framework, stale: true }));
}

/**
 * Loads every framework index in parallel.
 *
 * Returns the merged entries plus a `degraded` list naming any framework served
 * from its snapshot and why, so a tool can say so instead of quietly answering
 * from month-old data.
 */
export async function loadIndex({ http, ttl, frameworks = FRAMEWORKS } = {}) {
  const wanted = frameworks.filter((name) => ADAPTERS[name]);
  const indexTtl = ttl ?? http?.indexTtl;

  const settled = await Promise.allSettled(
    wanted.map((name) => ADAPTERS[name].fetchIndex(http, { ttl: indexTtl }))
  );

  const entries = [];
  const degraded = [];

  settled.forEach((result, i) => {
    const framework = wanted[i];

    if (result.status === "fulfilled" && result.value.length > 0) {
      entries.push(...result.value);
      return;
    }

    const reason =
      result.status === "rejected"
        ? (result.reason?.message ?? String(result.reason))
        : "upstream returned an empty index";

    const snapshot = fallbackFor(framework);
    entries.push(...snapshot);
    degraded.push({ framework, reason, entries: snapshot.length });
  });

  return { entries, degraded };
}

/** Applies the owning adapter's markdown cleanup to a fetched page. */
export function cleanPageFor(framework, text) {
  const adapter = ADAPTERS[framework];
  if (!adapter?.cleanPage) return String(text ?? "").trim();
  return adapter.cleanPage(text);
}
