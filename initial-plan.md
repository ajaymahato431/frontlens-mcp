Yes. The right way to build this is **not** as a generic documentation-search MCP. It should be a **version-aware frontend engineering MCP** that sits between the coding agent and the modern TypeScript frontend ecosystem.

A good working concept is:

> **The agent asks for frontend knowledge → your MCP detects the project/version/context → retrieves only the relevant authoritative documentation → resolves deprecated/removed APIs → returns a compact implementation answer with current examples and source references.**

That directly attacks the problem you described: coding agents often know React/Vite/Tailwind/TypeScript/Next.js conceptually, but their learned knowledge can lag behind rapidly changing APIs and conventions.

I verified the current ecosystem before designing this. As of September 2026, React's latest stable package is **19.2.8**; the official React docs currently document React 19.2. ([npm][1]) Vite is **8.2.2**, Tailwind CSS is **4.3.3**, Next.js is **16.3.4**, and TypeScript is already **7.0.2**. ([npm][2])

That itself proves why this MCP is useful: the ecosystem moves faster than an LLM's static training knowledge.

---

# 1. Recommended name

My strongest recommendation:

# **FrontLens**

### FrontLens MCP

**“Version-aware frontend intelligence for coding agents.”**

Why I like it:

- **Front** → frontend ecosystem
- **Lens** → inspect, understand, verify
- sounds like a developer tool rather than another AI wrapper
- broad enough to support React, Next.js, Vite, Tailwind, TypeScript and future tools
- doesn't lock you into one framework
- works nicely as a package/repository name

Example:

```text
frontlens-mcp
```

Potential branding:

> **FrontLens**
> Modern frontend knowledge for coding agents.

Other strong names:

| Name                  | Feel                        | Recommendation |
| --------------------- | --------------------------- | -------------- |
| **FrontLens**         | Professional, technical     | ⭐⭐⭐⭐⭐     |
| **TypeFront**         | TypeScript/frontend focused | ⭐⭐⭐⭐       |
| **FrontForge**        | Builder-oriented            | ⭐⭐⭐⭐       |
| **WebStack Lens**     | Broad                       | ⭐⭐⭐⭐       |
| **Frontend MCP**      | Very clear                  | ⭐⭐⭐         |
| **CodeLens Frontend** | Familiar concept            | ⭐⭐⭐         |
| **StackPilot**        | Agent-oriented              | ⭐⭐⭐         |
| **UIStack MCP**       | UI-focused                  | ⭐⭐⭐         |

I'd choose **FrontLens**.

---

# 2. What you are actually building

The architecture should be based around four capabilities:

```text
                 ┌─────────────────────────┐
                 │    Coding Agent         │
                 │ Claude Code /           │
                 │ Antigravity / Others    │
                 └────────────┬────────────┘
                              │ MCP
                              ▼
                 ┌─────────────────────────┐
                 │     FrontLens MCP       │
                 ├─────────────────────────┤
                 │ Project Detection       │
                 │ Version Resolution      │
                 │ Documentation Search    │
                 │ API Knowledge            │
                 │ Best Practices           │
                 │ Migration Intelligence  │
                 │ Token Optimization      │
                 └────────────┬────────────┘
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
        Documentation      Version DB      Project Files
             │                │                │
             ▼                ▼                ▼
       React / Next       API metadata      package.json
       Vite / Tailwind    deprecated        lockfiles
       TypeScript         removed           configs
             │             migration        source context
             └────────────────┼────────────────┘
                              ▼
                     Compact answer/context
```

The MCP should **not simply dump documentation into the model**.

That would defeat your token-efficiency goal.

Instead:

```text
User question
    ↓
detect project
    ↓
detect installed versions
    ↓
classify intent
    ↓
search relevant docs
    ↓
rank results
    ↓
resolve API status
    ↓
compress answer
    ↓
return only useful context
```

---

# 3. Core design principle

The most important architectural decision:

## **Project version beats global latest version**

Suppose the project contains:

```json
{
  "dependencies": {
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "vite": "^8.2.2",
    "tailwindcss": "^4.3.3"
  }
}
```

FrontLens should say:

```text
Detected project:

React: 19.2.x
React DOM: 19.2.x
Vite: 8.2.x
Tailwind CSS: 4.3.x
TypeScript: 7.x
```

Then the agent asks:

> How should I create the React root?

The MCP should not answer using some old React 17 memory.

It should retrieve the current API state:

```text
React 19.2
createRoot ✅
render() ❌ removed
hydrate() ❌ removed
hydrateRoot() ✅
```

React's current documentation explicitly lists `render`, `hydrate`, `findDOMNode`, and `unmountComponentAtNode` as removed APIs in React 19 and points developers toward the modern alternatives. ([React][3])

That is exactly the sort of mistake your MCP should prevent.

---

# 4. Frameworks and libraries to support

Your initial ecosystem should be:

### Core

```text
React
React DOM
TypeScript
Vite
Tailwind CSS
Next.js
```

Then second wave:

```text
React Router
TanStack Query
Zustand
Redux Toolkit
shadcn/ui
Radix UI
Vitest
Playwright
ESLint
Prettier
Storybook
PostCSS
```

Third wave:

```text
Astro
Remix / React Router framework mode
Svelte
Vue
Nuxt
Solid
Qwik
```

But don't make the first release too broad.

Your \*\*V1 identity should be:

> React + TypeScript + Vite + Tailwind + Next.js

That is enough to make the MCP genuinely useful.

---

# 5. Documentation sources

Create a documentation registry.

For example:

```yaml
sources:
  react:
    homepage: https://react.dev
    docs: https://react.dev/learn
    reference: https://react.dev/reference
    authority: official

  vite:
    homepage: https://vite.dev
    docs: https://vite.dev/guide
    reference: https://vite.dev/config

  typescript:
    homepage: https://www.typescriptlang.org
    docs: https://www.typescriptlang.org/docs
    authority: official

  tailwind:
    homepage: https://tailwindcss.com
    docs: https://tailwindcss.com/docs
    authority: official

  nextjs:
    homepage: https://nextjs.org
    docs: https://nextjs.org/docs
    authority: official
```

Your supplied URLs are exactly the right starting set. React, Vite, TypeScript, Tailwind and Next.js all publish authoritative documentation that can be indexed directly. ([Tailwind CSS][4])

Next.js is particularly interesting because its documentation now exposes an `llms.txt` index, which is highly useful for an AI-oriented retrieval system. ([Next.js][5])

---

# 6. Do not depend exclusively on scraping HTML

This is important.

Build the ingestion layer to support:

```text
HTML
Markdown
MDX
llms.txt
llms-full.txt
GitHub source
GitHub releases
npm metadata
package manifests
changelogs
upgrade guides
```

Priority:

```text
Official structured AI docs
        ↓
Official Markdown / docs repository
        ↓
Official HTML docs
        ↓
Official GitHub source/changelog
        ↓
npm package metadata
```

Don't treat search-engine results as your primary knowledge source.

