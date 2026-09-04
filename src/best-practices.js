/**
 * Curated, authoritative best practices for modern frontend engineering.
 *
 * Covers React 19, Next.js App Router, Tailwind CSS v4, Vite, and TypeScript.
 */

export const BEST_PRACTICES = {
  // ─── React 19 ──────────────────────────────────────────────────────────────
  "react-actions": {
    framework: "react",
    title: "React 19 Actions and State Management",
    rules: [
      "DO use `useActionState` to manage form submission state, error states, and `isPending` automatically.",
      "DO use `useFormStatus` in child buttons/inputs to read submission state without prop drilling.",
      "DO use `useOptimistic` for instant UI feedback before server responses return.",
      "DON'T manage loading, error, and data flags manually with 3 separate `useState` hooks when executing an action.",
      "DON'T wrap form submissions in manual `e.preventDefault()` handlers when a Server Action or action hook fits.",
    ],
    code: `// Modern React 19 Form Action:\nimport { useActionState } from "react";\nimport { useFormStatus } from "react-dom";\n\nfunction SubmitButton() {\n  const { pending } = useFormStatus();\n  return <button disabled={pending}>{pending ? "Saving..." : "Save"}</button>;\n}\n\nexport function EditProfile({ initialName }: { initialName: string }) {\n  const [state, formAction] = useActionState(async (prev: string, formData: FormData) => {\n    const newName = formData.get("name") as string;\n    await saveName(newName);\n    return newName;\n  }, initialName);\n\n  return (\n    <form action={formAction}>\n      <input name="name" defaultValue={state} />\n      <SubmitButton />\n    </form>\n  );\n}`,
  },

  "react-effects": {
    framework: "react",
    title: "Avoiding Unnecessary useEffect",
    rules: [
      "DO compute derived state during rendering (e.g. `const fullName = firstName + ' ' + lastName;`).",
      "DO handle user interactions inside event handlers (e.g. `onClick`, `onSubmit`), not in effects watching state.",
      "DO use Suspense and Server Components (or libraries like TanStack Query) for data fetching instead of `useEffect`.",
      "DON'T use `useEffect` to sync props to state or to chain cascading state updates.",
    ],
    code: `// BAD:\nuseEffect(() => {\n  setFilteredItems(items.filter(i => i.name.includes(query)));\n}, [items, query]);\n\n// GOOD (calculated during render):\nconst filteredItems = useMemo(() => {\n  return items.filter(i => i.name.includes(query));\n}, [items, query]);`,
  },

  "react-refs": {
    framework: "react",
    title: "Modern Ref Handling in React 19",
    rules: [
      "DO pass `ref` directly as a regular prop in function components in React 19.",
      "DO use ref callback cleanup functions when adding custom observers or listeners.",
      "DON'T wrap function components in `forwardRef` in new React 19 code.",
    ],
    code: `// React 19: ref is a regular prop\ninterface CustomInputProps extends React.ComponentProps<"input"> {\n  ref?: React.Ref<HTMLInputElement>;\n  label: string;\n}\n\nexport function CustomInput({ ref, label, ...rest }: CustomInputProps) {\n  return (\n    <label>\n      <span>{label}</span>\n      <input ref={ref} {...rest} />\n    </label>\n  );\n}`,
  },

  // ─── Next.js App Router ────────────────────────────────────────────────────
  "next-server-components": {
    framework: "nextjs",
    title: "Server vs Client Component Boundaries",
    rules: [
      "DO make components Server Components by default; they render with zero client JavaScript bundle impact.",
      "DO push `'use client'` to the leaf components that actually require browser events, state, or effects.",
      "DO pass Server Components as `children` into Client Components to avoid forcing the entire tree client-side.",
      "DON'T mark page layouts or entire feature pages with `'use client'` unless unavoidable.",
    ],
    code: `// Interactive wrapper (Client Component)\n"use client";\nexport function Modal({ children }: { children: React.ReactNode }) {\n  const [open, setOpen] = useState(false);\n  return open ? <div className="modal">{children}</div> : null;\n}\n\n// Page (Server Component) - passes server-rendered child into client modal\nexport default async function Page() {\n  const data = await fetchUser();\n  return (\n    <Modal>\n      <UserDetails data={data} />\n    </Modal>\n  );\n}`,
  },

  "next-data-fetching": {
    framework: "nextjs",
    title: "Async Data Fetching in Next.js 15+",
    rules: [
      "DO await `cookies()`, `headers()`, and page `params` / `searchParams` in Next.js 15+.",
      "DO colocate data queries directly inside the Server Component that renders them.",
      "DO use React's `cache()` function to memoize database or non-fetch requests across the component tree.",
      "DON'T pass large serialized server payloads across the client boundary if only a few fields are needed.",
    ],
    code: `import { cookies } from "next/headers";\n\ninterface PageProps {\n  params: Promise<{ id: string }>;\n}\n\nexport default async function Page({ params }: PageProps) {\n  const { id } = await params;\n  const cookieStore = await cookies();\n  const token = cookieStore.get("session")?.value;\n  \n  const item = await getItem(id, token);\n  return <h1>{item.title}</h1>;\n}`,
  },

  // ─── Tailwind CSS v4 ───────────────────────────────────────────────────────
  "tailwind-theme": {
    framework: "tailwind",
    title: "CSS-First Configuration with @theme in Tailwind v4",
    rules: [
      "DO configure theme tokens and custom design systems in CSS using `@theme` blocks.",
      "DO use modern CSS variables (`--color-*`, `--font-*`) which Tailwind v4 automatically exposes.",
      "DO prefer utility classes over `@apply` in stylesheets for predictable cascade behavior and smaller CSS.",
      "DON'T create a `tailwind.config.js` in Tailwind v4 unless migrating an existing v3 code base.",
    ],
    code: `/* app.css */\n@import "tailwindcss";\n\n@theme {\n  --font-display: "Outfit", sans-serif;\n  --color-primary-500: oklch(0.65 0.24 260);\n  --color-primary-600: oklch(0.55 0.24 260);\n  --radius-badge: 0.25rem;\n}\n\n/* Usage in HTML/JSX: */\n/* <h1 className="font-display text-primary-500">Hello</h1> */`,
  },

  "tailwind-responsive": {
    framework: "tailwind",
    title: "Modern Layouts and Container Queries",
    rules: [
      "DO use `@container` queries for reusable components that adjust based on their container width rather than viewport.",
      "DO use modern CSS grid and subgrid with Tailwind's `grid-cols-subgrid`.",
      "DO design mobile-first: unprefixed utilities apply to mobile; `md:` and `lg:` override for larger screens.",
      "DON'T chain deeply nested arbitrary values like `w-[calc(100%-24px)]` if standard spacing tokens fit.",
    ],
    code: `<div className="@container">\n  <div className="flex flex-col @md:flex-row @md:items-center gap-4">\n    <img className="w-full @md:w-32 rounded-lg" src="/avatar.jpg" />\n    <div>\n      <h3 className="text-lg font-semibold">User Profile</h3>\n    </div>\n  </div>\n</div>`,
  },

  // ─── Vite ──────────────────────────────────────────────────────────────────
  "vite-config": {
    framework: "vite",
    title: "Modern Vite Project Configuration",
    rules: [
      "DO use official plugins like `@tailwindcss/vite` and `@vitejs/plugin-react`.",
      "DO prefix all client-accessible environment variables with `VITE_`.",
      "DO keep dependencies in devDependencies vs dependencies strictly organized for production container builds.",
      "DON'T expose private API secrets through `VITE_` variables; they are embedded into the client bundle.",
    ],
    code: `// vite.config.ts\nimport { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n  server: {\n    port: 3000,\n  },\n});`,
  },

  // ─── TypeScript ────────────────────────────────────────────────────────────
  "typescript-modern": {
    framework: "typescript",
    title: "Modern TypeScript Configuration and Best Practices",
    rules: [
      "DO set `\"moduleResolution\": \"bundler\"` in tsconfig.json for Vite, Turbopack, or Next.js projects.",
      "DO enable `\"strict\": true` and `\"noUncheckedIndexedAccess\": true` for safety.",
      "DO use discriminated unions for state modeling instead of optional boolean fields.",
      "DO use `satisfies` operator to validate types without widening inferred literal types.",
      "DON'T use `any`; use `unknown` with type guards or `never` for exhaustive checks.",
    ],
    code: `// Discriminated union for asynchronous states:\ntype AsyncState<T> =\n  | { status: "idle" }\n  | { status: "loading" }\n  | { status: "success"; data: T }\n  | { status: "error"; error: Error };\n\n// Using 'satisfies' to preserve exact literal types:\nconst themeConfig = {\n  primary: "#3b82f6",\n  secondary: "#10b981",\n} satisfies Record<string, string>;`,
  },

  // ─── New: React Performance ────────────────────────────────────────────────
  "react-performance": {
    framework: "react",
    title: "React 19 Performance and the React Compiler",
    rules: [
      "DO let the React Compiler handle memoization automatically in React 19 — avoid manual `useMemo`/`useCallback` for most cases.",
      "DO use `React.lazy()` and `<Suspense>` for code-splitting heavy components.",
      "DO use `useDeferredValue` for non-urgent UI updates like search filtering.",
      "DO use `useTransition` to mark state updates as low-priority transitions.",
      "DON'T prematurely optimize with `React.memo` wrappers everywhere — profile first with React DevTools.",
    ],
    code: `// Deferred search filtering (non-blocking):\nimport { useDeferredValue, useMemo } from "react";\n\nfunction SearchResults({ query, items }) {\n  const deferredQuery = useDeferredValue(query);\n  const filtered = useMemo(\n    () => items.filter(i => i.name.includes(deferredQuery)),\n    [items, deferredQuery]\n  );\n  return <ul>{filtered.map(i => <li key={i.id}>{i.name}</li>)}</ul>;\n}`,
  },

  // ─── New: Next.js Metadata ─────────────────────────────────────────────────
  "next-metadata": {
    framework: "nextjs",
    title: "Dynamic Metadata and SEO in Next.js App Router",
    rules: [
      "DO export `generateMetadata` from page files for dynamic title, description, and Open Graph tags.",
      "DO use the `metadata` static export for pages with fixed metadata.",
      "DO implement `generateStaticParams` alongside `generateMetadata` for static generation.",
      "DO use the `opengraph-image.tsx` convention for dynamic OG image generation.",
      "DON'T use `<Head>` from `next/head` in App Router — that is Pages Router only.",
    ],
    code: `import type { Metadata } from "next";\n\n// Static metadata:\nexport const metadata: Metadata = {\n  title: "My App",\n  description: "A modern web application",\n};\n\n// Dynamic metadata:\nexport async function generateMetadata({ params }: {\n  params: Promise<{ slug: string }>;\n}): Promise<Metadata> {\n  const { slug } = await params;\n  const post = await getPost(slug);\n  return {\n    title: post.title,\n    description: post.excerpt,\n    openGraph: { images: [post.coverImage] },\n  };\n}`,
  },

  // ─── New: Next.js Caching ──────────────────────────────────────────────────
  "next-caching": {
    framework: "nextjs",
    title: "Caching and Revalidation Strategies in Next.js 15+",
    rules: [
      "DO note that `fetch()` defaults to `cache: 'no-store'` (uncached) in Next.js 15+.",
      "DO use `next.tags` with `revalidateTag()` for targeted cache invalidation.",
      "DO use `revalidatePath()` to purge an entire route's cached data.",
      "DO use `cache()` from React to deduplicate database calls across the component tree.",
      "DON'T assume data is cached — explicitly set `cache: 'force-cache'` when static caching is desired.",
    ],
    code: `// Cached fetch with tag-based revalidation:\nconst data = await fetch("https://api.example.com/items", {\n  cache: "force-cache",\n  next: { tags: ["items"], revalidate: 3600 },\n});\n\n// Server Action that invalidates the cache:\n"use server";\nimport { revalidateTag } from "next/cache";\n\nexport async function createItem(formData: FormData) {\n  await db.items.create({ data: Object.fromEntries(formData) });\n  revalidateTag("items");\n}`,
  },

  // ─── New: Tailwind Dark Mode ───────────────────────────────────────────────
  "tailwind-dark-mode": {
    framework: "tailwind",
    title: "Dark Mode Configuration in Tailwind CSS v4",
    rules: [
      "DO use the built-in `dark:` variant which respects `prefers-color-scheme` by default in v4.",
      "DO use `@custom-variant dark (&:where(.dark, .dark *))` if you need class-based dark mode toggling.",
      "DO define dark mode color tokens in `@theme` using CSS custom properties.",
      "DON'T use `darkMode: 'class'` in `tailwind.config.js` — this is the v3 approach.",
    ],
    code: `/* Tailwind v4 class-based dark mode: */\n@import "tailwindcss";\n@custom-variant dark (&:where(.dark, .dark *));\n\n@theme {\n  --color-bg: #ffffff;\n  --color-bg-dark: #0f172a;\n  --color-text: #1e293b;\n  --color-text-dark: #e2e8f0;\n}\n\n/* Usage: */\n/* <div className="bg-bg dark:bg-bg-dark text-text dark:text-text-dark"> */`,
  },

  // ─── New: Vite Optimization ────────────────────────────────────────────────
  "vite-optimization": {
    framework: "vite",
    title: "Vite Build Optimization and Performance",
    rules: [
      "DO use `optimizeDeps.include` to pre-bundle large CommonJS dependencies for faster cold starts.",
      "DO use `build.rollupOptions.output.manualChunks` to control chunk splitting for better caching.",
      "DO enable `build.sourcemap: true` in production for debugging, but use `'hidden'` to avoid exposing them publicly.",
      "DO use `server.warmup` to pre-transform frequently used modules.",
      "DON'T put secrets in `VITE_`-prefixed environment variables — they are embedded in the client bundle.",
    ],
    code: `// vite.config.ts\nimport { defineConfig } from "vite";\n\nexport default defineConfig({\n  optimizeDeps: {\n    include: ["lodash-es", "axios"],\n  },\n  build: {\n    sourcemap: "hidden",\n    rollupOptions: {\n      output: {\n        manualChunks: {\n          vendor: ["react", "react-dom"],\n        },\n      },\n    },\n  },\n  server: {\n    warmup: { clientFiles: ["./src/main.tsx", "./src/App.tsx"] },\n  },\n});`,
  },

  // ─── New: TypeScript Patterns ──────────────────────────────────────────────
  "typescript-patterns": {
    framework: "typescript",
    title: "Advanced TypeScript Patterns for Frontend",
    rules: [
      "DO use `satisfies` to validate object shapes without losing literal type inference.",
      "DO use branded types (nominal typing) for type-safe IDs and tokens.",
      "DO use `using` for explicit resource management (TypeScript 5.2+).",
      "DO use exhaustive switch checks with `never` to catch unhandled cases at compile time.",
      "DON'T use `enum` in new code — prefer `as const` objects or union types for better tree-shaking.",
    ],
    code: `// Branded types for type-safe IDs:\ntype UserId = string & { readonly __brand: "UserId" };\ntype OrderId = string & { readonly __brand: "OrderId" };\n\nfunction getUser(id: UserId) { /* ... */ }\nconst uid = "abc123" as UserId;\ngetUser(uid); // OK\n// getUser("abc123" as OrderId); // Compile error!\n\n// Exhaustive switch:\nfunction assertNever(x: never): never {\n  throw new Error("Unexpected: " + x);\n}\n\nfunction handleStatus(s: "active" | "inactive" | "pending") {\n  switch (s) {\n    case "active": return "✅";\n    case "inactive": return "❌";\n    case "pending": return "⏳";\n    default: return assertNever(s);\n  }\n}`,
  },
};

