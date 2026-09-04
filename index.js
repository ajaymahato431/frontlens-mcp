#!/usr/bin/env node
/**
 * frontlens-mcp — Model Context Protocol server for version-aware
 * frontend engineering intelligence (React, Next.js, Vite, Tailwind CSS, TypeScript).
 *
 * Serves project context detection, API lifecycle checks, migration recipes,
 * best practices, and documentation search to AI coding agents over stdio.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { bootstrap } from "./src/core/config.js";
import { createHttpClient } from "./src/core/http.js";
import { runMain, serveStdio, textResult, errorResult, safeHandler } from "./src/core/runtime.js";
import { NAME, VERSION, SCHEMA } from "./src/settings.js";
import { detectProject, formatProjectReport } from "./src/detector.js";
import { queryApi, formatApiReport } from "./src/api-registry.js";
import { resolveMigration, formatMigrationReport } from "./src/migrations.js";
import { filterBestPractices, renderBestPractices, ALL_TOPICS } from "./src/best-practices.js";
import { FRAMEWORKS } from "./src/frameworks/index.js";
import {
  loadDocsIndex,
  searchFrontendDocs,
  resolveDocEntry,
  readDocContent,
  groupByFramework,
  groupByCategory,
  suggestPaths,
} from "./src/docs-index.js";

const { config } = bootstrap({
  name: NAME,
  version: VERSION,
  description: "Version-aware frontend engineering intelligence for AI coding agents.",
  schema: SCHEMA,
  importMetaUrl: import.meta.url,
  examples: [
    `${NAME} --project-dir ./my-app`,
    `${NAME} --timeout 30000`,
  ],
});

const http = createHttpClient({
  userAgent: `${NAME}/${VERSION} (+https://github.com/ajaymahato431/frontlens-mcp)`,
  timeoutMs: config.requestTimeoutMs,
  retries: config.retries,
  cacheMax: config.cacheMax,
  defaultTtl: config.docTtlMs,
  indexTtl: config.indexTtlMs,
  negativeTtl: config.negativeTtlMs,
  headers: config.githubToken ? { authorization: `Bearer ${config.githubToken}` } : {},
});

/**
 * Loads the merged documentation catalogue.
 *
 * The five upstream indexes are fetched in parallel and cached for `index-ttl`,
 * so this is one burst of requests every few hours rather than per tool call.
 * A framework that cannot be reached falls back to its bundled snapshot instead
 * of failing the call, and says so through `degraded`.
 */
async function loadCatalogue() {
  return loadDocsIndex({ http, ttl: config.indexTtlMs });
}

/** A one-line warning when part of the catalogue is being served from a snapshot. */
function stalenessNote(degraded) {
  if (!degraded?.length) return "";
  const names = degraded.map((d) => `${d.framework} (${d.reason})`).join("; ");
  return `

> [!NOTE]
> Served from the bundled snapshot for: ${names}`;
}

const server = new McpServer({ name: NAME, version: VERSION }, { capabilities: { tools: {} } });

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: true };
const NETWORK_HINT = "Check network connectivity to github.com / official doc sites, then try again.";
const FRAMEWORK_FILTER = ["all", ...FRAMEWORKS];

// ─── 1. frontend_context ─────────────────────────────────────────────────────

server.registerTool(
  "frontend_context",
  {
    title: "Inspect frontend project context and installed versions",
    description:
      "Deeply inspects the current project or a specified directory to detect installed frontend " +
      "frameworks (React, Next.js, Vite, Tailwind CSS, TypeScript), resolved lockfile/node_modules " +
      "versions, configuration files, App Router vs Pages Router architecture, and version advisories.",
    inputSchema: {
      projectPath: z
        .string()
        .optional()
        .describe("Path to project root or subfolder. Defaults to configured project-dir or current working directory."),
    },
    annotations: READ_ONLY,
  },
  safeHandler(async ({ projectPath }) => {
    const targetDir = projectPath || config.projectDir || process.cwd();
    const result = detectProject(targetDir);
    return textResult(formatProjectReport(result));
  })
);

// ─── 2. list_frontend_docs ───────────────────────────────────────────────────

