/**
 * Shared upstream-fetching helpers for the framework index adapters.
 *
 * Each adapter needs one of three things: a sitemap, a GitHub directory tree, or
 * a JSON navigation file. The first two are implemented here because three of
 * the five adapters share them, and getting the rate-limit and truncation
 * handling right once is worth more than five slightly different copies.
 */

/** Pulls every `<loc>` out of a sitemap. Namespaces and formatting vary; the tag does not. */
export function parseSitemap(xml) {
  const locations = [];
  const pattern = /<loc>\s*([^<\s]+)\s*<\/loc>/g;

  let match;
  while ((match = pattern.exec(String(xml))) !== null) {
    locations.push(match[1]);
  }

  return locations;
}

/**
 * Lists a GitHub repository's files through the git trees API.
 *
 * One request returns the whole tree, which is why this is affordable: the two
 * adapters that use it spend a single call per index TTL (6 hours by default),
 * far inside the 60-per-hour anonymous limit. `GITHUB_TOKEN` raises that limit
 * but is not required.
 *
 * Very large repositories come back with `truncated: true` and a partial tree.
 * That is reported rather than silently serving half an index.
 */
export async function fetchRepoTree(http, { owner, repo, ref, ttl }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
  const payload = await http.fetchJson(url, { ttl });

  if (!Array.isArray(payload?.tree)) {
    throw new Error(`Unexpected git tree response for ${owner}/${repo}@${ref}`);
  }

  if (payload.truncated) {
    throw new Error(
      `The git tree for ${owner}/${repo}@${ref} was truncated by GitHub, so the ` +
        `documentation index would be incomplete.`
    );
  }

  return payload.tree.filter((node) => node.type === "blob").map((node) => node.path);
}

/** Turns "getting-started/why-vite" into "Getting Started > Why Vite" style words. */
export function titleFromSlug(slug) {
  return String(slug)
    .split(/[/-]/)
    .filter(Boolean)
    .map((word) => (word.length <= 2 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

/** Reads a `title:` out of YAML frontmatter, when the page carries one. */
export function titleFromFrontmatter(text) {
  const frontmatter = String(text).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) return null;

  const title = frontmatter[1].match(/^title:\s*(.+?)\s*$/m);
  if (!title) return null;

  return title[1].replace(/^["']|["']$/g, "").trim() || null;
}
