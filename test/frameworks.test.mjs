/**
 * Offline tests for the framework index adapters.
 *
 * Each adapter is driven by a stub HTTP client backed by fixtures, so these
 * assert the parsing and the failure contract without touching the network.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import * as react from "../src/frameworks/react.js";
import * as nextjs from "../src/frameworks/nextjs.js";
import * as vite from "../src/frameworks/vite.js";
import * as tailwind from "../src/frameworks/tailwind.js";
import * as typescript from "../src/frameworks/typescript.js";
import { loadIndex, loadFallbackIndex, cleanPageFor, FRAMEWORKS } from "../src/frameworks/index.js";
import { parseSitemap, titleFromSlug, titleFromFrontmatter } from "../src/frameworks/sources.js";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const fixture = (name) => readFileSync(join(FIXTURES, name), "utf8");

/** An HTTP client that serves fixtures and refuses anything unexpected. */
function stubHttp(routes) {
  return {
    indexTtl: 1000,
    async fetchText(url) {
      const body = routes[url];
      if (body === undefined) throw new Error(`unexpected fetchText: ${url}`);
      return body;
    },
    async fetchJson(url) {
      const body = routes[url];
      if (body === undefined) throw new Error(`unexpected fetchJson: ${url}`);
      return JSON.parse(body);
    },
  };
}

// ─── sources ─────────────────────────────────────────────────────────────────

test("parseSitemap pulls every location out of a sitemap", () => {
  const locations = parseSitemap(fixture("vite-sitemap.xml"));
  assert.equal(locations.length, 6);
  assert.ok(locations.includes("https://vite.dev/guide/why"));
});

test("titleFromSlug produces a readable name", () => {
  assert.equal(titleFromSlug("shared-options"), "Shared Options");
  assert.equal(titleFromSlug("use-action-state"), "Use Action State");
});

test("titleFromFrontmatter reads a quoted or bare title", () => {
  assert.equal(titleFromFrontmatter("---\ntitle: Installation\n---\n# hi"), "Installation");
  assert.equal(titleFromFrontmatter('---\ntitle: "Async APIs"\n---\n'), "Async APIs");
  assert.equal(titleFromFrontmatter("no frontmatter here"), null);
});

// ─── react ───────────────────────────────────────────────────────────────────

test("react adapter flattens the sidebar and keeps official grouping", async () => {
  const sidebar = fixture("react-sidebar.json");
  const http = stubHttp({
    "https://raw.githubusercontent.com/reactjs/react.dev/main/src/sidebarLearn.json": sidebar,
    "https://raw.githubusercontent.com/reactjs/react.dev/main/src/sidebarReference.json": sidebar,
  });

  const entries = await react.fetchIndex(http, { ttl: 0 });

  const hook = entries.find((e) => e.path === "react/reference/react/useActionState");
  assert.ok(hook, "the hook page must be indexed");
  assert.equal(hook.title, "useActionState");
  assert.equal(hook.category, "Hooks");
  assert.equal(hook.framework, "react");

  // Landing pages and ordinary pages are indistinguishable in the navigation, so
  // both candidate files are offered.
  assert.equal(hook.sources.length, 2);
  assert.match(hook.sources[0], /content\/reference\/react\/useActionState\.md$/);
  assert.match(hook.sources[1], /content\/reference\/react\/useActionState\/index\.md$/);

  // The same sidebar is served twice here; a page must still appear once.
  const paths = entries.map((e) => e.path);
  assert.equal(new Set(paths).size, paths.length, "entries must be de-duplicated");
});