Search engines should only be a fallback/discovery mechanism.

---

# 7. Documentation ingestion architecture

Build a pipeline:

```text
Documentation URL
        ↓
Fetcher
        ↓
Normalizer
        ↓
Parser
        ↓
Document splitter
        ↓
Metadata extraction
        ↓
Version classifier
        ↓
API/entity extraction
        ↓
Index
```

Every documentation page becomes structured data.

For example:

```json
{
  "id": "react/createRoot",
  "framework": "react",
  "version": "19.2",
  "title": "createRoot",
  "category": "api",
  "status": "stable",
  "url": "https://react.dev/reference/react-dom/client/createRoot",
  "summary": "Creates a React root...",
  "examples": [],
  "related": [],
  "deprecated": false
}
```

---

# 8. Most important feature: version intelligence

Your MCP needs a dedicated **Version Resolver**.

Input:

```text
package.json
package-lock.json
pnpm-lock.yaml
yarn.lock
bun.lock
```

Detect:

```text
react
react-dom
next
vite
typescript
tailwindcss
@vitejs/plugin-react
eslint
...
```

Then normalize versions.

For example:

```text
^19.2.8
```

becomes:

```text
installed-range:
>=19.2.8 <20
```

But ideally, when lockfile is available:

```text
resolved-version:
19.2.8
```

This gives you two layers:

```text
Declared version
Resolved version
```

And the resolved version should take precedence.

---

# 9. Version awareness must include compatibility

Do not only detect:

```text
React 19
```

You need relationships.

Example:

```yaml
compatibility:
  react:
    19.2.x:
      react-dom: "19.2.x"
      typescript: ">=5.1"
```

For Next.js:

```text
Next.js
 ├── React compatibility
 ├── Node.js compatibility
 ├── TypeScript compatibility
 ├── App Router
 └── Pages Router
```

For Vite:

```text
Vite
 ├── Node requirements
 ├── plugin compatibility
 ├── framework plugins
 └── build target
```

The current Vite documentation, for example, states Node.js requirements of 20.19+ or 22.12+ for the current major. ([vitejs][6])

Your MCP should surface this automatically when relevant.

---

# 10. API knowledge database

This is where FrontLens becomes substantially more valuable than a normal docs MCP.

Create an API registry:

```text
API Registry
│
├── React
│   ├── useState
│   ├── useEffect
│   ├── useEffectEvent
│   ├── use
│   ├── cache
│   ├── Activity
│   └── ...
│
├── React DOM
│   ├── createRoot
│   ├── hydrateRoot
│   └── ...
│
├── Vite
│   ├── defineConfig
│   ├── import.meta.env
│   └── ...
│
├── Tailwind
│   ├── @theme
│   ├── @import
│   └── ...
│
└── Next.js
    ├── Server Components
    ├── Route Handlers
    ├── generateMetadata
    └── ...
```

Each API should have:

```json
{
  "name": "render",
  "package": "react-dom",
  "introduced": "0.x",
  "removed": "19.0",
  "status": "removed",
  "replacement": "createRoot",
  "migration_url": "...",
  "reason": "...",
  "examples": []
}
```

---

# 11. API lifecycle states

Use an explicit enum:

```text
experimental
canary
alpha
beta
stable
preferred
deprecated
discouraged
removed
legacy
```

This is much better than a simple:

```text
exists = true
```

Because an API might still function while no longer being recommended.

---

# 12. The migration engine

This should be a first-class subsystem.

Example query:

> Can I use `render` in React?

MCP response:

```text
React 19.2:
render → REMOVED

Use:
createRoot()

Migration:
ReactDOM.render(<App />, node)
↓
const root = createRoot(node)
root.render(<App />)
```

React's official reference confirms exactly this migration direction: `render` is removed and `createRoot` is the replacement. ([React][3])

Another example:

```text
hydrate
↓
hydrateRoot
```

And:

```text
unmountComponentAtNode
↓
root.unmount()
```

---

# 13. Best-practices engine

Don't return raw docs for everything.

Build a second knowledge layer:

```text
Documentation
     +
Version state
     +
Official recommendations
     ↓
Best-practice rules
```

Example:

```json
{
  "rule": "avoid_effect_for_derived_state",
  "framework": "react",
  "scope": "19.x",
  "severity": "recommended",
  "summary": "Do not use an Effect just to derive render-time values.",
  "source": "react.dev/learn/..."
}
```

The MCP can then answer:

> What's the recommended way to derive filtered data?

without dumping half the React documentation into the context.

---

# 14. Don't make “best practice” an opinion database

This needs a strict hierarchy.

### Authority levels

```text
L1 — Official framework documentation
L2 — Official RFC / release notes
L3 — Official GitHub repository
L4 — Official migration guides
L5 — Maintainer-authored recommendations
L6 — Community consensus
L7 — Generic AI inference
```

For version/API correctness:

**L1-L4 only.**

For stylistic recommendations:

L5-L6 can be used.

This prevents the MCP from confidently telling an agent:

> “The community recommends X”

when the framework itself recommends Y.

---

# 15. Simplified-code engine

This matches another part of your requirement.

The MCP should be able to recognize code that is:

```text
valid
but unnecessarily complex
```

For example:

```tsx
const [open, setOpen] = useState(false);

const toggle = () => {
  setOpen(!open);
};
```

and perhaps recommend:

```tsx
setOpen((prev) => !prev);
```

But this should be **rule-based and contextual**, not indiscriminately applied.

Another example:

```text
manual Vite configuration
```

when the current Vite/React template already solves the requirement.

---

# 16. Crucial distinction: documentation search vs code intelligence

I recommend five different retrieval domains:

```text
1. docs
2. api
3. migration
4. best-practice
5. code-pattern
```

Then a query can be classified.

Example:

> How do I add Tailwind to Vite?

→ `docs`

> Is `@tailwind base` still required?

→ `migration + docs`

> Is this React hook approach recommended?

→ `best-practice + docs`

> What replaced `ReactDOM.render`?

→ `api + migration`

> Simplify this component

→ `code-pattern`

That makes retrieval dramatically more efficient.

---

# 17. MCP tool design

Do **not** expose 25 tiny MCP tools.

Every tool itself becomes model-facing context.

Keep the public MCP interface small.

I recommend:

## Tool 1 — `frontend_context`

Returns the detected project ecosystem.

Example:

```json
{
  "framework": "react",
  "meta_framework": "vite",
  "versions": {
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "vite": "8.2.2",
    "typescript": "7.0.2",
    "tailwindcss": "4.3.3"
  }
}
```

---

## Tool 2 — `frontend_search`

The primary tool.

Input:

```json
{
  "query": "how do I configure Tailwind with Vite",
  "scope": "auto"
}
```

Response:

```text
Tailwind 4 + Vite

Recommended setup:
1. Install tailwindcss and @tailwindcss/vite
2. Add tailwindcss() to vite.config.ts
3. Add @import "tailwindcss" to CSS

Source:
Tailwind official Vite installation guide
```

