/**
 * Unit tests for FrontLens domain logic (detector, API registry, migrations,
 * best practices, documentation index). Offline — safe to run in CI.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { detectProject, formatProjectReport } from "../src/detector.js";
import { queryApi, formatApiReport, API_ENTRIES } from "../src/api-registry.js";
import { resolveMigration, formatMigrationReport, MIGRATIONS } from "../src/migrations.js";
import { filterBestPractices, renderBestPractices, ALL_TOPICS } from "../src/best-practices.js";
import {
  DOCS_ENTRIES,
  searchFrontendDocs,
  resolveDocEntry,
  readDocContent,
} from "../src/docs-index.js";

// ─── detector ────────────────────────────────────────────────────────────────

test("detectProject identifies packages, versions, and config files in a mock project", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "frontlens-test-"));
  try {
    const pkg = {
      name: "my-test-app",
      dependencies: {
        react: "^19.2.0",
        "react-dom": "^19.2.0",
        tailwindcss: "^4.0.0",
      },
      devDependencies: {
        vite: "^6.0.0",
        typescript: "^5.7.0",
      },
    };
    writeFileSync(join(tempDir, "package.json"), JSON.stringify(pkg, null, 2));
    writeFileSync(join(tempDir, "vite.config.ts"), "export default {}");
    mkdirSync(join(tempDir, "src"));
    writeFileSync(join(tempDir, "src", "index.css"), '@import "tailwindcss";\n');

    const result = detectProject(tempDir);
    assert.equal(result.found, true);
    assert.equal(result.name, "my-test-app");
    assert.equal(result.framework, "React");
    assert.equal(result.metaFramework, "Vite");
    assert.ok(result.packages["react"]);
    assert.ok(result.packages["tailwindcss"]);
    assert.equal(result.configs.vite, "vite.config.ts");
    assert.equal(result.tailwind.isV4, true);

    const report = formatProjectReport(result);
    assert.match(report, /FrontLens Project Context/);
    assert.match(report, /react.*19\.2\.0/);
    assert.match(report, /Actionable Intelligence/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("detectProject detects Next.js App Router", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "frontlens-next-"));
  try {
    const pkg = {
      name: "my-next-app",
      dependencies: {
        next: "^15.1.0",
        react: "^19.0.0",
      },
    };
    writeFileSync(join(tempDir, "package.json"), JSON.stringify(pkg));
    mkdirSync(join(tempDir, "app"));
    writeFileSync(join(tempDir, "app", "page.tsx"), "export default function Page() {}");

    const result = detectProject(tempDir);
    assert.equal(result.found, true);
    assert.equal(result.metaFramework, "Next.js");
    assert.equal(result.next.hasAppRouter, true);
    assert.equal(result.next.primaryRouter, "App Router");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

// ─── api-registry ────────────────────────────────────────────────────────────

test("queryApi finds deprecated and removed React APIs", () => {
  const renderMatches = queryApi({ name: "render", package: "react-dom" });
  assert.ok(renderMatches.length > 0);
  const render = renderMatches[0];
  assert.equal(render.symbol, "render");
  assert.equal(render.status, "removed");
  assert.equal(render.replacement, "createRoot");

  const report = formatApiReport(renderMatches, { name: "render", package: "react-dom" });
  assert.match(report, /REMOVED/);
  assert.match(report, /createRoot/);
  assert.match(report, /react-dom\/client/);
});

test("queryApi returns new React 19 hooks", () => {
  const actionState = queryApi({ name: "useActionState" });
  assert.ok(actionState.length > 0);
  assert.equal(actionState[0].status, "new");
  assert.match(actionState[0].description, /form actions/);
});

test("queryApi checks Next.js async cookies and headers", () => {
  const cookies = queryApi({ name: "cookies", package: "next" });
  assert.ok(cookies.length > 0);
  assert.match(cookies[0].description, /Promise/);
});

test("queryApi checks Tailwind v4 @theme and @tailwind removal", () => {
  const tailwindDirective = queryApi({ name: "@tailwind" });
  assert.ok(tailwindDirective.length > 0);
  assert.equal(tailwindDirective[0].status, "removed");

  const themeDirective = queryApi({ name: "@theme" });
  assert.ok(themeDirective.length > 0);
  assert.equal(themeDirective[0].status, "new");
});

// ─── migrations ──────────────────────────────────────────────────────────────

test("resolveMigration returns Tailwind 3 to 4 guide with codemod", () => {
  const mig = resolveMigration({ framework: "tailwind", from: "3", to: "4" });
  assert.ok(mig);
  assert.equal(mig.framework, "tailwind");
  assert.match(mig.codemod, /@tailwindcss\/upgrade/);
  assert.ok(mig.steps.length >= 3);

  const report = formatMigrationReport(mig);
  assert.match(report, /Migrating from Tailwind CSS v3 to v4/);
  assert.match(report, /@import "tailwindcss"/);
});

test("resolveMigration returns React 18 to 19 guide", () => {
  const mig = resolveMigration({ framework: "react", from: "18", to: "19" });
  assert.ok(mig);
  assert.equal(mig.framework, "react");

  const report = formatMigrationReport(mig);
  assert.match(report, /React 19/);
  assert.match(report, /createRoot/);
  assert.match(report, /ref.*prop/i);
});

test("resolveMigration returns Next.js 14 to 15 guide", () => {
  const mig = resolveMigration({ framework: "nextjs", from: "14", to: "15" });
  assert.ok(mig);
  assert.equal(mig.framework, "nextjs");

  const report = formatMigrationReport(mig);
  assert.match(report, /Next\.js 15/);
  assert.match(report, /cookies\(\)/);
});

// ─── best-practices ──────────────────────────────────────────────────────────

test("filterBestPractices retrieves topics by framework and topic keyword", () => {
  assert.ok(ALL_TOPICS.length >= 5);

  const reactPractices = filterBestPractices({ framework: "react" });
  assert.ok(reactPractices.length > 0);
  assert.ok(reactPractices.every((p) => p.framework === "react"));

  const actions = filterBestPractices({ topic: "react-actions" });
  assert.equal(actions.length, 1);
  assert.equal(actions[0].framework, "react");

  const rendered = renderBestPractices(actions);
  assert.match(rendered, /useActionState/);
  assert.match(rendered, /useFormStatus/);
});

// ─── docs-index ──────────────────────────────────────────────────────────────

test("searchFrontendDocs finds relevant documentation pages", () => {
  const results = searchFrontendDocs("useActionState");
  assert.ok(results.length > 0);
  assert.equal(results[0].framework, "react");

  const tailwindResults = searchFrontendDocs("vite", { framework: "tailwind" });
  assert.ok(tailwindResults.length > 0);
  assert.equal(tailwindResults[0].path, "tailwind/installation-vite");
});

test("resolveDocEntry locates docs by full or partial path", () => {
  const exact = resolveDocEntry("react/upgrade-react-19");
  assert.ok(exact);
  assert.equal(exact.framework, "react");

  const partial = resolveDocEntry("upgrade-react-19");
  assert.ok(partial);
  assert.equal(partial.path, "react/upgrade-react-19");
});

test("readDocContent handles outline and section extraction", async () => {
  const entry = resolveDocEntry("react/upgrade-react-19");
  assert.ok(entry);

  const outline = await readDocContent(entry, { outline: true });
  assert.match(outline.output, /Outline — React 19/);
  assert.match(outline.output, /Removed Legacy APIs/);
  assert.match(outline.output, /tokens/);

  const section = await readDocContent(entry, { section: "Removed Legacy APIs" });
  assert.match(section.output, /ReactDOM\.render/);
  assert.match(section.output, /createRoot/);
  assert.doesNotMatch(section.output, /React Compiler/);
  assert.match(section.output, /tokens/);
});

// ─── edge cases ──────────────────────────────────────────────────────────────

test("detectProject returns found=false when no package.json exists", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "frontlens-empty-"));
  try {
    const result = detectProject(tempDir);
    assert.equal(result.found, false);
    assert.match(result.message, /No package\.json/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("queryApi returns empty array for unknown symbols", () => {
  const matches = queryApi({ name: "totallyUnknownSymbol12345" });
  assert.equal(matches.length, 0);

  const report = formatApiReport(matches, { name: "totallyUnknownSymbol12345" });
  assert.match(report, /No known deprecations/);
  assert.match(report, /Tip/);
});

test("queryApi ranks exact matches above partial matches", () => {
  const matches = queryApi({ name: "use" });
  // "use" should be exact match for the `use` API, not just partial matches
  assert.ok(matches.length > 0);
  assert.equal(matches[0].symbol, "use");
});

test("formatMigrationReport handles null migration gracefully", () => {
  const report = formatMigrationReport(null);
  assert.match(report, /Migration Guide Not Found/);
  assert.match(report, /Available migration guides/);
});

test("resolveMigration returns latest migration when no from/to given", () => {
  const mig = resolveMigration({ framework: "nextjs" });
  assert.ok(mig);
  // Should return the latest Next.js migration (15→16)
  assert.equal(mig.to, "16");
});

test("filterBestPractices with 'all' returns all entries", () => {
  const all = filterBestPractices({ framework: "all" });
  assert.ok(all.length >= 10, "should return all best practice entries");
});

test("renderBestPractices returns helpful message when no topics match", () => {
  const rendered = renderBestPractices([]);
  assert.match(rendered, /No topics matched/);
  assert.match(rendered, /Available topics/);
});

test("readDocContent with nonexistent section shows available headings", async () => {
  const entry = resolveDocEntry("react/upgrade-react-19");
  assert.ok(entry);

  const result = await readDocContent(entry, { section: "Nonexistent Section XYZ" });
  assert.match(result.output, /was not found/);
  assert.match(result.output, /Available headings/);
});

test("searchFrontendDocs returns empty for impossible framework filter", () => {
  const results = searchFrontendDocs("useActionState", { framework: "unknown-fw" });
  assert.equal(results.length, 0);
});

test("resolveMigration resolves new Vite 5 to 6 migration", () => {
  const mig = resolveMigration({ framework: "vite", from: "5", to: "6" });
  assert.ok(mig);
  assert.equal(mig.framework, "vite");
  assert.match(mig.title, /Vite 5/);
  assert.ok(mig.breakingChanges.length > 0);
});

test("resolveMigration resolves new TypeScript migration", () => {
  const mig = resolveMigration({ framework: "typescript" });
  assert.ok(mig);
  assert.equal(mig.framework, "typescript");
});

test("detectProject reports package manager and config files", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "frontlens-pm-"));
  try {
    const pkg = {
      name: "pm-test",
      dependencies: { react: "^19.0.0" },
    };
    writeFileSync(join(tempDir, "package.json"), JSON.stringify(pkg));
    writeFileSync(join(tempDir, "package-lock.json"), "{}");
    writeFileSync(join(tempDir, "tsconfig.json"), "{}");

    const result = detectProject(tempDir);
    assert.equal(result.found, true);
    assert.equal(result.packageManager, "npm");
    assert.equal(result.configs.typescript, "tsconfig.json");

    const report = formatProjectReport(result);
    assert.match(report, /Package Manager: npm/);
    assert.match(report, /Configuration Files/);
    assert.match(report, /tsconfig\.json/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
