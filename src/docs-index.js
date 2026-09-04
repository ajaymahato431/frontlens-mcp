/**
 * Documentation index and resolver for frontlens-mcp.
 *
 * Two layers, deliberately:
 *
 * - The **live index** comes from `src/frameworks/`, which reads the official
 *   navigation of react.dev, nextjs.org, vite.dev, tailwindcss.com and the
 *   TypeScript handbook — around a thousand pages, fetched on demand and cached.
 *
 * - The **bundled pages** below are a small curated set covering what agents ask
 *   most (React 19 removals, Tailwind v4 setup, Next.js async APIs). They answer
 *   instantly, they survive an upstream outage, and they are the reason this
 *   server still works with no network at all.
 *
 * Bundled pages keep their own paths, so they supplement the live index rather
 * than shadowing it.
 */

import { extractSection, renderOutline, estimateTokens } from "./core/markdown.js";
import { searchEntries } from "./core/search.js";
import { cleanPageFor, loadIndex } from "./frameworks/index.js";

export const BUNDLED_ENTRIES = [
  // ─── React ─────────────────────────────────────────────────────────────────
  {
    path: "react/upgrade-react-19",
    framework: "react",
    title: "React 19 Upgrade Guide and Removed APIs",
    category: "Upgrades",
    summary:
      "Official guide to upgrading to React 19: removals of ReactDOM.render, hydrate, and forwardRef, " +
      "introduction of Actions, useActionState, and ref as prop.",
    remoteUrl: "https://raw.githubusercontent.com/reactjs/react.dev/main/src/content/blog/2024/04/25/react-19-upgrade-guide.md",
    bundledContent: `# React 19 Upgrade Guide

React 19 introduces Actions, Server Functions, asset loading, and document metadata support.

## Removed Legacy APIs
- **ReactDOM.render**: Removed. Use \`createRoot\` from \`react-dom/client\`.
- **ReactDOM.hydrate**: Removed. Use \`hydrateRoot\` from \`react-dom/client\`.
- **ReactDOM.unmountComponentAtNode**: Removed. Use \`root.unmount()\`.
- **defaultProps**: Removed for function components. Use JavaScript default function arguments.
- **forwardRef**: Deprecated. Pass \`ref\` as a regular prop into function components.
- **useFormState**: Deprecated. Replaced by \`useActionState\` in \`react\`.

## Actions and Form Handling
React 19 makes handling asynchronous transitions and form submissions first-class:
- \`useActionState\`: Accepts an action function and returns \`[state, formAction, isPending]\`.
- \`useFormStatus\`: Reads the pending and submission state of a parent \`<form>\`.
- \`useOptimistic\`: Renders optimistic UI updates while an async action is processed.

## Ref as a Prop
Function components can now receive \`ref\` as a standard prop:
\`\`\`tsx
function MyInput({ ref, label }: { ref?: React.Ref<HTMLInputElement>; label: string }) {
  return <input ref={ref} aria-label={label} />;
}
\`\`\`

## React Compiler
React 19 is built to work with the React Compiler, which automatically memoizes component renders and hook dependencies.
`,
  },
  {
    path: "react/hooks-use-action-state",
    framework: "react",
    title: "useActionState Hook Reference",
    category: "Hooks",
    summary: "Complete reference for React 19 useActionState hook, action functions, and pending states.",
    remoteUrl: "https://raw.githubusercontent.com/reactjs/react.dev/main/src/content/reference/react/useActionState.md",
    bundledContent: `# useActionState Reference

\`useActionState\` is a React hook that updates state based on the result of a form action.

## Signature
\`\`\`tsx
const [state, formAction, isPending] = useActionState(fn, initialState, permalink?);
\`\`\`

## Parameters
- \`fn\`: The action function called when the form is submitted. Receives \`(previousState, formData)\`.
- \`initialState\`: The value you want the state to be initially.
- \`permalink\`: Optional URL string for progressive enhancement.

## Returns
- \`state\`: The current state returned by the action.
- \`formAction\`: A function you pass to a \`<form action={formAction}>\` or \`<button formAction={formAction}>\`.
- \`isPending\`: A boolean indicating whether the action is currently in flight.

## Example
\`\`\`tsx
import { useActionState } from "react";

async function updateName(prevState: string, formData: FormData) {
  const name = formData.get("name") as string;
  await saveToDatabase(name);
  return name;
}

export function NameForm() {
  const [name, formAction, isPending] = useActionState(updateName, "Anonymous");

  return (
    <form action={formAction}>
      <input name="name" defaultValue={name} />
      <button disabled={isPending}>{isPending ? "Saving..." : "Update"}</button>
    </form>
  );
}
\`\`\`
`,
  },
  {
    path: "react/server-components",
    framework: "react",
    title: "React Server Components Fundamentals",
    category: "Architecture",
    summary: "Architecture and patterns for React Server Components (RSC) and Client Component boundaries.",
    bundledContent: `# React Server Components

Server Components render exclusively on the server with zero client bundle overhead.

## Core Rules
- Server Components cannot use browser APIs (\`window\`, \`localStorage\`) or React state/effects (\`useState\`, \`useEffect\`).
- Mark Client Components with \`"use client"\` at the top of the file.
- Client Components can accept Server Components as \`children\` props.

## Boundary Composition Pattern
\`\`\`tsx
// ClientWrapper.tsx
"use client";
export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div><button onClick={() => setOpen(!open)}>Toggle</button>{open && children}</div>;
}

// ServerPage.tsx (Server Component)
export default async function ServerPage() {
  const data = await fetchDatabaseData();
  return (
    <ClientWrapper>
      <DataDisplay data={data} />
    </ClientWrapper>
  );
}
\`\`\`
`,
  },

  // ─── Tailwind CSS ──────────────────────────────────────────────────────────
  {
    path: "tailwind/installation-vite",
    framework: "tailwind",
    title: "Tailwind CSS v4 with Vite Setup",
    category: "Installation",
    summary: "Setting up Tailwind CSS v4 in a Vite project using @tailwindcss/vite.",
    bundledContent: `# Installing Tailwind CSS v4 with Vite

Tailwind CSS v4 features a dedicated Vite plugin for fast build times and zero configuration overhead.

## Step 1: Install Tailwind and Plugin
\`\`\`bash
npm install tailwindcss @tailwindcss/vite
\`\`\`

## Step 2: Configure Vite
Add \`@tailwindcss/vite\` to your \`vite.config.ts\`:
\`\`\`ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
\`\`\`

## Step 3: Import in CSS
Replace any existing \`@tailwind\` lines with a single import in your main CSS file (e.g. \`src/index.css\`):
\`\`\`css
@import "tailwindcss";
\`\`\`

No \`tailwind.config.js\` or PostCSS config is needed.
`,
  },
  {
    path: "tailwind/theme-configuration",
    framework: "tailwind",
    title: "Tailwind CSS v4 @theme and Design Tokens",
    category: "Configuration",
    summary: "Configuring colors, fonts, spacing, and breakpoints directly in CSS using @theme.",
    bundledContent: `# Tailwind CSS v4 Theme Configuration

In Tailwind CSS v4, themes are configured directly in your CSS using \`@theme\` blocks instead of \`tailwind.config.js\`.

## Defining Custom Tokens
\`\`\`css
@import "tailwindcss";

@theme {
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-900: #1e3a8a;

  --font-display: "Outfit", sans-serif;
  --font-body: "Inter", sans-serif;

  --breakpoint-3xl: 120rem;
}
\`\`\`

## Overriding vs Extending
- Inside \`@theme\`, defining variables adds or overrides default values.
- To reset all theme defaults, use \`@theme default\` or define custom sets.

## Using CSS Variables Directly
Tailwind v4 exposes all theme variables in the generated CSS:
\`\`\`tsx
<div className="bg-primary-500 font-display">
  Styled with theme tokens
</div>
\`\`\`
`,
  },
  {
    path: "tailwind/upgrade-guide-v4",
    framework: "tailwind",
    title: "Tailwind CSS v4 Upgrade Guide",
    category: "Upgrades",
    summary: "Upgrading from Tailwind CSS v3 to v4, automated migration CLI, and breaking changes.",
    bundledContent: `# Upgrading to Tailwind CSS v4

## Automated Upgrade Tool
Run the official upgrade codemod to migrate your project automatically:
\`\`\`bash
npx @tailwindcss/upgrade
\`\`\`

## Key Breaking Changes
1. **CSS Import Syntax**:
   - Before: \`@tailwind base; @tailwind components; @tailwind utilities;\`
   - After: \`@import "tailwindcss";\`
2. **Configuration in CSS**:
   - Design tokens migrate from \`tailwind.config.js\` to \`@theme { ... }\` in CSS.
3. **Color Space**:
   - Default palette colors are calibrated in the modern \`oklch()\` color space.
4. **PostCSS Removal**:
   - When using Vite, the \`@tailwindcss/vite\` plugin replaces PostCSS entirely.
`,
  },

  // ─── Next.js ───────────────────────────────────────────────────────────────
  {
    path: "nextjs/app-router-overview",
    framework: "nextjs",
    title: "Next.js App Router Architecture",
    category: "Architecture",
    summary: "Guide to the App Router: layouts, pages, loading states, and error boundaries.",
    bundledContent: `# Next.js App Router Architecture

The App Router operates within the \`app/\` directory and leverages React Server Components.

## Routing Hierarchy
- \`layout.tsx\`: Shared UI across multiple routes. Preserves state and does not re-render on navigation.
- \`page.tsx\`: Unique UI for a specific URL route.
- \`loading.tsx\`: Instant fallback UI rendered with React Suspense while page content streams.
- \`error.tsx\`: Client-side error boundary catching unexpected errors in child trees.
- \`not-found.tsx\`: UI displayed when \`notFound()\` is called.

## Server and Client Component Hierarchy
Pages and layouts are Server Components by default. Include \`"use client"\` only when necessary for interactivity.
`,
  },
  {
    path: "nextjs/data-fetching",
    framework: "nextjs",
    title: "Next.js Data Fetching, Caching, and Server Actions",
    category: "Data Fetching",
    summary: "Server-side data fetching, request memoization, revalidation, and Next.js 15 async APIs.",
    bundledContent: `# Next.js Data Fetching and Caching

## Async Request APIs (Next.js 15+)
Dynamic request APIs return Promises and must be awaited:
\`\`\`tsx
import { cookies, headers } from "next/headers";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  const data = await fetch(\`https://api.example.com/items/\${id}\`, {
    next: { tags: ["item"] },
  });
  const item = await data.json();

  return <div>{item.title}</div>;
}
\`\`\`

## Server Actions and Cache Revalidation
\`\`\`tsx
"use server";
import { revalidateTag } from "next/cache";

export async function updateItem(formData: FormData) {
  const id = formData.get("id");
  await db.update(id);
  revalidateTag("item");
}
\`\`\`
`,
  },

  // ─── Vite ──────────────────────────────────────────────────────────────────
  {
    path: "vite/configuration",
    framework: "vite",
    title: "Vite Configuration and Performance Tuning",
    category: "Configuration",
    summary: "Optimizing Vite configuration, plugin setup, aliases, and production builds.",
    bundledContent: `# Vite Configuration Guide

## Standard Configuration Pattern
\`\`\`ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
});
\`\`\`

## Environment Variables
- Client-facing variables MUST start with \`VITE_\` (e.g. \`VITE_API_KEY\`).
- Accessed in source code via \`import.meta.env.VITE_API_KEY\`.
- Non-prefixed variables are strictly server-side and invisible to the client bundle.
`,
  },

  // ─── TypeScript ────────────────────────────────────────────────────────────
  {
    path: "typescript/tsconfig-modern",
    framework: "typescript",
    title: "Modern tsconfig.json Setup for Frontend Bundlers",
    category: "Configuration",
    summary: "Best practices for configuring TypeScript with Vite, Next.js, and modern ESM.",
    bundledContent: `# Modern TypeScript Configuration

## Recommended tsconfig.json for Bundlers
\`\`\`json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src"]
}
\`\`\`

## Key Modern Flags
- \`"moduleResolution": "bundler"\`: Directs TypeScript to resolve exports packages like modern tools (Vite, Turbopack, Webpack).
- \`"verbatimModuleSyntax": true\`: Enforces clear distinction between type imports (\`import type { ... }\`) and value imports.
- \`"noUncheckedIndexedAccess": true\`: Treats array index access (\`arr[i]\`) as \`T | undefined\` preventing runtime index errors.
`,
  },

  // ─── Additional React ──────────────────────────────────────────────────────
  {
    path: "react/hooks-use-optimistic",
    framework: "react",
    title: "useOptimistic Hook Reference",
    category: "Hooks",
    summary: "React 19 hook for optimistic UI updates while async actions are in flight.",
    bundledContent: `# useOptimistic Reference

\`useOptimistic\` lets you show a different state while an async action is underway.

## Signature
\`\`\`tsx
const [optimisticState, addOptimistic] = useOptimistic(state, updateFn);
\`\`\`

## Parameters
- \`state\`: The value to return initially and whenever no action is pending.
- \`updateFn(currentState, optimisticValue)\`: A pure function that merges the optimistic value.

## Example
\`\`\`tsx
import { useOptimistic } from "react";

function MessageList({ messages, sendMessage }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage) => [...state, { text: newMessage, sending: true }]
  );

  async function formAction(formData) {
    const message = formData.get("message");
    addOptimisticMessage(message);
    await sendMessage(message);
  }

  return (
    <form action={formAction}>
      {optimisticMessages.map((m, i) => (
        <div key={i} style={{ opacity: m.sending ? 0.5 : 1 }}>{m.text}</div>
      ))}
      <input name="message" />
      <button>Send</button>
    </form>
  );
}
\`\`\`
`,
  },
  {
    path: "react/hooks-use",
    framework: "react",
    title: "use() API Reference",
    category: "Hooks",
    summary: "React 19 API to read Promises and Context values conditionally inside components.",
    bundledContent: `# use() API Reference

\`use\` is a React API that lets you read the value of a resource like a Promise or context.

## Reading Promises
\`\`\`tsx
import { use, Suspense } from "react";

function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);
  return <ul>{comments.map(c => <li key={c.id}>{c.text}</li>)}</ul>;
}

// Wrap in Suspense:
<Suspense fallback={<Loading />}>
  <Comments commentsPromise={fetchComments()} />
</Suspense>
\`\`\`

## Reading Context Conditionally
Unlike \`useContext\`, \`use\` can be called inside loops and conditionals:
\`\`\`tsx
function HelpText({ show }) {
  if (show) {
    const theme = use(ThemeContext);
    return <p style={{ color: theme.color }}>Help text</p>;
  }
  return null;
}
\`\`\`
`,
  },

  // ─── Additional Next.js ────────────────────────────────────────────────────
  {
    path: "nextjs/server-actions",
    framework: "nextjs",
    title: "Next.js Server Actions and Mutations",
    category: "Data Fetching",
    summary: "Server Actions for form handling, data mutations, and cache revalidation in App Router.",
    bundledContent: `# Server Actions and Mutations

Server Actions are asynchronous functions that execute on the server. They can be called from Client and Server Components.

## Defining a Server Action
\`\`\`tsx
"use server";

export async function createTodo(formData: FormData) {
  const title = formData.get("title") as string;
  await db.todos.create({ data: { title } });
  revalidatePath("/todos");
}
\`\`\`

## Using in a Form
\`\`\`tsx
import { createTodo } from "@/actions/todos";

export default function TodoForm() {
  return (
    <form action={createTodo}>
      <input name="title" required />
      <button type="submit">Add Todo</button>
    </form>
  );
}
\`\`\`

## With useActionState
\`\`\`tsx
"use client";
import { useActionState } from "react";
import { createTodo } from "@/actions/todos";

export function TodoForm() {
  const [state, formAction, isPending] = useActionState(createTodo, null);
  return (
    <form action={formAction}>
      <input name="title" />
      <button disabled={isPending}>{isPending ? "Adding..." : "Add"}</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
\`\`\`
`,
  },
  {
    path: "nextjs/metadata",
    framework: "nextjs",
    title: "Next.js Metadata API and SEO",
    category: "Configuration",
    summary: "Static and dynamic metadata generation for SEO, Open Graph, and social sharing in App Router.",
    bundledContent: `# Metadata API

## Static Metadata
Export a \`metadata\` object from a \`layout.tsx\` or \`page.tsx\`:
\`\`\`tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Application",
  description: "Built with Next.js",
  openGraph: {
    title: "My Application",
    type: "website",
  },
};
\`\`\`

## Dynamic Metadata
Export an async \`generateMetadata\` function:
\`\`\`tsx
export async function generateMetadata({ params }: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { images: [{ url: post.image }] },
  };
}
\`\`\`

## File-based Metadata
- \`opengraph-image.tsx\` — Dynamic OG image generation
- \`favicon.ico\` / \`icon.tsx\` — App icons
- \`sitemap.ts\` — Dynamic sitemap
- \`robots.ts\` — Dynamic robots.txt
`,
  },
  {
    path: "nextjs/caching",
    framework: "nextjs",
    title: "Next.js Caching and Revalidation",
    category: "Data Fetching",
    summary: "How caching works in Next.js 15+: fetch defaults, revalidateTag, revalidatePath, and React cache().",
    bundledContent: `# Caching in Next.js 15+

## Fetch Defaults Changed
In Next.js 15+, \`fetch()\` defaults to \`cache: 'no-store'\` (uncached). Opt in to caching explicitly:
\`\`\`tsx
const data = await fetch("https://api.example.com/data", {
  cache: "force-cache",
  next: { revalidate: 3600, tags: ["data"] },
});
\`\`\`

## Tag-based Revalidation
\`\`\`tsx
import { revalidateTag } from "next/cache";

export async function updateData() {
  "use server";
  await db.update();
  revalidateTag("data");
}
\`\`\`

## Path-based Revalidation
\`\`\`tsx
import { revalidatePath } from "next/cache";
revalidatePath("/dashboard");
\`\`\`

## React cache() for Request Deduplication
\`\`\`tsx
import { cache } from "react";

export const getUser = cache(async (id: string) => {
  return await db.users.findUnique({ where: { id } });
});
\`\`\`
`,
  },

  // ─── Additional Tailwind ───────────────────────────────────────────────────
  {
    path: "tailwind/dark-mode",
    framework: "tailwind",
    title: "Tailwind CSS v4 Dark Mode",
    category: "Configuration",
    summary: "Configuring dark mode in Tailwind v4 with prefers-color-scheme or class-based toggling.",
    bundledContent: `# Dark Mode in Tailwind CSS v4

## Default: System Preference
By default, \`dark:\` respects \`prefers-color-scheme: dark\`:
\`\`\`html
<div class="bg-white dark:bg-slate-900">
  Adapts to system dark mode automatically
</div>
\`\`\`

## Class-Based Dark Mode
Use \`@custom-variant\` to toggle dark mode via a CSS class:
\`\`\`css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
\`\`\`

Then toggle with JavaScript:
\`\`\`tsx
document.documentElement.classList.toggle("dark");
\`\`\`
`,
  },
  {
    path: "tailwind/custom-utilities",
    framework: "tailwind",
    title: "Tailwind CSS v4 Custom Utilities and Variants",
    category: "Configuration",
    summary: "Registering custom utility classes and variants in CSS with @utility and @variant in v4.",
    bundledContent: `# Custom Utilities and Variants in Tailwind v4

## Custom Utilities with @utility
Register custom utility classes directly in CSS:
\`\`\`css
@utility tab-4 {
  tab-size: 4;
}

@utility content-auto {
  content-visibility: auto;
}
\`\`\`

## Custom Variants with @variant
Register custom variants in CSS:
\`\`\`css
@variant pointer-coarse (@media (pointer: coarse));
@variant hocus (&:hover, &:focus);
\`\`\`

Usage:
\`\`\`html
<button class="hocus:ring-2 pointer-coarse:p-4">Click</button>
\`\`\`

## Content Sources with @source
Add paths for automatic class detection:
\`\`\`css
@source "../node_modules/@my-company/ui/src";
\`\`\`
`,
  },
];

