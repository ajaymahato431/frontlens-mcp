/**
 * Integration tests for frontlens-mcp: spawns the server as a child process over
 * stdio, performs protocol negotiation, and exercises all seven tools.
 *
 * These hit the live documentation sites. A failure here is as likely to be an
 * upstream outage as a bug, which is why CI runs them in a non-blocking job and
 * `npm test` does not include them.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import { startServer, repoRoot } from "./helpers/client.mjs";
import { NAME, VERSION } from "../src/settings.js";

const ROOT = repoRoot(import.meta.url);

const TOOLS = [
  "frontend_context",
  "list_frontend_docs",
  "search_frontend_docs",
  "read_frontend_docs",
  "check_api",
  "migration_guide",
  "frontend_best_practices",
];

/** Runs the server's CLI and returns stdout. */
function cli(...args) {
  return execFileSync(process.execPath, ["index.js", ...args], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 30000,
  });
}

// ─── protocol ────────────────────────────────────────────────────────────────

test("server initializes and reports its identity", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    assert.equal(client.serverInfo?.name, NAME);
    assert.equal(client.serverInfo?.version, VERSION);
  } finally {
    await client.close();
  }
});

test("all seven tools are advertised", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const names = (await client.listTools()).map((t) => t.name);
    for (const tool of TOOLS) {
      assert.ok(names.includes(tool), `${tool} must be registered`);
    }
    assert.equal(names.length, TOOLS.length, "expected exactly seven registered tools");
  } finally {
    await client.close();
  }
});

// ─── frontend_context ────────────────────────────────────────────────────────

test("frontend_context inspects a project and reports its details", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("frontend_context", {});
    assert.equal(res.isError, false);
    assert.match(res.text, /FrontLens Project Context/);
  } finally {
    await client.close();
  }
});

// ─── list_frontend_docs ──────────────────────────────────────────────────────

test("the default listing is a compact per-framework summary", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("list_frontend_docs", {});
    assert.equal(res.isError, false);
    assert.match(res.text, /FrontLens documentation index/);

    for (const framework of ["react", "nextjs", "vite", "tailwind", "typescript"]) {
      assert.match(res.text, new RegExp(`${framework} — [0-9]+ pages`));
    }

    // The whole point of v2: the index is the real documentation, not a handful
    // of bundled pages.
    const total = Number(res.text.match(/^(\d+) pages across/m)?.[1]);
    assert.ok(total > 500, `expected a live-sized index, got ${total}`);
  } finally {
    await client.close();
  }
});

test("a framework listing returns its categories", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("list_frontend_docs", { framework: "react" });
    assert.equal(res.isError, false);
    assert.match(res.text, /Hooks — \d+ pages/);
  } finally {
    await client.close();
  }
});

test("a category listing returns real page paths and pages them", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("list_frontend_docs", {
      framework: "react",
      category: "Hooks",
      limit: 5,
    });
    assert.equal(res.isError, false);
    assert.match(res.text, /Showing 5 of \d+/);
    assert.match(res.text, /react\/reference\/react\/use/);
    assert.match(res.text, /offset 5/);
  } finally {
    await client.close();
  }
});

test("an unknown category reports the available ones", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("list_frontend_docs", {
      framework: "react",
      category: "Nonexistent",
    });
    assert.equal(res.isError, true);
    assert.match(res.text, /Available categories/);
  } finally {
    await client.close();
  }
});

// ─── search_frontend_docs ────────────────────────────────────────────────────

test("search finds the live upstream page, not just the bundled one", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("search_frontend_docs", { query: "useActionState" });
    assert.equal(res.isError, false);
    // This path exists only in the live react.dev navigation.
    assert.match(res.text, /react\/reference\/react\/useActionState/);
  } finally {
    await client.close();
  }
});

test("the framework filter narrows results", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("search_frontend_docs", {
      query: "dark mode",
      framework: "tailwind",
      maxResults: 3,
    });
    assert.equal(res.isError, false);
    assert.match(res.text, /\[TAILWIND\]/);
    assert.doesNotMatch(res.text, /\[REACT\]/);
  } finally {
    await client.close();
  }
});

test("a hopeless query says so instead of returning noise", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("search_frontend_docs", {
      query: "zzzzqqqxnotarealsymbol",
    });
    assert.equal(res.isError, false);
    assert.match(res.text, /Nothing matched/);
  } finally {
    await client.close();
  }
});

// ─── read_frontend_docs ──────────────────────────────────────────────────────

test("reading a live page returns upstream markdown and names its source", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("read_frontend_docs", {
      path: "react/reference/react/useActionState",
    });
    assert.equal(res.isError, false);
    assert.match(res.text, /raw\.githubusercontent\.com\/reactjs\/react\.dev/);
    assert.match(res.text, /useActionState/);
    assert.match(res.text, /tokens/);
  } finally {
    await client.close();
  }
});

