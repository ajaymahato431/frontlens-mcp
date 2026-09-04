# Changelog

All notable changes to `frontlens-mcp` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
