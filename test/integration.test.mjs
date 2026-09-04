/**
 * Integration tests for frontlens-mcp: spawns the server as a child process
 * over stdio, performs protocol negotiation, and tests all 6 tools.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { startServer, repoRoot } from "./helpers/client.mjs";
import { NAME, VERSION } from "../src/settings.js";

const ROOT = repoRoot(import.meta.url);

test("server starts over stdio, initializes, and registers all 6 tools", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    assert.equal(client.serverInfo?.name, NAME);
    assert.equal(client.serverInfo?.version, VERSION);

    const tools = await client.listTools();
    const toolNames = tools.map((t) => t.name);

    assert.ok(toolNames.includes("frontend_context"), "frontend_context must be registered");
    assert.ok(toolNames.includes("search_frontend_docs"), "search_frontend_docs must be registered");
    assert.ok(toolNames.includes("read_frontend_docs"), "read_frontend_docs must be registered");
    assert.ok(toolNames.includes("check_api"), "check_api must be registered");
    assert.ok(toolNames.includes("migration_guide"), "migration_guide must be registered");
    assert.ok(toolNames.includes("frontend_best_practices"), "frontend_best_practices must be registered");
    assert.equal(toolNames.length, 6, "expected exactly 6 registered tools");
  } finally {
    await client.close();
  }
});

test("tool: frontend_context runs and reports project details", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("frontend_context", {});
    assert.equal(res.isError, false);
    assert.match(res.text, /FrontLens Project Context/);
  } finally {
    await client.close();
  }
});

test("tool: search_frontend_docs finds pages", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("search_frontend_docs", { query: "useActionState" });
    assert.equal(res.isError, false);
    assert.match(res.text, /useActionState/);
    assert.match(res.text, /react\/hooks-use-action-state/);
  } finally {
    await client.close();
  }
});

test("tool: read_frontend_docs reads content, outline, and section", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    // 1. Outline
    const outlineRes = await client.call("read_frontend_docs", {
      path: "react/upgrade-react-19",
      outline: true,
    });
    assert.equal(outlineRes.isError, false);
    assert.match(outlineRes.text, /Outline — React 19/);

    // 2. Section
    const sectionRes = await client.call("read_frontend_docs", {
      path: "react/upgrade-react-19",
      section: "Removed Legacy APIs",
    });
    assert.equal(sectionRes.isError, false);
    assert.match(sectionRes.text, /createRoot/);
  } finally {
    await client.close();
  }
});

test("tool: check_api inspects API lifecycle", async () => {
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

test("tool: migration_guide returns migration instructions", async () => {
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

test("tool: frontend_best_practices returns curated rules", async () => {
  const client = await startServer({ cwd: ROOT });
  try {
    const res = await client.call("frontend_best_practices", { framework: "react" });
    assert.equal(res.isError, false);
    assert.match(res.text, /useActionState/);
  } finally {
    await client.close();
  }
});