server.registerTool(
  "list_frontend_docs",
  {
    title: "Browse the frontend documentation index",
    description:
      "Browses the documentation index across React, Next.js, Vite, Tailwind CSS and TypeScript. " +
      "Called with no arguments it returns a per-framework summary (~60 tokens) — start here. " +
      "Pass `framework` to list its categories, and `category` to list that category's pages.",
    inputSchema: {
      framework: z
        .enum(FRAMEWORKS)
        .optional()
        .describe("Framework to drill into. Omit for the cross-framework summary."),
      category: z
        .string()
        .optional()
        .describe('Category within a framework, e.g. "Hooks", "App Router", "Utilities".'),
      limit: z.number().int().positive().max(500).optional().describe("Maximum pages to return."),
      offset: z.number().int().min(0).optional().describe("Pages to skip, for paging."),
    },
    annotations: READ_ONLY,
  },
  safeHandler(async ({ framework, category, limit, offset = 0 }) => {
    const { entries, degraded } = await loadCatalogue();
    const note = stalenessNote(degraded);

    if (!framework) {
      const rows = groupByFramework(entries)
        .map((g) => `  ${g.framework} — ${g.count} pages`)
        .join("\n");
      return textResult(
        `# FrontLens documentation index\n` +
          `${entries.length} pages across ${FRAMEWORKS.length} frameworks.\n\n${rows}\n\n` +
          `Next: call again with a framework, or use search_frontend_docs to find a page.${note}`
      );
    }

    const inFramework = entries.filter((e) => e.framework === framework);

    if (!category) {
      const rows = groupByCategory(inFramework)
        .map((g) => `  ${g.category} — ${g.count} pages`)
        .join("\n");
      return textResult(
        `# ${framework} — ${inFramework.length} pages\n\n${rows}\n\n` +
          `Next: call again with a category to list its pages.${note}`
      );
    }

    const wanted = String(category).toLowerCase();
    const selected = inFramework.filter((e) => (e.category || "").toLowerCase() === wanted);

    if (selected.length === 0) {
      const available = groupByCategory(inFramework)
        .map((g) => g.category)
        .join(", ");
      return errorResult(
        `No category "${category}" in ${framework}.\nAvailable categories: ${available}`
      );
    }

    const page = selected.slice(offset, offset + (limit ?? selected.length));
    const more =
      offset + page.length < selected.length
        ? `\n\nMore available: call again with offset ${offset + page.length}.`
        : "";

    return textResult(
      `# ${framework} — ${category}\n` +
        `Showing ${page.length} of ${selected.length}\n\n` +
        `${page.map((e) => `${e.path} — ${e.title}`).join("\n")}${more}${note}`
    );
  }, NETWORK_HINT)
);
// ─── 3. search_frontend_docs ─────────────────────────────────────────────────

server.registerTool(
  "search_frontend_docs",
  {
    title: "Search frontend documentation across modern frameworks",
    description:
      "Searches the official documentation of React, Next.js, Vite, Tailwind CSS and TypeScript. " +
      "Returns ranked pages with their framework, category and path. Use it to answer " +
      '"where is X documented?", then read the page with read_frontend_docs.',
    inputSchema: {
      query: z.string().min(1).describe("Search keywords, e.g. 'useActionState', 'dark mode', 'tsconfig bundler'."),
      framework: z
        .enum(FRAMEWORK_FILTER)
        .optional()
        .describe("Filter search to a specific framework. Defaults to 'all'."),
      maxResults: z.number().int().positive().max(20).optional().describe("Maximum results to return. Default 5."),
      includeContent: z
        .boolean()
        .optional()
        .describe("If true, also returns the full content of the top result. Default false."),
    },
    annotations: READ_ONLY,
  },
  safeHandler(async ({ query, framework = "all", maxResults, includeContent = false }) => {
    const { entries, degraded } = await loadCatalogue();
    const limit = maxResults ?? config.maxResults;
    const results = searchFrontendDocs(entries, query, { framework, limit });
    const note = stalenessNote(degraded);

    if (results.length === 0) {
      return textResult(
        `# FrontLens Search: "${query}"\n\n` +
          `Nothing matched "${query}"${framework === "all" ? "" : ` in ${framework}`}.\n\n` +
          `Try a broader term or drop the framework filter. ` +
          `Browse what exists with list_frontend_docs.${note}`
      );
    }

    if (includeContent) {
      const top = results[0];
      const doc = await readDocContent(top, { http, ttl: config.docTtlMs });
      return textResult(
        `# Top match for "${query}": ${top.title} (${top.framework})\n` +
          `Path: \`${top.path}\`\n\n${doc.output}${note}`
      );
    }

    const items = results.map(
      (r) =>
        `- **[${r.framework.toUpperCase()}] ${r.title}**\n` +
        `  Path: \`${r.path}\` (Category: ${r.category})` +
        (r.summary ? `\n  ${r.summary}` : "")
    );

    return textResult(
      `# FrontLens Documentation Search: "${query}"\n` +
        `Found ${results.length} relevant page(s):\n\n` +
        `${items.join("\n\n")}\n\n` +
        `Next: read one with read_frontend_docs, passing \`section\` or \`outline\` to save tokens.${note}`
    );
  }, NETWORK_HINT)
);

// ─── 4. read_frontend_docs ───────────────────────────────────────────────────