The current Tailwind documentation explicitly recommends the dedicated Vite plugin in this setup. ([Tailwind CSS][4])

---

# 18. Tool 3 — `check_api`

This is one of your killer features.

Input:

```json
{
  "name": "render",
  "package": "react-dom",
  "version": "19.2.8"
}
```

Response:

```json
{
  "status": "removed",
  "version": "19.0.0",
  "replacement": "createRoot",
  "confidence": "official",
  "source": "..."
}
```

---

# 19. Tool 4 — `migration`

Input:

```json
{
  "from": "react-dom.render",
  "target_version": "19.2.8"
}
```

Response:

```text
React DOM `render` was removed in React 19.

Use `createRoot`.

Before:
...

After:
...
```

---

# 20. Tool 5 — `recommend`

For best practices.

Input:

```json
{
  "query": "best way to fetch data in a Next.js App Router page",
  "project": "auto"
}
```

MCP determines:

```text
Next.js 16
App Router
TypeScript
React 19
```

Then retrieves relevant current docs.

---

# 21. Tool 6 — `inspect_code`

Optional but very powerful.

Input:

```json
{
  "code": "...",
  "language": "tsx"
}
```

Return:

```text
Issues:
- deprecated API
- obsolete Tailwind syntax
- unnecessary Effect
- incorrect Server/Client boundary
```

This makes your MCP much more useful than a documentation retriever.

---

# 22. Tool 7 — `upgrade_check`

This could become one of the flagship features.

Agent asks:

```text
upgrade_check
```

MCP scans:

```text
package.json
lockfile
configs
source patterns
```

Then returns:

```text
Project upgrade analysis

React:
19.1 → 19.2
No breaking changes detected

Tailwind:
3.x → 4.x
Migration required

Vite:
7.x → 8.x
Node.js requirement must be checked

TypeScript:
5.x → 7.x
Deprecated compiler options detected
```

TypeScript's current release documentation already illustrates why this is important: TypeScript 6 introduced significant deprecations and preparation for the native TypeScript 7 compiler, including deprecated options such as `target: es5`, `moduleResolution: node10`, and `baseUrl`. ([typescriptlang.org][7])

And now npm lists TypeScript 7.0.2 as the stable package. ([npm][8])

---

# 23. Tool 8 — `project_rules`

This could return:

```text
Frontend rules detected:

- React 19.2
- TypeScript strict mode
- Vite
- Tailwind 4
- ESLint
- path alias @/*
- functional components
- no default exports
```

This allows the agent to understand the project's conventions before modifying code.

---

# 24. MCP Resources

Don't expose everything as tools.

MCP supports **tools, resources, and prompts** as separate primitives. Tools are model-controlled actions, resources provide structured contextual data, and prompts are reusable user-controlled templates. ([Model Context Protocol][9])

Use resources for relatively stable knowledge.

For example:

```text
frontlens://project/context
frontlens://project/versions
frontlens://react/19.2/apis
frontlens://vite/8.2/apis
frontlens://tailwind/4.3/apis
frontlens://typescript/7/apis
frontlens://next/16/apis
```

But don't automatically return huge resources.

They should remain selectively readable.

---

# 25. MCP prompts

You can also expose useful prompts:

```text
frontlens.review_frontend
frontlens.check_deprecations
frontlens.upgrade_project
frontlens.verify_framework_usage
frontlens.simplify_component
```

For example:

```text
/frontlens.check_deprecations
```

could instruct the agent to:

```text
Inspect frontend dependencies and source files.
Check APIs against installed framework versions.
Prioritize removed/deprecated APIs.
Do not modify code.
Report migration recommendations.
```

---

# 26. Token efficiency architecture

This is one of the most important parts.

Your MCP should optimize for:

```text
minimum relevant context
```

not:

```text
maximum documentation retrieval
```

The retrieval pipeline should be:

```text
Query
 ↓
Intent classification
 ↓
Project context
 ↓
Version filter
 ↓
Metadata filter
 ↓
BM25 search
 ↓
reranking
 ↓
deduplicate
 ↓
compress
 ↓
return top results
```

---

# 27. Use hybrid retrieval

I would not start with embeddings alone.

Use:

### First layer

**BM25 / full-text**

Excellent for:

```text
createRoot
useEffectEvent
defineConfig
@tailwindcss/vite
generateMetadata
moduleResolution
```

### Second layer

Semantic/vector search.

Useful for:

```text
"How do I avoid rerunning this effect when a property changes?"
```

### Third layer

Reranker.

Final ranking:

```text
lexical score
+
semantic score
+
version score
+
authority score
+
freshness score
+
query intent score
```

---

# 28. Version score should be extremely important

For example:

```text
React 18 documentation      score 0.40
React 19 documentation      score 0.95
React 19.2 API reference    score 1.00
```

For a React 19.2 project, old docs should be nearly invisible unless the user explicitly asks about migration.

---

# 29. Token-budget-aware retrieval

Give the MCP an internal budget:

```text
tiny
small
medium
large
```

Example:

```json
{
  "budget": "small"
}
```

could return:

```text
1 summary
2 code blocks
2 source references
```

Instead of:

```text
12 documentation chunks
```

For coding agents, **small should be the default**.

---

# 30. Response structure

The MCP should return a standardized compact structure.

For example:

```text
[VERSION]
React 19.2.8

[ANSWER]
Use createRoot().

[CODE]
...

[WARNINGS]
ReactDOM.render() is removed.

[SOURCE]
react.dev/reference/react-dom/client/createRoot
```

This structure is highly predictable for agents.

---

# 31. Don't return markdown essays

This is a common MCP mistake.

Bad:

```text
Here is everything about React roots...
[600 lines]
```

Good:

```text
React 19.2:
createRoot ✅
render ❌ removed

Use:
...

Official:
react.dev/...
```

That is what makes your MCP valuable.

---

# 32. Documentation chunking

Do not chunk every 500 tokens blindly.

Semantic boundaries should be:

```text
page
 ├── title
 ├── summary
 ├── prerequisites
 ├── API
 ├── syntax
 ├── example
 ├── caveats
 ├── migration
 └── related APIs
```

A chunk should ideally represent a complete idea.

For example:

```text
React/useEffectEvent/usage
```

is much better than:

```text
react/page/7/chunk/4
```

---

# 33. Code examples need their own index

This is another major advantage.

Extract code blocks separately:

```text
examples/
    react/
    vite/
    tailwind/
    typescript/
    next/
```

Metadata:

```json
{
  "framework": "react",
  "version": "19.2",
  "language": "tsx",
  "topic": "useEffectEvent",
  "quality": "official"
}
```

Then the MCP can give the agent **one authoritative example** instead of a whole documentation page.

---

# 34. Versioned documentation storage

Use snapshots.

Example:

```text
data/
  docs/
    react/
      18/
      19/
        19.0/
        19.1/
        19.2/

    next/
      14/
      15/
      16/

    vite/
      7/
      8/

    tailwind/
      3/
      4/

    typescript/
      5/
      6/
      7/
```