test("react cleanPage strips frontmatter, Sandpack and MDX heading anchors", () => {
  const raw = [
    "---",
    "title: useActionState",
    "---",
    "## Reference {/*reference*/}",
    "Body text.",
    "<Sandpack>",
    "throwaway example",
    "</Sandpack>",
    "<Note>Keep this sentence.</Note>",
  ].join("\n");

  const out = cleanPageFor("react", raw);
  assert.doesNotMatch(out, /title: useActionState/);
  assert.doesNotMatch(out, /\{\/\*reference\*\/\}/);
  assert.doesNotMatch(out, /throwaway example/);
  assert.match(out, /## Reference$/m);
  assert.match(out, /Keep this sentence\./);
});

// ─── nextjs ──────────────────────────────────────────────────────────────────

test("nextjs adapter indexes only docs URLs and maps them to markdown", async () => {
  const http = stubHttp({ "https://nextjs.org/sitemap.xml": fixture("nextjs-sitemap.xml") });
  const entries = await nextjs.fetchIndex(http, { ttl: 0 });

  assert.equal(entries.length, 4, "the home page and blog post must be excluded");

  const install = entries.find((e) => e.path === "nextjs/app/getting-started/installation");
  assert.ok(install);
  assert.equal(install.category, "App Router");
  assert.equal(install.sources[0], "https://nextjs.org/docs/app/getting-started/installation.md");

  assert.equal(
    entries.find((e) => e.path === "nextjs/messages/no-img-element")?.category,
    "Error Messages"
  );
  assert.equal(entries.find((e) => e.path.startsWith("nextjs/pages/"))?.category, "Pages Router");
});

// ─── vite ────────────────────────────────────────────────────────────────────

test("vite adapter keeps documentation sections and resolves section landing pages", async () => {
  const http = stubHttp({ "https://vite.dev/sitemap.xml": fixture("vite-sitemap.xml") });
  const entries = await vite.fetchIndex(http, { ttl: 0 });

  // The home page, the blog post and the team page are not documentation.
  assert.equal(entries.length, 3);

  const why = entries.find((e) => e.path === "vite/guide/why");
  assert.equal(why.category, "Guide");
  assert.match(why.sources[0], /vitejs\/vite\/main\/docs\/guide\/why\.md$/);

  // `vite.dev/config` is served from `config/index.md`, not `config.md`.
  const config = entries.find((e) => e.path === "vite/config");
  assert.match(config.sources[0], /docs\/config\/index\.md$/);
});

// ─── tailwind ────────────────────────────────────────────────────────────────

test("tailwind adapter indexes top-level pages and ignores nested assets", async () => {
  const http = stubHttp({
    "https://api.github.com/repos/tailwindlabs/tailwindcss.com/git/trees/main?recursive=1":
      fixture("tailwind-tree.json"),
  });
  const entries = await tailwind.fetchIndex(http, { ttl: 0 });

  assert.equal(entries.length, 3, "images under src/docs must not become pages");
  assert.ok(entries.every((e) => !e.path.includes("img")));

  const dark = entries.find((e) => e.path === "tailwind/dark-mode");
  assert.equal(dark.title, "Dark Mode");
  assert.equal(dark.category, "Core Concepts");
  assert.equal(entries.find((e) => e.path === "tailwind/accent-color").category, "Utilities");
});

test("a truncated git tree fails loudly rather than serving half an index", async () => {
  const http = stubHttp({
    "https://api.github.com/repos/tailwindlabs/tailwindcss.com/git/trees/main?recursive=1":
      fixture("truncated-tree.json"),
  });

  await assert.rejects(() => tailwind.fetchIndex(http, { ttl: 0 }), /truncated/i);
});

// ─── typescript ──────────────────────────────────────────────────────────────

test("typescript adapter slugifies human filenames but keeps the readable title", async () => {
  const http = stubHttp({
    "https://api.github.com/repos/microsoft/TypeScript-Website/git/trees/v2?recursive=1":
      fixture("typescript-tree.json"),
  });
  const entries = await typescript.fetchIndex(http, { ttl: 0 });

  const donts = entries.find((e) => e.title.startsWith("Do"));
  assert.ok(donts, "apostrophes must survive in the title");
  assert.equal(donts.path, "typescript/declaration-files/dos-and-donts");
  assert.equal(donts.category, "Declaration Files");
  // Spaces must be percent-encoded for raw.githubusercontent.
  assert.doesNotMatch(donts.sources[0], / /);
  assert.match(donts.sources[0], /%20/);

  assert.equal(
    entries.find((e) => e.path === "typescript/project-config/tsconfig-json")?.category,
    "Project Configuration"
  );
});

// ─── registry ────────────────────────────────────────────────────────────────

test("a failing framework degrades to its snapshot instead of failing the index", async () => {
  const down = () => {
    throw new Error("network down");
  };
  const http = { indexTtl: 0, fetchText: async () => down(), fetchJson: async () => down() };

  const { entries, degraded } = await loadIndex({ http });

  assert.equal(degraded.length, FRAMEWORKS.length, "every framework should report as degraded");
  assert.ok(
    degraded.every((d) => /network down/.test(d.reason)),
    "the reason must survive so the tool can explain itself"
  );
  // The vendored snapshot is what keeps the server useful with no network.
  assert.ok(entries.length > 500, `expected the bundled snapshot, got ${entries.length} entries`);
  assert.ok(entries.every((e) => e.stale === true));
});

test("the vendored snapshot covers every framework", () => {
  const snapshot = loadFallbackIndex();
  for (const framework of FRAMEWORKS) {
    assert.ok(Array.isArray(snapshot[framework]), `${framework} missing from the snapshot`);
    assert.ok(snapshot[framework].length > 0, `${framework} snapshot is empty`);
    for (const entry of snapshot[framework].slice(0, 5)) {
      assert.ok(entry.path && entry.title && Array.isArray(entry.sources));
    }
  }
});
