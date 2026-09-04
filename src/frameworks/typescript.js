/**
 * TypeScript index adapter.
 *
 * The handbook lives as plain markdown in the TypeScript website repository, on
 * the long-lived `v2` branch. Like Tailwind, the index costs one git-tree request
 * per index TTL.
 *
 * Source filenames are human titles rather than slugs — "Do's and Don'ts.md",
 * "TS for JS Programmers.md" — so the readable name becomes the title and a
 * slugified form becomes the path an agent can type.
 */

import { collapseBlankLines, stripHtmlComments } from "../core/markdown.js";
import { fetchRepoTree, titleFromSlug } from "./sources.js";

export const FRAMEWORK = "typescript";

const OWNER = "microsoft";
const REPO = "TypeScript-Website";
const REF = "v2";
const DOCS_DIR = "packages/documentation/copy/en/";
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${REF}`;

const CATEGORIES = {
  "declaration-files": "Declaration Files",
  "get-started": "Get Started",
  "handbook-v1": "Handbook (v1)",
  "handbook-v2": "Handbook",
  javascript: "JavaScript",
  "modules-reference": "Modules Reference",
  "project-config": "Project Configuration",
  reference: "Reference",
  "release-notes": "Release Notes",
  tutorials: "Tutorials",
};

/** "Do's and Don'ts" -> "dos-and-donts", so the path survives a command line. */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function fetchIndex(http, { ttl } = {}) {
  const paths = await fetchRepoTree(http, { owner: OWNER, repo: REPO, ref: REF, ttl });

  const entries = [];
  const seen = new Set();

  for (const filePath of paths) {
    if (!filePath.startsWith(DOCS_DIR) || !filePath.endsWith(".md")) continue;

    const relative = filePath.slice(DOCS_DIR.length, -".md".length);
    const segments = relative.split("/");
    const name = segments.pop();
    const section = segments[0] ?? "";

    const slug = [...segments.map(slugify), slugify(name)].filter(Boolean).join("/");
    const path = `typescript/${slug}`;
    if (seen.has(path)) continue;
    seen.add(path);

    entries.push({
      framework: FRAMEWORK,
      path,
      title: name,
      category: CATEGORIES[section] ?? (section ? titleFromSlug(section) : "Overview"),
      // Filenames contain spaces and apostrophes, so the URL must be encoded.
      sources: [`${RAW}/${filePath.split("/").map(encodeURIComponent).join("/")}`],
    });
  }

  return entries;
}

export function cleanPage(text) {
  let out = stripHtmlComments(String(text));
  out = out.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");

  // The site renders `//cut` as a fold marker inside sample code.
  out = out.replace(/^\/\/\s*cut\s*$/gm, "");

  return collapseBlankLines(out).trim();
}
