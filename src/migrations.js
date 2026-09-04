/**
 * Migration guides and upgrade instructions for frontlens-mcp.
 *
 * Provides step-by-step upgrade intelligence, breaking changes checklists,
 * codemod commands, and configuration diffs for major frontend transitions.
 */

export const MIGRATIONS = [
  // ─── Tailwind CSS v3 → v4 ──────────────────────────────────────────────────
  {
    framework: "tailwind",
    from: "3",
    to: "4",
    title: "Migrating from Tailwind CSS v3 to v4",
    summary:
      "Tailwind CSS v4 is a ground-up rewrite using CSS-first configuration, " +
      "native CSS cascade layers, and the high-performance Lightning CSS engine. " +
      "JavaScript configuration files are replaced with @theme blocks in CSS.",
    codemod: "npx @tailwindcss/upgrade",
    steps: [
      {
        title: "1. Update dependencies",
        details:
          "Install tailwindcss v4 and the appropriate bundler plugin (e.g. `@tailwindcss/vite` for Vite or `@tailwindcss/postcss` for PostCSS).",
        code: `npm install tailwindcss@next @tailwindcss/vite`,
      },
      {
        title: "2. Replace @tailwind directives with @import",
        details:
          "In your main CSS entry point, replace `@tailwind base;`, `@tailwind components;`, and `@tailwind utilities;` with a single `@import` statement.",
        code: `/* Before (v3): */\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n/* After (v4): */\n@import "tailwindcss";`,
      },
      {
        title: "3. Convert tailwind.config.js to @theme in CSS",
        details:
          "Tailwind v4 moves theme extensions directly into CSS using the `@theme` directive.",
        code: `/* In your CSS: */\n@import "tailwindcss";\n\n@theme {\n  --color-primary: #3b82f6;\n  --color-brand-dark: #0f172a;\n  --font-sans: "Inter", sans-serif;\n}`,
      },
      {
        title: "4. Configure Vite or build tool",
        details:
          "If using Vite, add `@tailwindcss/vite` directly to your `vite.config.ts`. You can remove `postcss.config.js` and `autoprefixer` if they were only used for Tailwind.",
        code: `// vite.config.ts\nimport { defineConfig } from "vite";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({\n  plugins: [tailwindcss()],\n});`,
      },
    ],
    breakingChanges: [
      "`@tailwind base; @tailwind components; @tailwind utilities;` removed; use `@import 'tailwindcss';`.",
      "`tailwind.config.js` is no longer loaded by default. Run `npx @tailwindcss/upgrade` to migrate tokens into CSS.",
      "PostCSS is no longer required when using the official Vite plugin.",
      "Colors now use modern CSS `oklch()` color space by default.",
      "`@apply` cannot be used with complex selector modifiers without proper CSS nesting.",
    ],
    officialUrl: "https://tailwindcss.com/docs/upgrade-guide",
  },

  // ─── React 18 → 19 ─────────────────────────────────────────────────────────
  {
    framework: "react",
    from: "18",
    to: "19",
    title: "Migrating from React 18 to React 19",
    summary:
      "React 19 introduces Actions, Server Functions, document metadata hoisting, " +
      "asset loading hooks, and removes legacy APIs like ReactDOM.render and forwardRef.",
    codemod: "npx codemod@latest react/19/migration-recipe",
    steps: [
      {
        title: "1. Update packages",
        details: "Install React 19 and React DOM 19, plus updated TypeScript types.",
        code: `npm install react@^19.0.0 react-dom@^19.0.0\nnpm install --save-dev @types/react@^19.0.0 @types/react-dom@^19.0.0`,
      },
      {
        title: "2. Verify root rendering",
        details:
          "If your project still used legacy `ReactDOM.render` or `hydrate`, switch to `createRoot` or `hydrateRoot` from `react-dom/client`.",
        code: `// index.tsx\nimport { createRoot } from "react-dom/client";\nimport App from "./App";\n\nconst root = createRoot(document.getElementById("root")!);\nroot.render(<App />);`,
      },
      {
        title: "3. Refactor forwardRef to prop",
        details:
          "Function components now accept `ref` directly as a regular prop. `forwardRef` is deprecated.",
        code: `// Before:\nconst Input = forwardRef((props, ref) => <input {...props} ref={ref} />);\n\n// React 19:\nfunction Input({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> } & React.ComponentProps<"input">) {\n  return <input {...props} ref={ref} />;\n}`,
      },
      {
        title: "4. Adopt useActionState for form handling",
        details:
          "Replace `useFormState` with `useActionState` and leverage the third `isPending` return value.",
        code: `import { useActionState } from "react";\n\nconst [state, formAction, isPending] = useActionState(async (previousState, formData) => {\n  const result = await saveItem(formData);\n  return result;\n}, initialValue);`,
      },
      {
        title: "5. Remove defaultProps on function components",
        details: "Replace `defaultProps` with ES6 default function parameters.",
        code: `// React 19:\nfunction Card({ title = "Default Title", children }: CardProps) {\n  return <div className="card"><h2>{title}</h2>{children}</div>;\n}`,
      },
    ],
    breakingChanges: [
      "`ReactDOM.render` and `ReactDOM.hydrate` removed.",
      "`ReactDOM.unmountComponentAtNode` removed (use `root.unmount()`).",
      "`defaultProps` removed for function components.",
      "`forwardRef` deprecated in favor of `ref` prop.",
      "`useFormState` deprecated in favor of `useActionState`.",
      "`findDOMNode` removed.",
      "TypeScript types: `React.FC` no longer provides implicit `children`.",
    ],
    officialUrl: "https://react.dev/blog/2024/04/25/react-19-upgrade-guide",
  },

  // ─── Next.js 14 → 15/16 ────────────────────────────────────────────────────
  {
    framework: "nextjs",
    from: "14",
    to: "15",
    title: "Migrating from Next.js 14 to Next.js 15/16",
    summary:
      "Next.js 15 brings React 19 support, asynchronous request APIs (`cookies()`, `headers()`, " +
      "`params`), uncached `fetch` by default, and Turbopack as the stable bundler for dev.",
    codemod: "npx @next/codemod@canary upgrade latest",
    steps: [
      {
        title: "1. Run automated codemods",
        details: "Next.js provides an official codemod to handle most async API migrations automatically.",
        code: `npx @next/codemod@canary next-async-request-api .`,
      },
      {
        title: "2. Await cookies() and headers()",
        details:
          "In Next.js 15+, request-bound APIs are asynchronous and must be awaited.",
        code: `// In Server Components / Actions / Route Handlers:\nimport { cookies, headers } from "next/headers";\n\nexport default async function Page() {\n  const cookieStore = await cookies();\n  const token = cookieStore.get("token");\n\n  const headersList = await headers();\n  const userAgent = headersList.get("user-agent");\n}`,
      },
      {
        title: "3. Await Page and Layout props (params, searchParams)",
        details:
          "`params` and `searchParams` passed to Server Components are now Promises.",
        code: `interface PageProps {\n  params: Promise<{ id: string }>;\n  searchParams: Promise<{ query?: string }>;\n}\n\nexport default async function Page({ params, searchParams }: PageProps) {\n  const { id } = await params;\n  const { query } = await searchParams;\n  return <div>Item {id}: {query}</div>;\n}`,
      },
      {
        title: "4. Review fetch caching semantics",
        details:
          "In Next.js 15, `fetch()` requests default to `cache: 'no-store'` (uncached) instead of `force-cache`. Add `{ cache: 'force-cache' }` if static caching is desired.",
        code: `// To preserve caching in Next.js 15:\nconst data = await fetch("https://api.example.com/data", {\n  cache: "force-cache",\n  next: { revalidate: 3600 },\n});`,
      },
    ],
    breakingChanges: [
      "`cookies()`, `headers()`, and `draftMode()` return Promises.",
      "`params` and `searchParams` props in Pages and Layouts are Promises.",
      "`fetch` requests are no longer cached by default (`cache: 'no-store'`).",
      "`Route Handlers` GET requests are no longer cached by default.",
      "React 19 peer dependency requirements.",
    ],
    officialUrl: "https://nextjs.org/docs/app/building-your-application/upgrading/version-15",
  },

  // ─── Vite 5 → 6 ─────────────────────────────────────────────────────────
  {
    framework: "vite",
    from: "5",
    to: "6",
    title: "Migrating from Vite 5 to Vite 6",
    summary:
      "Vite 6 introduces the Environment API for multi-environment builds, " +
      "requires Node.js 18+, changes default `resolve.conditions`, " +
      "and stabilizes several experimental features.",
    codemod: null,
    steps: [
      {
        title: "1. Update Vite and plugins",
        details:
          "Install Vite 6 and update all official plugins (`@vitejs/plugin-react`, `@tailwindcss/vite`, etc.).",
        code: `npm install vite@^6 @vitejs/plugin-react@latest`,
      },
      {
        title: "2. Ensure Node.js 18+",
        details:
          "Vite 6 drops support for Node.js 16 and 17. Verify your CI and local environments run Node.js 18+.",
        code: `node --version  # Must be >= 18.0.0`,
      },
      {
        title: "3. Adopt Environment API (if framework author)",
        details:
          "The new Environment API allows defining separate environments (client, SSR, edge) with independent configs. " +
          "This is primarily for framework authors; app developers get the benefits automatically.",
        code: `// vite.config.ts\nimport { defineConfig } from "vite";\n\nexport default defineConfig({\n  environments: {\n    client: { /* client build options */ },\n    ssr: { resolve: { conditions: ["node"] } },\n  },\n});`,
      },
      {
        title: "4. Review resolve.conditions changes",
        details:
          "The default `resolve.conditions` no longer includes `module`. If a dependency relies on the `module` condition, add it explicitly.",
        code: `// vite.config.ts\nexport default defineConfig({\n  resolve: {\n    conditions: ["module"],\n  },\n});`,
      },
    ],
    breakingChanges: [
      "Node.js 18+ required (dropped Node 16/17).",
      "Default `resolve.conditions` changed — `module` condition no longer included by default.",
      "CSS `@import` in SSR mode now uses ESM loader semantics.",
      "`this.environment` in plugins replaces `this.ssr` boolean.",
    ],
    officialUrl: "https://vite.dev/guide/migration.html",
  },

  // ─── TypeScript 5.4 → 5.8 ─────────────────────────────────────────────────
  {
    framework: "typescript",
    from: "5",
    to: "5.8",
    title: "Upgrading TypeScript to 5.8",
    summary:
      "TypeScript 5.5–5.8 introduces inferred type predicates, " +
      "`--isolatedDeclarations` for parallel .d.ts emit, `--erasableSyntaxOnly` mode, " +
      "and native support for `require()` of ESM in Node.js.",
    codemod: null,
    steps: [
      {
        title: "1. Update TypeScript",
        details: "Install the latest TypeScript 5.8 release.",
        code: `npm install typescript@~5.8`,
      },
      {
        title: "2. Consider --isolatedDeclarations",
        details:
          "Enables parallel declaration emit without full type-checking. Requires explicit return types on exported functions.",
        code: `{\n  "compilerOptions": {\n    "isolatedDeclarations": true,\n    "declaration": true\n  }\n}`,
      },
      {
        title: "3. Review --erasableSyntaxOnly",
        details:
          "When set, TypeScript errors on syntax that cannot be erased by simply removing types (enums, parameter properties, namespaces). " +
          "This ensures compatibility with Node.js `--experimental-strip-types`.",
        code: `{\n  "compilerOptions": {\n    "erasableSyntaxOnly": true\n  }\n}`,
      },
      {
        title: "4. Leverage inferred type predicates (TS 5.5+)",
        details:
          "TypeScript can now infer `x is T` return types for filter callbacks, improving array narrowing automatically.",
        code: `// TS 5.5+ infers the type predicate automatically:\nconst strings = mixed.filter((x) => typeof x === "string");\n// strings is string[] (not (string | number)[])`,
      },
    ],
    breakingChanges: [
      "Stricter handling of computed property narrowing.",
      "`isolatedDeclarations` requires explicit return types on all exported functions.",
      "`erasableSyntaxOnly` prohibits enums (except `const enum`), parameter properties, and namespaces.",
    ],
    officialUrl: "https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html",
  },

  // ─── Next.js 15 → 16 ──────────────────────────────────────────────────────
  {
    framework: "nextjs",
    from: "15",
    to: "16",
    title: "Migrating from Next.js 15 to Next.js 16",
    summary:
      "Next.js 16 requires React 19, makes Turbopack the default bundler for dev, " +
      "stabilizes `after()`, and introduces improved streaming and caching defaults.",
    codemod: "npx @next/codemod@canary upgrade latest",
    steps: [
      {
        title: "1. Ensure React 19",
        details:
          "Next.js 16 requires React 19 as a peer dependency. Upgrade both React packages.",
        code: `npm install next@^16 react@^19 react-dom@^19`,
      },
      {
        title: "2. Turbopack is the default dev bundler",
        details:
          "Turbopack is now the default for `next dev`. Webpack is still available via `next dev --webpack`.",
        code: `# Default (Turbopack):\nnpx next dev\n\n# Fallback to Webpack if needed:\nnpx next dev --webpack`,
      },
      {
        title: "3. Use after() for post-response work",
        details:
          "`after()` is now stable. Use it for logging, analytics, and non-critical side effects that shouldn't block the response.",
        code: `import { after } from "next/server";\n\nexport default function Layout({ children }) {\n  after(() => {\n    analytics.track("page-view");\n  });\n  return <>{children}</>;\n}`,
      },
    ],
    breakingChanges: [
      "React 19 required as peer dependency.",
      "Turbopack is the default dev bundler (use `--webpack` to opt out).",
      "`after()` API is stable (remove experimental flag if set).",
      "Improved default caching behavior — review `staleTimes` configuration.",
    ],
    officialUrl: "https://nextjs.org/blog/next-16",
  },
];