server.registerTool(
  "read_frontend_docs",
  {
    title: "Read a frontend documentation page or section",
    description:
      "Reads one documentation page from its official source. Pass `section` to extract a single " +
      "heading, or `outline` to see the headings first — both cut the token cost sharply. " +
      "Discover paths with search_frontend_docs or list_frontend_docs.",
    inputSchema: {
      path: z
        .string()
        .min(1)
        .describe("Documentation path, e.g. 'react/reference/react/useActionState', 'tailwind/dark-mode'."),
      section: z.string().optional().describe("Heading to extract (e.g. 'Parameters'). Substantially reduces tokens."),
      outline: z.boolean().optional().describe("If true, returns only the headings outline to help pick a section."),
    },
    annotations: READ_ONLY,
  },
  safeHandler(async ({ path, section, outline }) => {
    const { entries } = await loadCatalogue();
    const entry = resolveDocEntry(entries, path);

    if (!entry) {
      const near = suggestPaths(entries, path);
      const suggestion = near.length
        ? `\n\nDid you mean:\n${near.map((e) => `  ${e.path} — ${e.title}`).join("\n")}`
        : "\n\nUse search_frontend_docs or list_frontend_docs to find a valid path.";
      return errorResult(`No such documentation page: "${path}".${suggestion}`);
    }

    const read = await readDocContent(entry, { section, outline, http, ttl: config.docTtlMs });
    return textResult(read.output);
  }, NETWORK_HINT)
);

// ─── 5. check_api ────────────────────────────────────────────────────────────

server.registerTool(
  "check_api",
  {
    title: "Check API lifecycle status, deprecations, and modern replacements",
    description:
      "Checks whether a frontend API symbol is current, deprecated, or removed in React 18/19, " +
      "Next.js 14/15/16, Tailwind CSS v3/v4, Vite, or TypeScript, and provides the modern replacement code.",
    inputSchema: {
      name: z.string().min(1).describe("API name or symbol, e.g. 'render', 'useFormState', 'cookies', '@apply', 'useActionState'."),
      package: z
        .string()
        .optional()
        .describe("Package name filter, e.g. 'react', 'react-dom', 'next', 'tailwindcss', 'vite', 'typescript'."),
      version: z
        .string()
        .optional()
        .describe(
          "Target package version, e.g. '19.0.0', '15.0.0', '4.0.0'. Reports the symbol's status " +
            "as of that version — 'render' is deprecated in React 18 but removed in 19."
        ),
    },
    annotations: READ_ONLY,
  },
  safeHandler(async ({ name, package: pkg, version }) => {
    const matches = queryApi({ name, package: pkg, version });
    return textResult(formatApiReport(matches, { name, package: pkg, version }));
  })
);

// ─── 6. migration_guide ──────────────────────────────────────────────────────

server.registerTool(
  "migration_guide",
  {
    title: "Get step-by-step frontend framework migration guides",
    description:
      "Returns breaking change checklists, automated codemod commands, and before/after code " +
      "recipes for major frontend version upgrades (e.g. Tailwind 3 to 4, React 18 to 19, Next 14 to 15/16).",
    inputSchema: {
      framework: z
        .enum(["react", "tailwind", "nextjs", "vite", "typescript"])
        .describe("Target framework for the migration guide."),
      from: z.string().optional().describe("Source version, e.g. '3', '18', '14'."),
      to: z.string().optional().describe("Target version, e.g. '4', '19', '15', '16'."),
    },
    annotations: READ_ONLY,
  },
  safeHandler(async ({ framework, from, to }) => {
    const migration = resolveMigration({ framework, from, to });
    return textResult(formatMigrationReport(migration));
  })
);

// ─── 7. frontend_best_practices ──────────────────────────────────────────────

server.registerTool(
  "frontend_best_practices",
  {
    title: "Query authoritative frontend engineering best practices",
    description:
      "Provides curated, actionable best practices and anti-patterns with code examples for " +
      "React 19, Next.js App Router, Tailwind CSS v4, Vite, and TypeScript.",
    inputSchema: {
      framework: z
        .enum(["all", "react", "nextjs", "vite", "tailwind", "typescript"])
        .optional()
        .describe("Filter best practices by framework. Default is 'all'."),
      topic: z
        .string()
        .optional()
        .describe(`Specific topic or keyword, e.g. 'actions', 'effects', 'theme', 'server-components'. Available: ${ALL_TOPICS.join(", ")}.`),
    },
    annotations: READ_ONLY,
  },
  safeHandler(async ({ framework = "all", topic }) => {
    const entries = filterBestPractices({ framework, topic });
    return textResult(renderBestPractices(entries));
  })
);

// ─── Stdio Server Entry Point ────────────────────────────────────────────────

runMain(() => serveStdio(server, { name: NAME, version: VERSION }));