But don't duplicate entire documents unnecessarily.

Use:

```text
content-addressed storage
```

with:

```text
sha256(content)
```

so unchanged content is reused.

---

# 35. Database choice

For your use case I'd start with:

## SQLite

with:

```text
FTS5
```

and JSON columns.

Why?

Because the initial system is primarily:

```text
read-heavy
local
portable
small
fast
```

Example schema:

```sql
documents
-----------
id
framework
version
title
url
content
summary
authority
updated_at
hash

chunks
-----------
id
document_id
heading
content
token_count
embedding
metadata

apis
-----------
id
package
name
version_from
version_to
status
replacement
migration
source_url

examples
-----------
id
api_id
language
code
description
source_url
```

---

# 36. Don't immediately use PostgreSQL + vector DB

You can later provide:

```text
SQLite local mode
PostgreSQL server mode
```

But V1 should stay lightweight.

Potential architecture:

```text
SQLite
├── FTS5
├── metadata
├── API registry
└── cache

Optional:
Qdrant / pgvector
```

Vector DB should be an optional accelerator, not a core dependency.

---

# 37. Embedding strategy

Embeddings should be precomputed during ingestion.

Never make every agent query call an external embedding API unless necessary.

That would create:

```text
latency
cost
privacy concerns
network dependency
```

Prefer:

```text
local embedding model
```

or make semantic search optional.

---

# 38. Search algorithm

A practical ranking formula:

```text
final_score =
    0.30 lexical_score
  + 0.20 semantic_score
  + 0.20 version_match
  + 0.10 authority
  + 0.10 freshness
  + 0.10 intent_match
```

Then adjust:

```text
removed API:
+ migration boost

exact API match:
+ exact match boost

wrong major version:
- heavy penalty
```

---

# 39. Freshness system

This MCP must stay updated automatically.

Create:

```text
frontlens sync
```

and:

```text
frontlens check-updates
```

Scheduled update process:

```text
1. fetch source
2. compare hash
3. detect changed pages
4. extract changed APIs
5. update indexes
6. rebuild affected embeddings
7. update version registry
8. run regression tests
```

---

# 40. Release monitoring

For each supported ecosystem track:

```text
latest stable
latest supported
previous stable
deprecated
EOL
canary/beta
```

React itself currently publishes version archives by major, with 19.2 as the current documented version. ([React][10])

Vite publishes a supported-version policy and indicates its current supported branches, which is another useful signal to ingest rather than guessing from package versions alone. ([vitejs][11])

---

# 41. npm registry integration

Use npm metadata to confirm:

```text
latest
next
beta
canary
dist-tags
published versions
```

This gives you an independent version source.

For example, today:

```text
react      19.2.8
vite       8.2.2
tailwind   4.3.3
next       16.3.4
typescript 7.0.2
```

([npm][1])

---

# 42. The “latest” problem

Never interpret:

```text
latest
```

as:

```text
latest globally
```

There should be three meanings:

```text
project_latest
ecosystem_latest
requested_version
```

Example:

```text
Project React: 18.3
Global latest React: 19.2
```

If the agent asks:

> How do I do X in React?

return React 18.x guidance.

If it asks:

> What's the newest React API?

return React 19.2.

That distinction is absolutely critical.

---

# 43. Framework detection

The MCP should inspect:

```text
package.json
tsconfig.json
vite.config.*
next.config.*
tailwind.config.*
eslint.config.*
src/
app/
pages/
```

Detection rules:

```text
next dependency → Next.js
vite dependency → Vite
react dependency → React
@vitejs/plugin-react → React + Vite
next/app → App Router
pages/ → Pages Router possibility
tailwindcss → Tailwind
typescript → TypeScript
```

---

# 44. Detect project architecture

For Next.js:

```text
App Router
Pages Router
hybrid
```

For React:

```text
Vite SPA
React Router SPA
embedded React
framework-managed
```

For Tailwind:

```text
v3 configuration
v4 CSS-first setup
Vite plugin
PostCSS
```

This prevents generic answers that aren't compatible with the actual project.

---

# 45. Tailwind deserves special handling

Tailwind 4 changed configuration substantially.

The current official Vite setup uses:

```text
tailwindcss
@tailwindcss/vite
```

and CSS:

```css
@import "tailwindcss";
```

rather than blindly applying old Tailwind 3 instructions. ([Tailwind CSS][4])

This is a perfect demonstration of your MCP's purpose.

An LLM might still generate:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

because it learned that pattern strongly.

FrontLens should catch that and say:

```text
Your project uses Tailwind 4.
The requested Tailwind 3 setup is outdated.
Use the current v4/Vite integration.
```

---

# 46. Next.js deserves its own intelligence layer

Next.js is more than a library.

Your knowledge model should understand:

```text
App Router
Pages Router
Server Components
Client Components
Server Actions
Route Handlers
Metadata
Caching
Rendering
Middleware / Proxy changes
Image
Font
Navigation
Deployment
```

And every response should account for the router.

For example:

```text
App Router answer
!=
Pages Router answer
```

The official docs explicitly distinguish App Router and Pages Router. ([Next.js][5])

---

# 47. React knowledge should include “modern React”

Your React index should specifically track newer concepts such as:

```text
Activity
useEffectEvent
cache
cacheSignal
Server Components
partial pre-rendering
```

React 19.2 introduced several of these features, including `<Activity />`, `useEffectEvent`, and `cacheSignal`. ([React][12])

The MCP shouldn't merely know that these APIs exist. It should know:

```text
stable?
canary?
when to use?
when NOT to use?
limitations?
```

For example, the official `useEffectEvent` guidance explicitly warns against using it merely to silence dependency-related lint errors. ([React][13])

That is exactly the type of nuanced guidance coding agents often miss.

---

# 48. “Don't use this” knowledge

Create a dedicated negative knowledge base.

Example:

```text
avoid:
ReactDOM.render
ReactDOM.hydrate
findDOMNode

prefer:
createRoot
hydrateRoot
refs / modern patterns
```

This is arguably more important than the positive API catalog.

Your MCP should answer:

> What should the agent NOT use?

---

# 49. Deprecation detector

You can create a code scanner:

```text
source code
↓
AST
↓
imports
↓
function calls
↓
identifiers
↓
API registry
↓
version check
```

Example:

```tsx
import ReactDOM from "react-dom";

ReactDOM.render(...)
```

Scanner resolves:

```text
package = react-dom
api = render
project version = 19.2.8
status = removed
```

and returns:

```text
❌ ReactDOM.render is removed in React 19.
✅ Use createRoot().
```

This is much stronger than documentation search alone.

---

# 50. AST support

Use:

```text
TypeScript Compiler API
```

or:

```text
ts-morph
```

for TypeScript/TSX.

That allows inspection of:

```text
imports
exports
functions
components
hooks
JSX
types
```

Later add:

```text
CSS parser
PostCSS AST
Tailwind class parser
```

---

# 51. Tailwind class intelligence

This could become a unique feature.

Example:

