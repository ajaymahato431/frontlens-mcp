/**
 * Next.js index adapter.
 *
 * nextjs.org serves a plain-markdown version of every documentation page from
 * the page's own URL with `.md` appended, so this adapter needs no GitHub access
 * at all: the sitemap supplies the index and the site supplies the content. That
 * also sidesteps the numeric ordering prefixes (`01-app/01-getting-started`) the
 * repository uses, which cannot be derived from a public URL.
 */

import { collapseBlankLines, stripHtmlComments } from "../core/markdown.js";
import { parseSitemap, titleFromSlug } from "./sources.js";

export const FRAMEWORK = "nextjs";

const SITEMAP = "https://nextjs.org/sitemap.xml";
const DOCS_PREFIX = "https://nextjs.org/docs/";

/** The site's own top-level split, named the way the docs name it. */
const CATEGORIES = {
  app: "App Router",
  pages: "Pages Router",
  messages: "Error Messages",
  architecture: "Architecture",
  community: "Community",
};

export async function fetchIndex(http, { ttl } = {}) {
  const sitemap = await http.fetchText(SITEMAP, { ttl });

  const entries = [];
  const seen = new Set();

  for (const location of parseSitemap(sitemap)) {
    if (!location.startsWith(DOCS_PREFIX)) continue;

    const slug = location.slice(DOCS_PREFIX.length).replace(/\/+$/, "");
    if (!slug) continue;

    const path = `nextjs/${slug}`;
    if (seen.has(path)) continue;
    seen.add(path);

    const section = slug.split("/")[0];

    entries.push({
      framework: FRAMEWORK,
      path,
      // The sitemap carries no titles, so the last slug segment is the best
      // available name. read_frontend_docs replaces it with the page's own
      // frontmatter title once the page is actually fetched.
      title: titleFromSlug(slug.split("/").pop()),
      category: CATEGORIES[section] ?? titleFromSlug(section),
      sources: [`${location.replace(/\/+$/, "")}.md`],
    });
  }

  return entries;
}

export function cleanPage(text) {
  let out = stripHtmlComments(String(text));
  out = out.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");

  // `<AppOnly>` / `<PagesOnly>` mark which router a passage applies to. The
  // surrounding prose matters, the tags do not.
  out = out.replace(/<\/?(?:AppOnly|PagesOnly|Check|Cross|Image|Subtitle)[^>]*>/g, "");

  return collapseBlankLines(out).trim();
}
