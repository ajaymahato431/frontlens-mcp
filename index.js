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
import {
  DOCS_ENTRIES,
  searchFrontendDocs,
  resolveDocEntry,
  readDocContent,
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

const server = new McpServer({ name: NAME, version: VERSION }, { capabilities: { tools: {} } });

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
const NETWORK_HINT = "Check network connectivity to github.com / official doc sites, then try again.";

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

// ─── 2. search_frontend_docs ─────────────────────────────────────────────────

server.registerTool(
  "search_frontend_docs",
  {
    title: "Search frontend documentation across modern frameworks",
    description:
      "Searches official documentation across React, Next.js, Vite, Tailwind CSS, and TypeScript. " +
      "Returns ranked documentation pages with categories, paths, and token-efficient summaries.",
    inputSchema: {
      query: z.string().min(1).describe("Search keywords, e.g. 'useActionState', 'tailwind v4 vite', 'cookies async'."),
      framework: z
        .enum(["all", "react", "nextjs", "vite", "tailwind", "typescript"])
        .optional()
        .describe("Filter search to a specific framework. Defaults to 'all'."),
      maxResults: z.number().int().positive().max(20).optional().describe("Maximum results to return. Default 5."),
      includeContent: z
        .boolean()
        .optional()
        .describe("If true, returns the full documentation content of the top result. Default false."),
    },
    annotations: READ_ONLY,
  },
  safeHandler(async ({ query, framework = "all", maxResults, includeContent = false }) => {
    const limit = maxResults ?? config.maxResults;
    const results = searchFrontendDocs(query, { framework, limit });

    if (results.length === 0) {
      return textResult(
        `# FrontLens Search: "${query}"\n\n` +
          `No documentation pages found for "${query}" (framework: ${framework}).\n\n` +
          `Tip: Try searching for a broader term or omission of framework filter.\n` +
          `Available frameworks: react, nextjs, vite, tailwind, typescript.`
      );
    }

    if (includeContent && results.length > 0) {
      const top = results[0];
      const doc = await readDocContent(top, { http });
      return textResult(
        `# Top Match: ${top.title} (${top.framework})\n` +
          `Path: \`${top.path}\`\n\n` +
          `${doc.output}`
      );
    }

    const items = results.map(
      (r) =>
        `- **[${r.framework.toUpperCase()}] ${r.title}**\n` +
        `  Path: \`${r.path}\` (Category: ${r.category})\n` +
        `  ${r.summary}`
    );

    return textResult(
      `# FrontLens Documentation Search: "${query}"\n` +
        `Found ${results.length} relevant page(s):\n\n` +
        `${items.join("\n\n")}\n\n` +
        `Next: Use read_frontend_docs with a path to read the complete page or a specific section.`
    );
  })
);

// ─── 3. read_frontend_docs ───────────────────────────────────────────────────

server.registerTool(
  "read_frontend_docs",
  {
    title: "Read a frontend documentation page or section",
    description:
      "Reads an authoritative documentation page. Pass `section` to extract only a single heading " +
      "to save tokens, or `outline` to view the page's headings. Paths can be discovered via search_frontend_docs.",
    inputSchema: {
      path: z.string().min(1).describe("Documentation path, e.g. 'react/upgrade-react-19', 'tailwind/installation-vite'."),
      section: z.string().optional().describe("Heading to extract (e.g. 'Removed Legacy APIs'). Substantially reduces tokens."),
      outline: z.boolean().optional().describe("If true, returns only the headings outline to help pick a section."),
    },
    annotations: READ_ONLY,
  },
  safeHandler(async ({ path, section, outline }) => {
    const entry = resolveDocEntry(path);
    if (!entry) {
      const available = DOCS_ENTRIES.map((e) => `  ${e.path} — ${e.title}`).join("\n");
      return errorResult(
        `No such documentation page: "${path}".\n\nAvailable documentation paths:\n${available}`
      );
    }

    const read = await readDocContent(entry, { section, outline, http });
    return textResult(read.output);
  }, NETWORK_HINT)
);

// ─── 4. check_api ────────────────────────────────────────────────────────────

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
      version: z.string().optional().describe("Target package version, e.g. '19.0.0', '15.0.0', '4.0.0'."),
    },
    annotations: READ_ONLY,
  },
  safeHandler(async ({ name, package: pkg, version }) => {
    const matches = queryApi({ name, package: pkg, version });
    return textResult(formatApiReport(matches, { name, package: pkg, version }));
  })
);

// ─── 5. migration_guide ──────────────────────────────────────────────────────

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

// ─── 6. frontend_best_practices ──────────────────────────────────────────────

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
