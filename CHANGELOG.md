# Changelog

All notable changes to `frontlens-mcp` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-09-04

### Added
- **Live documentation index.** The server now reads the official navigation of
  five documentation sites and serves the real thing — around 1,050 pages, up
  from 17 bundled ones:
  - React — the `sidebarLearn.json` / `sidebarReference.json` navigation from
    `reactjs/react.dev`, with pages from the same repository.
  - Next.js — `nextjs.org/sitemap.xml`, with pages from nextjs.org's own
    markdown rendering (`<url>.md`). No GitHub access needed.
  - Vite — `vite.dev/sitemap.xml`, with pages from `vitejs/vite`.
  - Tailwind CSS — the docs directory of `tailwindlabs/tailwindcss.com`.
  - TypeScript — the handbook in `microsoft/TypeScript-Website`.
- **`list_frontend_docs`** (seventh tool): browses the index — a per-framework
  summary with no arguments, then categories, then paged page listings.
- **Offline snapshot.** `src/frameworks/fallback-index.json` ships a copy of every
  index. A framework that cannot be reached degrades to its snapshot and says so,
  rather than failing the call. Regenerate it with
  `node scripts/build-fallback-index.mjs`.
- CI and release workflows, dependabot, and issue/PR templates under `.github/`.
- Offline adapter tests with fixtures (`test/frameworks.test.mjs`), and integration
  coverage for the CLI, environment precedence, schema validation and error paths.

### Fixed
- **`check_api` ignored its own `version` argument.** It reported an API's end
  state regardless of the version asked about, so `render` at React 18 came back
  as REMOVED when it is deprecated-but-present until 19. Status is now resolved
  against `introducedIn` / `deprecatedIn` / `removedIn` for the requested version.
- **Every upstream documentation URL was a dead 404.** They pointed at
  `facebook/react.dev`, which does not exist — the organisation is `reactjs`.
  Fetches threw on every call and were silently swallowed, so the HTTP client,
  retries, cache and `GITHUB_TOKEN` support had never actually run.
- `readDocContent` ignored the configured `--doc-ttl` and hardcoded a 3-hour cache
  lifetime.
- `resolveDocEntry` could return an unrelated page: a loose substring match meant a
  short query silently resolved to whichever page happened to be first. It now
  declines an ambiguous path instead of guessing.
- `search_frontend_docs` fetches when `includeContent` is set but carried no
  network hint, so a failure there was reported without guidance.
- A failed page fetch is now reported with its status and an actionable hint
  instead of being discarded by a bare `catch {}`.

### Changed
- **Breaking for calling agents:** tool output now names the source URL each page
  was served from and whether it came from the live site or the bundled copy.
  `search_frontend_docs` and `read_frontend_docs` operate over the full live index,
  so paths look like `react/reference/react/useActionState` rather than only the
  handful of curated slugs. The curated pages remain available at their old paths.
- The 17 bundled pages are now an offline fallback layer that supplements the live
  index rather than being the whole catalogue.
- `src/core/` gained per-status error hints, an `indexTtl` option, and search
  scoring over `summary` and `category`. These are synced across all four servers.

## [1.0.0] - 2026-09-04

### Added
- Initial release of **FrontLens MCP** (`frontlens-mcp`).
- Built in pure Node.js ESM matching `livewire-mcp`, `filament-mcp`, and `django-mcp`.
- **6 MCP Tools**:
  - `frontend_context`: Deep scan of project dependencies, exact lockfile/node_modules versions, config files (Vite, Next.js, Tailwind v3/v4, TSConfig), and actionable version advisories.
  - `search_frontend_docs`: Version-aware multi-framework keyword search across React, Next.js, Vite, Tailwind CSS, and TypeScript docs.
  - `read_frontend_docs`: Read documentation pages with heading outline and section extraction.
  - `check_api`: Query API lifecycle (current, deprecated, removed, new) with replacements and before/after snippets.
  - `migration_guide`: Step-by-step upgrade guides (Tailwind 3 to 4, React 18 to 19, Next 14 to 15/16).
  - `frontend_best_practices`: Curated, authoritative best practices by framework with Do's and Don'ts.
- Resilient offline-first bundled knowledge registry with on-demand upstream documentation fetching.
- Full stdio MCP integration test suite and unit tests using `node:test`.
