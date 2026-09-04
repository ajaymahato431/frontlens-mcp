/**
 * Vite index adapter.
 *
 * vite.dev's sitemap lists the site, and the VitePress sources behind it live at
 * the matching path under `docs/` in the Vite repository, so the sitemap gives
 * the index and raw.githubusercontent gives the content. Neither is rate limited.
 */

import { collapseBlankLines, stripHtmlComments } from "../core/markdown.js";
import { parseSitemap, titleFromSlug } from "./sources.js";

export const FRAMEWORK = "vite";

const SITEMAP = "https://vite.dev/sitemap.xml";
const ORIGIN = "https://vite.dev/";
const RAW = "https://raw.githubusercontent.com/vitejs/vite/main/docs";

/**
 * Sections that exist as markdown under `docs/`. The sitemap also lists the blog,
 * the team page and the release feed, which are either generated or not
 * documentation, and would 404 against the repository.
 */
const DOC_SECTIONS = new Set(["guide", "config", "changes"]);

const CATEGORIES = {
  guide: "Guide",
  config: "Config",
  changes: "Breaking Changes",
};

export async function fetchIndex(http, { ttl } = {}) {
  const sitemap = await http.fetchText(SITEMAP, { ttl });

  const entries = [];
  const seen = new Set();

  for (const location of parseSitemap(sitemap)) {
    if (!location.startsWith(ORIGIN)) continue;

    const slug = location.slice(ORIGIN.length).replace(/\/+$/, "");
    if (!slug) continue;

    const section = slug.split("/")[0];
    if (!DOC_SECTIONS.has(section)) continue;

    const path = `vite/${slug}`;
    if (seen.has(path)) continue;
    seen.add(path);

    // A bare section URL such as `vite.dev/config` is served from `config/index.md`.
    const file = slug === section ? `${section}/index` : slug;

    entries.push({
      framework: FRAMEWORK,
      path,
      title: titleFromSlug(slug.split("/").pop()),
      category: CATEGORIES[section] ?? titleFromSlug(section),
      sources: [`${RAW}/${file}.md`],
    });
  }

  return entries;
}

export function cleanPage(text) {
  let out = stripHtmlComments(String(text));
  out = out.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");

  // VitePress containers (`::: tip`, `:::`) are markers around prose worth keeping.
  out = out.replace(/^:::+\s*(?:tip|warning|danger|info|details)?\s*(.*)$/gim, (_, rest) =>
    rest ? `> ${rest}` : ""
  );
  out = out.replace(/<audio[\s\S]*?<\/audio>/g, "");

  return collapseBlankLines(out).trim();
}