/** Bundled pages carry their content inline, so they need no network to read. */
function withBundledFlag(entry) {
  return { ...entry, bundled: true, sources: entry.remoteUrl ? [entry.remoteUrl] : [] };
}

/**
 * Builds the full catalogue: every live page plus the bundled set.
 *
 * `degraded` names any framework served from the vendored snapshot, so callers
 * can say the index is stale instead of pretending it is current.
 */
export async function loadDocsIndex({ http, ttl } = {}) {
  const { entries, degraded } = await loadIndex({ http, ttl });

  const bundled = BUNDLED_ENTRIES.map(withBundledFlag);
  const seen = new Set(bundled.map((entry) => entry.path));

  const merged = [...bundled];
  for (const entry of entries) {
    if (seen.has(entry.path)) continue;
    seen.add(entry.path);
    merged.push(entry);
  }

  return { entries: merged, degraded };
}

/** `{ framework, count }` rows, in the order the framework registry defines. */
export function groupByFramework(entries) {
  const counts = new Map();
  for (const entry of entries) {
    counts.set(entry.framework, (counts.get(entry.framework) ?? 0) + 1);
  }
  return [...counts.entries()].map(([framework, count]) => ({ framework, count }));
}

/** `{ category, count }` rows within one framework. */
export function groupByCategory(entries) {
  const counts = new Map();
  for (const entry of entries) {
    const category = entry.category || "Uncategorized";
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

/** Searches the catalogue, optionally narrowed to one framework. */
export function searchFrontendDocs(entries, query, { framework, limit = 5 } = {}) {
  const filter = framework && framework !== "all" ? String(framework).toLowerCase().trim() : null;
  const candidates = filter ? entries.filter((e) => e.framework === filter) : entries;
  return searchEntries(candidates, query, { limit });
}

/**
 * Resolves a caller-supplied path to an index entry.
 *
 * Deliberately ordered from certain to speculative: an exact path, then the same
 * path under a framework prefix, then a unique suffix match. A loose substring
 * match is only consulted when it identifies exactly one page — matching "react"
 * against a hundred React pages and silently picking the first is worse than
 * saying the path was ambiguous.
 */
export function resolveDocEntry(entries, requestedPath) {
  const clean = String(requestedPath || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.mdx?$/, "")
    .toLowerCase();

  if (!clean) return null;

  const exact = entries.find((e) => e.path.toLowerCase() === clean);
  if (exact) return exact;

  const suffix = entries.filter((e) => e.path.toLowerCase().endsWith(`/${clean}`));
  if (suffix.length === 1) return suffix[0];
  // Several pages share the trailing segment; prefer the shortest path, which is
  // the least nested and so the most likely to be the one meant.
  if (suffix.length > 1) {
    return [...suffix].sort((a, b) => a.path.length - b.path.length)[0];
  }

  const contains = entries.filter((e) => e.path.toLowerCase().includes(clean));
  if (contains.length === 1) return contains[0];

  return null;
}

/** Suggestions for a path that did not resolve. */
export function suggestPaths(entries, requestedPath, limit = 8) {
  return searchEntries(entries, String(requestedPath || "").replace(/[/-]+/g, " "), { limit });
}

/**
 * Fetches a page's markdown, trying each source in turn.
 *
 * react.dev alone needs two candidates per page — section landing pages live at
 * `<path>/index.md` while ordinary pages live at `<path>.md`, and the navigation
 * does not say which is which.
 */
async function fetchPage(entry, { http, ttl }) {
  const errors = [];

  for (const url of entry.sources ?? []) {
    try {
      const text = await http.fetchText(url, { ttl });
      if (text && text.trim().length > 0) {
        return { text: cleanPageFor(entry.framework, text), url };
      }
    } catch (error) {
      errors.push(error);
    }
  }

  // A 404 on every candidate is the meaningful signal; surface the last error so
  // describeError can turn a status into an actionable hint.
  if (errors.length > 0) throw errors[errors.length - 1];
  return null;
}

/**
 * Reads a documentation page, live where possible and bundled otherwise.
 *
 * A bundled page whose upstream is unreachable still answers — that is the point
 * of bundling it — but the reader says which copy it served so the caller is
 * never misled about freshness.
 */
export async function readDocContent(entry, { section, outline, http, ttl } = {}) {
  let content = null;
  let sourceUrl = null;
  let fetchError = null;

  if (http && (entry.sources?.length ?? 0) > 0) {
    try {
      const fetched = await fetchPage(entry, { http, ttl });
      if (fetched) {
        content = fetched.text;
        sourceUrl = fetched.url;
      }
    } catch (error) {
      fetchError = error;
    }
  }

  if (!content && entry.bundledContent) {
    content = entry.bundledContent;
  }

  if (!content) {
    // Nothing bundled to fall back to, so the fetch failure is the answer.
    throw fetchError ?? new Error(`No content available for ${entry.path}.`);
  }

  const servedFrom = sourceUrl
    ? `Source: ${sourceUrl}`
    : fetchError
      ? `Source: bundled copy (upstream unavailable: ${fetchError.message})`
      : "Source: bundled copy";

  const tokens = estimateTokens(content);
  const header = `${entry.title} (${entry.framework})\n${servedFrom}`;

  if (outline) {
    return {
      title: entry.title,
      path: entry.path,
      output: `# Outline — ${header}\nFull page: ~${tokens} tokens\n\n${renderOutline(content)}`,
    };
  }

  if (section) {
    const extracted = extractSection(content, section);
    if (extracted) {
      return {
        title: entry.title,
        path: entry.path,
        output:
          `# ${entry.title} > ${section}\n${servedFrom}\n` +
          `~${estimateTokens(extracted)} tokens\n\n${extracted}`,
      };
    }

    // Returning the whole page would be the opposite of what was asked; the
    // outline lets the caller retry precisely and cheaply.
    return {
      title: entry.title,
      path: entry.path,
      output:
        `Section "${section}" was not found on ${entry.path}. Available headings:\n\n` +
        `${renderOutline(content)}\n\n` +
        `Re-read with one of these, or omit "section" for the full page.`,
    };
  }

  return {
    title: entry.title,
    path: entry.path,
    output: `# ${header}\n\n${content}\n\n---\n~${tokens} tokens`,
  };
}