```text
bg-[#fff]
text-[16px]
```

MCP could determine whether:

```text
utility exists
arbitrary value valid
replacement preferred
```

It could also understand:

```text
responsive variants
dark mode
container queries
state variants
theme variables
```

---

# 52. TypeScript intelligence

Your MCP should maintain:

```text
compiler options
deprecated options
new defaults
breaking changes
module resolution
module formats
ES target
strictness
```

For TypeScript 6/7 migration, this becomes especially valuable.

The TypeScript 6 release notes explicitly document deprecations such as:

```text
target: es5
moduleResolution: node10
baseUrl
moduleResolution: classic
outFile
```

and explain that some of these are preparing for TypeScript 7. ([typescriptlang.org][7])

---

# 53. Source trust

Every response should carry source metadata internally.

Example:

```json
{
  "source": {
    "publisher": "React",
    "authority": "official",
    "version": "19.2",
    "url": "..."
  }
}
```

The agent doesn't necessarily need to display it every time, but it lets your ranking system differentiate official information from community content.

---

# 54. Contradiction handling

Suppose:

```text
Doc A says X
Doc B says Y
```

FrontLens should not blindly merge them.

It should resolve:

```text
version
publication date
authority
router/framework context
```

Then:

```text
React 18 → X
React 19 → Y
```

or:

```text
Official docs recommend Y.
Older source says X.
```

---

# 55. Search query rewriting

Before retrieval:

```text
user:
"How can I use effect event?"
```

rewrite internally to:

```text
React
useEffectEvent
React 19+
official reference
usage
caveats
```

But do not send that giant rewritten query back to the model.

---

# 56. Intent classifier

Use a lightweight rule-based classifier first.

Categories:

```text
installation
configuration
api
migration
debugging
architecture
best-practice
performance
typescript
styling
accessibility
testing
deployment
upgrade
```

Only invoke semantic retrieval when needed.

---

# 57. Cache everything

Use several cache levels:

```text
HTTP fetch cache
documentation parse cache
search-result cache
version detection cache
API lookup cache
embedding cache
```

Example:

```text
same query + same project fingerprint
→ cached response
```

The project fingerprint could be:

```text
hash(package.json + lockfile + framework configs)
```

---

# 58. Project fingerprint

Example:

```text
fingerprint:
react@19.2.8
vite@8.2.2
tailwindcss@4.3.3
typescript@7.0.2
router=vite-spa
tailwind=v4
```

Cache key:

```text
SHA256(
    normalized_project_context
    +
    normalized_query
)
```

---

# 59. MCP transport

You should support both:

## Local

```text
stdio
```

Best for:

```text
Claude Code
local Antigravity
local development
```

## Remote

```text
Streamable HTTP
```

Best for:

```text
team deployment
central server
remote agents
CI
```

Antigravity currently supports MCP and documents local `stdio` plus remote MCP configurations, including Streamable HTTP. ([antigravity.google][14])

Claude Code also exposes MCP configuration through its CLI. ([Claude Platform Docs][15])

So your architecture should be transport-independent.

---

# 60. Recommended technology stack

I would build the MCP in:

## TypeScript

Because your target ecosystem is:

```text
React
Next
Vite
TypeScript
Tailwind
```

and the official MCP ecosystem has strong TypeScript support.

Suggested stack:

```text
Runtime:
Node.js 22+

Language:
TypeScript

MCP:
Official MCP TypeScript SDK

Database:
SQLite

Search:
SQLite FTS5 / BM25

AST:
TypeScript compiler API / ts-morph

Parsing:
unified
remark
rehype

HTTP:
undici / fetch

Validation:
Zod

Testing:
Vitest

CLI:
Commander or CAC

Logging:
pino

Package:
npm
```

---

# 61. Suggested repository architecture

```text
frontlens-mcp/
│
├── apps/
│   └── server/
│
├── packages/
│   ├── core/
│   ├── mcp/
│   ├── docs/
│   ├── search/
│   ├── versions/
│   ├── api-registry/
│   ├── analyzer/
│   ├── project-detector/
│   ├── token-budget/
│   └── shared/
│
├── sources/
│   ├── react.ts
│   ├── vite.ts
│   ├── tailwind.ts
│   ├── typescript.ts
│   └── next.ts
│
├── data/
│   └── ...
│
├── tests/
│   ├── integration/
│   ├── retrieval/
│   ├── versions/
│   └── fixtures/
│
├── scripts/
│   ├── sync-docs.ts
│   ├── rebuild-index.ts
│   └── update-versions.ts
│
├── README.md
├── package.json
└── tsconfig.json
```

---

# 62. Internal package responsibilities

### `core`

Shared types:

```text
ProjectContext
Version
DocumentationChunk
ApiEntry
SearchResult
Migration
BestPractice
```

### `docs`

Handles:

```text
fetch
parse
normalize
chunk
metadata
```

### `search`

Handles:

```text
FTS
semantic retrieval
ranking
reranking
deduplication
```

### `versions`

Handles:

```text
semver
npm registry
lockfile parsing
compatibility
release state
```

### `api-registry`

Handles:

```text
API status
deprecated
removed
replacement
migration
```

### `analyzer`

Handles:

```text
AST
imports
hooks
API usage
config detection
```

---

# 63. Documentation metadata model

Use a richer schema than a normal vector store.

```typescript
interface DocChunk {
  id: string;

  ecosystem: Ecosystem;
  package?: string;

  version?: string;
  versionRange?: string;

  title: string;
  headingPath: string[];

  content: string;
  summary?: string;

  type:
    | "guide"
    | "api"
    | "migration"
    | "reference"
    | "example"
    | "concept"
    | "best-practice";

  authority: "official" | "maintainer" | "community";

  sourceUrl: string;
  sourceUpdatedAt?: string;

  tokenCount: number;
}
```

---

# 64. API model

```typescript
interface ApiEntry {
  package: string;
  name: string;

  introduced?: string;
  deprecatedSince?: string;
  removedSince?: string;

  status: "stable" | "experimental" | "deprecated" | "removed" | "legacy";

  replacement?: string;

  summary?: string;
  example?: string;

  docsUrl: string;
  migrationUrl?: string;
}
```

---

# 65. Example complete MCP flow

Agent:

> Add Tailwind CSS to this React Vite project.

FrontLens:

### Project inspection

```text
React 19.2.8
Vite 8.2.2
TypeScript 7.0.2
Tailwind not detected
```

### Retrieval

```text
Tailwind
+
Vite
+
React
+
current version
```

### Answer

```text
Use Tailwind CSS 4's Vite plugin.

Install:
npm install tailwindcss @tailwindcss/vite

vite.config.ts:
...

main CSS:
@import "tailwindcss";
```

Current Tailwind docs recommend exactly this dedicated Vite integration. ([Tailwind CSS][4])

---

# 66. Another example

Agent asks:

> Use ReactDOM.render to bootstrap the app.

FrontLens catches:

```text
API: render
Package: react-dom
Version: 19.2.8
Status: removed
```