export const ALL_TOPICS = Object.keys(BEST_PRACTICES);

/**
 * Returns best practices for a specific topic or framework.
 */
export function filterBestPractices({ framework, topic } = {}) {
  const fw = framework && framework !== "all" ? String(framework).toLowerCase().trim() : null;
  const top = topic ? String(topic).toLowerCase().trim() : null;

  if (top && BEST_PRACTICES[top]) {
    return [BEST_PRACTICES[top]];
  }

  return Object.values(BEST_PRACTICES).filter((bp) => {
    if (fw && bp.framework !== fw && !bp.framework.includes(fw)) return false;
    if (top && !bp.title.toLowerCase().includes(top)) return false;
    return true;
  });
}

/**
 * Renders formatted best-practices output.
 */
export function renderBestPractices(entries) {
  if (entries.length === 0) {
    const available = Object.keys(BEST_PRACTICES).join(", ");
    return (
      `# FrontLens Best Practices\n\n` +
      `No topics matched your query.\n\n` +
      `Available topics:\n${available}`
    );
  }

  const sections = entries.map((bp) => {
    const lines = [
      `## ${bp.title} [${bp.framework.toUpperCase()}]`,
      "",
      ...bp.rules.map((r) => `- ${r}`),
    ];

    if (bp.code) {
      lines.push("", "```typescript", bp.code, "```");
    }

    return lines.join("\n");
  });

  return `# FrontLens Engineering Best Practices\n\n${sections.join("\n\n---\n\n")}`;
}
