/**
 * React index adapter.
 *
 * react.dev publishes the navigation that drives its own sidebar as JSON, which
 * makes it the same kind of source as Livewire's `__nav.md`: official titles,
 * official grouping, and no rate limit. Two files cover the whole site — the
 * tutorial half and the API reference half.
 */

import { collapseBlankLines, stripHtmlComments } from "../core/markdown.js";

export const FRAMEWORK = "react";

const RAW = "https://raw.githubusercontent.com/reactjs/react.dev/main/src";

const SIDEBARS = [
  { url: `${RAW}/sidebarLearn.json`, fallbackCategory: "Learn" },
  { url: `${RAW}/sidebarReference.json`, fallbackCategory: "API Reference" },
];

/**
 * Flattens a sidebar tree into entries.
 *
 * Nodes carry a `title` and a site `path`; parents name the group their children
 * belong to, so the parent title is carried down as the category. Section-header
 * nodes have no path of their own and contribute nothing but a heading.
 */
function flatten(node, category, out) {
  if (!node || typeof node !== "object") return;

  if (node.path && node.title) {
    out.push({ title: node.title, sitePath: node.path, category });
  }

  const childCategory = node.title || category;
  for (const child of node.routes ?? []) {
    flatten(child, childCategory, out);
  }
}

/**
 * Builds the content URLs for a site path.
 *
 * Section landing pages such as `/learn` live at `<path>/index.md` while ordinary
 * pages live at `<path>.md`, and the sidebar does not distinguish them. Both are
 * offered and the reader takes whichever responds.
 */
function sourcesFor(sitePath) {
  const clean = sitePath.replace(/^\/+/, "").replace(/\/+$/, "");
  return [`${RAW}/content/${clean}.md`, `${RAW}/content/${clean}/index.md`];
}

export async function fetchIndex(http, { ttl } = {}) {
  const entries = [];
  const seen = new Set();

  for (const { url, fallbackCategory } of SIDEBARS) {
    const sidebar = await http.fetchJson(url, { ttl });

    const flat = [];
    flatten(sidebar, fallbackCategory, flat);

    for (const item of flat) {
      const path = `react/${item.sitePath.replace(/^\/+/, "")}`;
      // The sidebar links a few pages twice — an "Overview" entry pointing at the
      // section it introduces, for instance. First listing wins.
      if (seen.has(path)) continue;
      seen.add(path);

      entries.push({
        framework: FRAMEWORK,
        path,
        title: item.title,
        category: item.category || fallbackCategory,
        sources: sourcesFor(item.sitePath),
      });
    }
  }

  return entries;
}

/** react.dev pages are MDX: strip the frontmatter and the site-only components. */
export function cleanPage(text) {
  let out = stripHtmlComments(String(text));
  out = out.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");

  // Sandpack blocks and illustrations are interactive site furniture that carry
  // no meaning once flattened to text.
  out = out.replace(/<Sandpack>[\s\S]*?<\/Sandpack>/g, "");
  out = out.replace(/<Illustration[^>]*\/>/g, "");
  out = out.replace(/<IllustrationBlock[\s\S]*?<\/IllustrationBlock>/g, "");

  // Headings carry an MDX anchor comment — "## Codemods {/*codemods*/}" — which is
  // pure site plumbing and would otherwise show up in every outline.
  out = out.replace(/\s*\{\/\*[^*]*\*\/\}/g, "");

  // The remaining MDX callouts are meaningful, so keep their text and drop the tag.
  out = out.replace(/<\/?(?:Note|Pitfall|DeepDive|Recap|Intro|YouWillLearn|Canary|Wip)>/g, "");

  return collapseBlankLines(out).trim();
}