Then:

```text
Do not use ReactDOM.render().
It was removed in React 19.

Use createRoot():

const root = createRoot(...)
root.render(<App />)
```

Official source:
React 19 API reference.

([React][3])

---

# 67. Another important example

Agent:

> Configure Tailwind using postcss.

Project:

```text
Tailwind 4
Vite 8
```

FrontLens:

```text
Possible, but not preferred.

For Tailwind 4 + Vite:
use @tailwindcss/vite.

PostCSS is available, but the official Vite guide recommends the Vite plugin.
```

That is much better than simply saying:

> "Here is how PostCSS works."

---

# 68. “Answer vs evidence” mode

Every MCP result should support:

```text
answer_only
answer_with_source
evidence
```

Default:

```text
answer_only
```

because coding agents need compact context.

For audits:

```text
evidence
```

returns:

```text
claim
source
version
```

---

# 69. Token budget estimator

Before returning results:

```text
estimate tokens
```

Example:

```text
Requested budget: 500
retrieved: 1430
compressed: 382
```

Then only return the 382-token representation.

This gives you measurable token-efficiency metrics.

---

# 70. Response compression strategy

Compression levels:

### Level 0

Only answer.

### Level 1

Answer + code.

### Level 2

Answer + code + caveat.

### Level 3

Answer + code + source.

### Level 4

Full explanation.

Default should be **Level 1 or 2**.

---

# 71. Don't build your own LLM into the MCP initially

I would avoid:

```text
MCP
→ LLM
→ docs
→ LLM
→ answer
```

for V1.

That adds:

```text
latency
cost
complexity
another source of hallucination
```

Instead:

```text
MCP
→ retrieval
→ deterministic processing
→ structured context
→ coding agent
```

Let Claude/Gemini/etc. do the final natural-language reasoning.

---

# 72. Optional local LLM later

A later version could use a small local model only for:

```text
query classification
reranking
summary compression
```

Not for final technical truth.

Official documentation should remain the authority.

---

# 73. Security

Because coding agents will connect to this, security matters.

The MCP should be **read-only by default**.

It should not:

```text
modify project files
run arbitrary commands
execute npm scripts
install dependencies
```

unless you explicitly add those features later.

The first version should only:

```text
read
inspect
search
analyze
recommend
```

---

# 74. Local filesystem policy

For `frontend_context`:

allow reading:

```text
package.json
lockfiles
tsconfig
vite config
next config
tailwind config
eslint config
```

Do not recursively read:

```text
.env
.env.*
secrets
SSH keys
credentials
```

And avoid sending source code to any external service.

---

# 75. Privacy architecture

Local mode should be capable of operating entirely offline after documentation sync:

```text
Agent
  ↓
FrontLens
  ↓
local SQLite
  ↓
local docs
```

That would be a major selling point.

You could eventually ship:

```text
frontlens-mcp
```

and a prebuilt documentation database.

---

# 76. Distribution model

Offer three modes:

### Local

```bash
npx frontlens-mcp
```

Uses local docs database.

### Managed

```text
remote FrontLens server
```

Useful for teams.

### Hybrid

```text
local project analysis
+
remote docs updates
```

This is probably the best long-term model.

---

# 77. CLI

Create:

```bash
frontlens
```

Commands:

```bash
frontlens init
frontlens sync
frontlens search "useEffectEvent"
frontlens api react-dom.render
frontlens inspect
frontlens check
frontlens upgrade
frontlens doctor
```

This is useful even outside MCP.

---

# 78. `frontlens doctor`

Very useful for debugging the tool itself.

Example:

```text
FrontLens Doctor

✓ MCP server
✓ SQLite index
✓ React docs
✓ Vite docs
✓ Tailwind docs
✓ TypeScript docs
✓ Next.js docs

Versions:
React        19.2.8
Vite         8.2.2
Tailwind     4.3.3
TypeScript   7.0.2
Next.js      16.3.4

Index:
Documents    8,492
Chunks       31,281
APIs         4,812
Examples     9,230
```

---

# 79. Automated documentation updater

Run:

```text
daily
```

or:

```text
on server startup
```

depending on deployment.

Do:

```text
HEAD/ETag
Last-Modified
content hash
```

before downloading entire documents.

That keeps bandwidth low.

---

# 80. Test suite

You need more than normal unit tests.

## A. Version tests

```text
React 18
React 19
React 19.2
```

verify API status.

## B. Retrieval tests

Queries such as:

```text
create react app with Vite
tailwind with Vite
useEffectEvent
Next App Router metadata
TypeScript moduleResolution
```

## C. Regression tests

Every sync should verify:

```text
known query → expected source
known deprecated API → expected replacement
```

---

# 81. Golden test dataset

Create 100–300 benchmark queries.

Example:

```text
1. How do I create a React root?
2. Is ReactDOM.render supported?
3. How do I hydrate React?
4. Add Tailwind to Vite.
5. Configure Tailwind 4.
6. Setup TypeScript strict mode.
7. Configure Next.js metadata.
8. Server component vs client component.
...
```

For each:

```text
expected framework
expected version
expected source
expected status
expected answer class
```

Then benchmark every release.

---

# 82. Retrieval evaluation metrics

Track:

```text
Recall@5
MRR
NDCG
version accuracy
API status accuracy
source authority accuracy
token usage
latency
```

Most importantly:

### Version accuracy

```text
Did FrontLens return the right version's documentation?
```

### Deprecated API accuracy

```text
Did FrontLens identify obsolete code?
```

### Token efficiency

```text
tokens returned / useful answer
```

---

# 83. Recommended performance targets

For local MCP:

```text
project detection: <100 ms
exact API lookup: <20 ms
FTS search: <50 ms
hybrid retrieval: <200 ms
MCP response: <300 ms
```

Docs synchronization can be slower because it happens outside normal agent queries.

---

# 84. MCP tool descriptions matter

Keep tool descriptions extremely concise.

Bad:

```text
This powerful tool allows you to search through all frontend...
```

Good:

```text
Search current frontend documentation using the detected project version.
```

This helps reduce the tool schema/context overhead.

---

# 85. MCP should automatically use project context

Agent should not need to say:

```text
React 19.2
Vite 8
Tailwind 4
```

every time.

The MCP detects it.

Query:

```text
"How should I configure Tailwind?"
```

automatically becomes:

```text
Tailwind 4
Vite 8
React project
```

---

# 86. Agent-facing response should be deterministic

Use predictable fields:

```json
{
  "project": {},
  "answer": "",
  "code": [],
  "warnings": [],
  "sources": []
}
```

The actual returned MCP content can be rendered as compact Markdown, but internally keep structured data.

---

# 87. Source citations

For technical correctness, include source identifiers.

Example:

```text
source_id:
react:reference:react-dom/client/createRoot
```

Then optionally:

```text
url:
https://react.dev/reference/react-dom/client/createRoot
```

This enables debugging and source auditing.

---

# 88. Documentation conflict resolver

Suppose:

```text
README says one thing
docs say another
```

