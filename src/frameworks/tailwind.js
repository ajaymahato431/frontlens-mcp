/**
 * Tailwind CSS index adapter.
 *
 * tailwindcss.com publishes no sitemap and serves no markdown, so the index comes
 * from the documentation directory in its own repository. That is one git-tree
 * request per index TTL — cheap enough to stay inside the anonymous rate limit,
 * and raised further by GITHUB_TOKEN when one is set.
 *
 * The slugs cannot be guessed: `dark-mode.mdx` is a file while `installation` is
 * a directory, so entries are only ever derived from the listing itself.
 */

import { collapseBlankLines, stripHtmlComments } from "../core/markdown.js";
import { fetchRepoTree, titleFromSlug } from "./sources.js";

export const FRAMEWORK = "tailwind";

const OWNER = "tailwindlabs";
const REPO = "tailwindcss.com";
const REF = "main";
const DOCS_DIR = "src/docs/";
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${REF}`;

/**
 * The handful of pages that are prose rather than a utility reference. Everything
 * else in this directory documents one utility family, so "Utilities" is the
 * accurate default rather than a shrug.
 */
const GUIDE_CATEGORIES = new Map([
  ["adding-custom-styles", "Core Concepts"],
  ["colors", "Core Concepts"],
  ["compatibility", "Getting Started"],
  ["dark-mode", "Core Concepts"],
  ["detecting-classes-in-source-files", "Core Concepts"],
  ["editor-setup", "Getting Started"],
  ["functions-and-directives", "Core Concepts"],
  ["hover-focus-and-other-states", "Core Concepts"],
  ["preflight", "Core Concepts"],
  ["responsive-design", "Core Concepts"],
  ["styling-with-utility-classes", "Core Concepts"],
  ["theme", "Core Concepts"],
  ["upgrade-guide", "Getting Started"],
]);

export async function fetchIndex(http, { ttl } = {}) {
  const paths = await fetchRepoTree(http, { owner: OWNER, repo: REPO, ref: REF, ttl });

  const entries = [];

  for (const filePath of paths) {
    if (!filePath.startsWith(DOCS_DIR) || !filePath.endsWith(".mdx")) continue;

    const slug = filePath.slice(DOCS_DIR.length, -".mdx".length);
    // Nested files under `src/docs/` are images, not pages.
    if (slug.includes("/")) continue;

    entries.push({
      framework: FRAMEWORK,
      path: `tailwind/${slug}`,
      title: titleFromSlug(slug),
      category: GUIDE_CATEGORIES.get(slug) ?? "Utilities",
      sources: [`${RAW}/${filePath}`],
    });
  }

  return entries;
}

export function cleanPage(text) {
  let out = stripHtmlComments(String(text));
  out = out.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");

  // The docs are MDX built from site components; the import block and the
  // rendered-example wrappers are build machinery, not documentation.
  out = out.replace(/^import\s+[\s\S]*?;\s*$/gm, "");
  out = out.replace(/^export\s+const\s+[\s\S]*?;\s*$/gm, "");
  out = out.replace(/<Figure>[\s\S]*?<\/Figure>/g, "");
  out = out.replace(/<Example>[\s\S]*?<\/Example>/g, "");

  return collapseBlankLines(out).trim();
}