/**
 * Finds a matching migration guide. When no from/to is specified,
 * returns the most recent migration for the framework.
 */
export function resolveMigration({ framework, from, to }) {
  const fw = String(framework || "").toLowerCase().trim();
  const fromVer = from ? String(from).trim().replace(/^[^\d]*/, "") : null;
  const toVer = to ? String(to).trim().replace(/^[^\d]*/, "") : null;

  const candidates = MIGRATIONS.filter((m) => {
    if (m.framework !== fw && !fw.includes(m.framework)) return false;
    if (fromVer && !m.from.startsWith(fromVer)) return false;
    if (toVer && !m.to.startsWith(toVer)) return false;
    return true;
  });

  if (candidates.length === 0) return undefined;

  // When no version filters given, prefer the latest migration (highest `to`)
  if (!fromVer && !toVer && candidates.length > 1) {
    return candidates.sort((a, b) => parseFloat(b.to) - parseFloat(a.to))[0];
  }

  return candidates[0];
}

/**
 * Formats a migration guide for agent consumption.
 */
export function formatMigrationReport(migration) {
  if (!migration) {
    const available = MIGRATIONS.map((m) => `${m.framework} (${m.from} -> ${m.to})`).join(", ");
    return (
      `# Migration Guide Not Found\n\n` +
      `No specific migration found matching your criteria.\n` +
      `Available migration guides in FrontLens:\n- ${available}\n\n` +
      `Tip: specify framework (e.g. "tailwind", "react", "nextjs") and target version.`
    );
  }

  const lines = [
    `# ${migration.title}`,
    "",
    migration.summary,
    "",
    migration.codemod ? `**Automated Codemod**: \`${migration.codemod}\`\n` : "",
    "## Step-by-Step Instructions",
  ];

  for (const step of migration.steps) {
    lines.push(`### ${step.title}`);
    lines.push(step.details);
    if (step.code) {
      lines.push("", "```typescript", step.code, "```", "");
    }
  }

  if (migration.breakingChanges.length > 0) {
    lines.push("## Breaking Changes Checklist");
    for (const b of migration.breakingChanges) {
      lines.push(`- [ ] ${b}`);
    }
    lines.push("");
  }

  if (migration.officialUrl) {
    lines.push(`Official Migration Guide: ${migration.officialUrl}`);
  }

  return lines.join("\n");
}
