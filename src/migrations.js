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
];

/**
 * Finds a matching migration guide.
 */
export function resolveMigration({ framework, from, to }) {
  const fw = String(framework || "").toLowerCase().trim();
  const fromVer = from ? String(from).trim().replace(/^[^\d]*/, "") : null;
  const toVer = to ? String(to).trim().replace(/^[^\d]*/, "") : null;

  return MIGRATIONS.find((m) => {
    if (m.framework !== fw && !fw.includes(m.framework)) return false;
    if (fromVer && !m.from.startsWith(fromVer)) return false;
    if (toVer && !m.to.startsWith(toVer)) return false;
    return true;
  });
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