Priority:

```text
version-specific official reference
>
official migration guide
>
official release note
>
official README
>
community
```

And log conflicts internally.

---

# 89. Version inference beyond package.json

Some projects don't pin everything.

Use:

```text
package.json
lockfile
node_modules/package.json
npm metadata
framework config
source APIs
```

For example, code using a feature introduced in React 19 can be a signal that the project is likely React 19, although this should be treated as secondary evidence.

---

# 90. Monorepo support

Definitely include this in architecture.

Support:

```text
npm workspaces
pnpm workspaces
yarn workspaces
Turborepo
Nx
```

A monorepo may contain:

```text
apps/web → Next 16
apps/admin → Vite React
packages/ui → React
```

FrontLens should identify the **workspace nearest to the file being edited**, not assume one project-wide version.

This becomes extremely important for coding agents.

---

# 91. File-aware context

The MCP could accept:

```json
{
  "file": "apps/admin/src/components/UserTable.tsx"
}
```

Then determine:

```text
workspace
framework
versions
tsconfig
aliases
conventions
```

This gives dramatically better answers.

---

# 92. Context hierarchy

Use:

```text
file
↓
package/workspace
↓
monorepo
↓
ecosystem
```

Not:

```text
entire repository
```

---

# 93. A highly useful future tool: `verify_change`

This would inspect a proposed code change and answer:

```text
Does this follow the project's current frontend stack?

✓ React API valid
✓ TypeScript API valid
✓ Tailwind syntax valid
⚠ Next.js server/client boundary
⚠ deprecated API
```

This could become one of the strongest features of the project.

---

# 94. Another future feature: generated implementation snippets

The MCP could expose:

```text
frontend_search
```

and internally return:

```text
recommended pattern:
...
```

But the agent still writes the code.

This keeps FrontLens focused on **knowledge verification**, not code execution.

---

# 95. What V1 should actually contain

Do not build everything above in the first release.

I'd define:

# FrontLens MCP V1

### Ecosystems

```text
React
React DOM
Vite
Tailwind CSS
TypeScript
Next.js
```

### Capabilities

```text
✓ project detection
✓ package version detection
✓ official docs ingestion
✓ version-aware search
✓ API registry
✓ deprecated/removed API detection
✓ migration recommendations
✓ compact retrieval
✓ best-practice retrieval
✓ code example extraction
✓ SQLite FTS5
✓ optional semantic reranking
✓ local stdio MCP
✓ remote HTTP MCP
✓ CLI
```

That is already an excellent project.

---

# 96. V2

Add:

```text
✓ AST code inspection
✓ Tailwind class analyzer
✓ TypeScript compiler option analyzer
✓ upgrade checker
✓ monorepo intelligence
✓ code verification
✓ automated migration detection
✓ workspace rules
```

---

# 97. V3

Then:

```text
✓ React Router
✓ TanStack
✓ shadcn/ui
✓ Radix
✓ Vitest
✓ Playwright
✓ ESLint
✓ Storybook
✓ Astro
✓ Vue
✓ Svelte
```

At that point it becomes a general frontend engineering intelligence platform.

---

# 98. Implementation phases

## Phase 1 — Foundation

Build:

```text
TypeScript monorepo
MCP server
CLI
SQLite database
configuration system
logging
```

Deliverable:

```bash
frontlens-mcp
```

runs successfully.

---

## Phase 2 — Project detector

Implement:

```text
package.json parser
lockfile parser
workspace resolver
framework detector
version resolver
```

Deliverable:

```bash
frontlens inspect
```

Example:

```text
React 19.2.8
Vite 8.2.2
Tailwind 4.3.3
TypeScript 7.0.2
```

---

## Phase 3 — Documentation ingestion

Implement:

```text
source registry
fetcher
HTML parser
Markdown parser
llms.txt parser
chunker
metadata extractor
```

Start with your five official sources.

---

## Phase 4 — Search engine

Implement:

```text
SQLite FTS5
metadata filters
version filters
ranking
deduplication
```

Then add optional embeddings.

---

## Phase 5 — API intelligence

Build:

```text
API database
status lifecycle
version ranges
deprecations
removals
replacement mapping
migration mapping
```

This is the core differentiator.

---

## Phase 6 — MCP tools

Implement:

```text
frontend_context
frontend_search
check_api
migration
recommend
```

Only after that should you consider more tools.

---

## Phase 7 — Token optimization

Implement:

```text
budget
compression
result limits
response templates
cache
duplicate elimination
```

Measure actual token savings.

---

## Phase 8 — AST inspection

Add:

```text
TSX parser
API usage detector
deprecated usage detector
config analyzer
```

---

## Phase 9 — Automated syncing

Implement:

```text
frontlens sync
```

with:

```text
hash detection
incremental updates
version discovery
reindexing
regression tests
```

---

## Phase 10 — Agent integration

Test against:

```text
Claude Code
Antigravity
other MCP-capable coding agents
```

Antigravity explicitly supports MCP and lets users install/configure custom MCP servers; Claude Code exposes MCP configuration through its CLI. ([antigravity.google][14])

---

# 99. Claude Code configuration target

Your documentation should eventually include something like:

```json
{
  "mcpServers": {
    "frontlens": {
      "command": "npx",
      "args": ["-y", "frontlens-mcp"]
    }
  }
}
```

For production/self-hosted remote deployment, document the HTTP endpoint separately.

---

# 100. Antigravity configuration target

Antigravity supports local MCP servers and remote configurations; its current documentation describes both workspace/global MCP configuration and Streamable HTTP remote connections. ([antigravity.google][14])

So your documentation should provide:

```text
stdio installation
```

and:

```text
remote Streamable HTTP installation
```

as first-class methods.

---

# 101. Configuration file

Use:

```text
~/.frontlens/config.json
```

Example:

```json
{
  "mode": "local",
  "database": "~/.frontlens/index.db",
  "sources": ["react", "vite", "tailwind", "typescript", "next"],
  "semanticSearch": false,
  "maxResults": 5,
  "defaultBudget": "small"
}
```

Project override:

```text
.frontlens.json
```

---

# 102. Source configuration

Each source should define:

```typescript
interface DocumentationSource {
  id: string;
  package: string;

  urls: string[];

  versionStrategy: "major" | "minor" | "release" | "latest";

  parser: string;

  apiExtraction: boolean;

  migrationExtraction: boolean;

  authority: "official";

  updateInterval: number;
}
```

---

# 103. A particularly important design choice

Do not force all documentation into the same version model.

Examples:

### React

Official docs are primarily organized around current major versions rather than every patch/minor version; the React site currently documents 19.2 and archives previous majors. ([React][10])

### Vite

Has a more active release/support structure. ([vitejs][11])

### Next.js

Has explicit version upgrade guides. ([Next.js][16])

### TypeScript

Has version-specific release notes and compiler behavior changes. ([typescriptlang.org][7])

Therefore your ingestion architecture must support **ecosystem-specific version strategies**.

---

# 104. Don't make the MCP version database purely manual