test("outline mode is cheap and lists headings", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const full = await client.call("read_frontend_docs", { path: "tailwind/dark-mode" });
    const outline = await client.call("read_frontend_docs", {
      path: "tailwind/dark-mode",
      outline: true,
    });

    assert.equal(outline.isError, false);
    assert.match(outline.text, /Outline —/);
    assert.ok(
      outline.text.length < full.text.length,
      "an outline must be smaller than the page it summarises"
    );
  } finally {
    await client.close();
  }
});

test("a section is extracted rather than the whole page", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("read_frontend_docs", {
      path: "react/upgrade-react-19",
      section: "Removed deprecated React DOM APIs",
    });
    assert.equal(res.isError, false);
    assert.match(res.text, /createRoot/);
    // A section read must not drag in the rest of the upgrade guide.
    assert.doesNotMatch(res.text, /New deprecations/);
  } finally {
    await client.close();
  }
});

test("a missing section returns the outline rather than the whole page", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("read_frontend_docs", {
      path: "react/upgrade-react-19",
      section: "No Such Heading Here",
    });
    assert.equal(res.isError, false);
    assert.match(res.text, /was not found/);
    assert.match(res.text, /Available headings/);
  } finally {
    await client.close();
  }
});

test("an unknown page path suggests alternatives", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("read_frontend_docs", { path: "react/not-a-real-page-xyz" });
    assert.equal(res.isError, true);
    assert.match(res.text, /No such documentation page/);
  } finally {
    await client.close();
  }
});

// ─── check_api ───────────────────────────────────────────────────────────────

test("check_api reports lifecycle status", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("check_api", { name: "render", package: "react-dom" });
    assert.equal(res.isError, false);
    assert.match(res.text, /REMOVED/);
    assert.match(res.text, /createRoot/);
  } finally {
    await client.close();
  }
});

test("check_api answers for the version asked about, not just the end state", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const atEighteen = await client.call("check_api", {
      name: "render",
      package: "react-dom",
      version: "18.0.0",
    });
    // In React 18 `render` still exists; reporting it as removed would send an
    // agent to rewrite working code.
    assert.match(atEighteen.text, /\[DEPRECATED\]/);
    assert.match(atEighteen.text, /still present in 18\.0\.0/);

    const atNineteen = await client.call("check_api", {
      name: "render",
      package: "react-dom",
      version: "19.0.0",
    });
    assert.match(atNineteen.text, /\[REMOVED\]/);

    const unavailable = await client.call("check_api", {
      name: "useActionState",
      version: "18.2.0",
    });
    assert.match(unavailable.text, /Not available in 18\.2\.0/);
  } finally {
    await client.close();
  }
});

// ─── migration_guide and best practices ──────────────────────────────────────

test("migration_guide returns migration instructions", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("migration_guide", { framework: "tailwind", from: "3", to: "4" });
    assert.equal(res.isError, false);
    assert.match(res.text, /Migrating from Tailwind CSS v3 to v4/);
    assert.match(res.text, /@import "tailwindcss"/);
  } finally {
    await client.close();
  }
});

test("best practices answers offline and honours the framework filter", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("frontend_best_practices", { framework: "react" });
    assert.equal(res.isError, false);
    assert.match(res.text, /useActionState/);
  } finally {
    await client.close();
  }
});

// ─── CLI and configuration ───────────────────────────────────────────────────

test("the CLI reports its version and help", () => {
  assert.equal(cli("--version").trim(), VERSION);

  const help = cli("--help");
  assert.match(help, new RegExp(NAME));
  assert.match(help, /--timeout/);
  assert.match(help, /--project-dir/);
});

test("a CLI flag overrides the environment", async () => {
  const client = await startServer({
    cwd: ROOT,
    args: ["--max-results", "2"],
    env: { SEARCH_MAX_RESULTS: "9" },
  });
  try {
    const res = await client.call("search_frontend_docs", { query: "use" });
    assert.equal(res.isError, false);
    assert.match(res.text, /Found 2 relevant page\(s\)/);
  } finally {
    await client.close();
  }
});

test("invalid arguments are rejected by schema validation", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    // maxResults is capped at 20 by the schema.
    const response = await client.callRaw("search_frontend_docs", {
      query: "react",
      maxResults: 999,
    });
    const failed = Boolean(response.error) || Boolean(response.result?.isError);
    assert.ok(failed, "an out-of-range argument must be rejected");

    const badFramework = await client.callRaw("list_frontend_docs", { framework: "svelte" });
    const rejected = Boolean(badFramework.error) || Boolean(badFramework.result?.isError);
    assert.ok(rejected, "an unknown framework must be rejected");
  } finally {
    await client.close();
  }
});