You want automatic discovery plus human curation.

Pipeline:

```text
Automatic discovery
       ↓
Candidate API changes
       ↓
Validation against official docs
       ↓
Structured registry
       ↓
Regression test
       ↓
Publish
```

For the most important APIs, manually curated mappings can coexist with automatically extracted data.

---

# 105. Human-curated “rules of thumb”

Create:

```text
rules/
  react/
  next/
  vite/
  tailwind/
  typescript/
```

Example:

```yaml
- id: react-render-removed
  match:
    package: react-dom
    symbol: render
    version: ">=19"
  status: removed
  replacement: createRoot
  authority: official
```

These rules act as a protective layer even when docs parsing fails.

---

# 106. Fail-safe behavior

This is essential.

When the MCP cannot verify something:

**Do not guess.**

Return:

```text
Version could not be verified.

Detected:
React ^19.2
Lockfile unavailable.

I found matching documentation for React 19,
but cannot guarantee the exact patch behavior.
```

That is far safer than fabricating an answer.

---

# 107. Confidence scoring

Every answer can have:

```text
confidence:
0.98
```

Internally derived from:

```text
exact version
official documentation
exact API match
freshness
```

Not required in every user-visible response, but useful for system behavior.

---

# 108. Observability

Log:

```text
query
detected project
selected version
documents retrieved
ranking scores
tokens returned
latency
cache hit
```

But sanitize:

```text
source code
.env
credentials
tokens
private URLs
```

---

# 109. Metrics dashboard later

Eventually you can track:

```text
Queries/day
Most searched frameworks
Most common deprecated APIs
Most common migrations
Average context size
Token savings
Average latency
Cache hit ratio
```

This can guide which knowledge areas to prioritize.

---

# 110. Your strongest unique selling points

FrontLens should be positioned around **four things**:

### 1. Version aware

> Knows what version your project actually uses.

### 2. Deprecation aware

> Stops agents from generating APIs that no longer belong in the current stack.

### 3. Official-source first

> Uses current framework documentation instead of relying on model memory.

### 4. Token efficient

> Returns only the smallest useful context.

That's much stronger than:

> “MCP that searches React documentation.”

---

# 111. The actual product statement

I'd define the product as:

> **FrontLens is a version-aware frontend engineering MCP for coding agents. It detects the project's TypeScript frontend stack, searches authoritative documentation, verifies APIs against installed versions, identifies deprecated and removed patterns, and returns compact implementation guidance optimized for agent context.**

That is clear and differentiated.

---

# 112. Final architecture

The complete system should eventually look like:

```text
                       Coding Agent
                ┌─────────────────────────┐
                │ Claude Code              │
                │ Antigravity              │
                │ Other MCP Clients        │
                └────────────┬────────────┘
                             │
                             ▼
                  ┌───────────────────────┐
                  │    FrontLens MCP      │
                  ├───────────────────────┤
                  │ MCP Interface         │
                  │ Query Classifier      │
                  │ Project Resolver      │
                  │ Version Resolver      │
                  │ Search Engine         │
                  │ API Intelligence      │
                  │ Migration Engine      │
                  │ Best Practices        │
                  │ Code Analyzer         │
                  │ Token Optimizer       │
                  └───────────┬───────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
      Project Context     Knowledge DB     Version Registry
            │                 │                 │
            ▼                 ▼                 ▼
       package.json       Docs chunks         APIs
       lockfiles          examples            deprecated
       configs            best practices      removed
       source             migrations          replacements
            │                 │                 │
            └─────────────────┼─────────────────┘
                              ▼
                       Ranked Context
                              │
                              ▼
                       Token Compressor
                              │
                              ▼
                        Agent Response
```

---

# 113. Recommended first milestone

I would **not** start by building the entire ecosystem.

Build this exact MVP:

```text
FrontLens MCP v0.1

React 19.x
Vite 8.x
Tailwind 4.x
TypeScript 7.x
Next.js 16.x

↓

Project detection

↓

Official documentation sync

↓

SQLite FTS5

↓

Version-aware search

↓

API lifecycle registry

↓

Deprecated/removed API detector

↓

5 MCP tools:

frontend_context
frontend_search
check_api
migration
recommend
```

Then benchmark it against Claude Code and Antigravity using 100 real frontend questions.

That will tell you whether the core idea works before you invest in AST analysis, embeddings, dozens of frameworks, or a hosted service.

The timing is particularly good because the ecosystem has already reached the kind of churn your idea is designed to address: React 19.2 has newer APIs and removed legacy React DOM APIs; Tailwind 4 has substantially different Vite integration; Vite 8 changed its build architecture around Rolldown; Next.js has moved through multiple major-version upgrade paths; and TypeScript 6/7 are introducing meaningful compiler-option and architecture changes. ([React][12])

## My final recommendation

**Name:** `FrontLens`
**Package:** `frontlens-mcp`
**Positioning:** **Version-aware frontend intelligence for coding agents.**

The key idea should be:

> **Don't make the agent remember modern frontend development. Let the MCP verify it.**

That is the part that makes this project genuinely useful rather than just another documentation-search MCP.

[1]: https://www.npmjs.com/package/react?activeTab=versions&utm_source=chatgpt.com "react - npm"
[2]: https://www.npmjs.com/package/vite?utm_source=chatgpt.com "vite - npm"
[3]: https://react.dev/reference/react-dom?utm_source=chatgpt.com "React DOM APIs – React"
[4]: https://tailwindcss.com/docs/installation/using-vite?rewritestatus=3&utm_source=chatgpt.com "Installing Tailwind CSS with Vite - Tailwind CSS"
[5]: https://nextjs.org/docs?utm_source=chatgpt.com "Next.js Docs | Next.js"
[6]: https://vite.dev/guide/?utm_source=chatgpt.com "Getting Started | Vite"
[7]: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html?utm_source=chatgpt.com "TypeScript: Documentation - TypeScript 6.0"
[8]: https://www.npmjs.com/package/typescript?utm_source=chatgpt.com "typescript - npm"
[9]: https://modelcontextprotocol.io/specification/2025-03-26/server?utm_source=chatgpt.com "Overview - Model Context Protocol"
[10]: https://react.dev/versions?utm_source=chatgpt.com "React Versions – React"
[11]: https://vite.dev/releases?utm_source=chatgpt.com "Releases | Vite"
[12]: https://react.dev/blog/2025/10/01/react-19-2?utm_source=chatgpt.com "React 19.2 – React"
[13]: https://react.dev/reference/react/useEffectEvent?utm_source=chatgpt.com "useEffectEvent – React"
[14]: https://antigravity.google/docs/mcp?utm_source=chatgpt.com "MCP | Google Antigravity Docs"
[15]: https://docs.anthropic.com/en/docs/claude-code/cli-usage?utm_source=chatgpt.com "CLI reference - Anthropic"
[16]: https://nextjs.org/docs/app/getting-started/upgrading?utm_source=chatgpt.com "Getting Started: Upgrading | Next.js"
