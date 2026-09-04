/**
 * Authoritative API lifecycle registry for frontlens-mcp.
 *
 * Tracks API lifecycle status across React, Next.js, Vite, Tailwind CSS,
 * and TypeScript: current, deprecated, removed, and new APIs, with before/after
 * code transformations and direct documentation references.
 */

export const API_ENTRIES = [
  // ─── React & React DOM ─────────────────────────────────────────────────────
  {
    symbol: "render",
    package: "react-dom",
    status: "removed",
    introducedIn: "0.3.0",
    deprecatedIn: "18.0.0",
    removedIn: "19.0.0",
    replacement: "createRoot",
    description: "ReactDOM.render has been removed in React 19. Use createRoot from react-dom/client.",
    beforeCode: `import ReactDOM from "react-dom";\nReactDOM.render(<App />, document.getElementById("root"));`,
    afterCode: `import { createRoot } from "react-dom/client";\nconst root = createRoot(document.getElementById("root"));\nroot.render(<App />);`,
    documentationUrl: "https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-reactdom-render",
  },
  {
    symbol: "hydrate",
    package: "react-dom",
    status: "removed",
    introducedIn: "16.0.0",
    deprecatedIn: "18.0.0",
    removedIn: "19.0.0",
    replacement: "hydrateRoot",
    description: "ReactDOM.hydrate has been removed in React 19. Use hydrateRoot from react-dom/client.",
    beforeCode: `import ReactDOM from "react-dom";\nReactDOM.hydrate(<App />, document.getElementById("root"));`,
    afterCode: `import { hydrateRoot } from "react-dom/client";\nhydrateRoot(document.getElementById("root"), <App />);`,
    documentationUrl: "https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-reactdom-hydrate",
  },
  {
    symbol: "unmountComponentAtNode",
    package: "react-dom",
    status: "removed",
    deprecatedIn: "18.0.0",
    removedIn: "19.0.0",
    replacement: "root.unmount()",
    description: "ReactDOM.unmountComponentAtNode has been removed in React 19. Call unmount() on the createRoot instance.",
    beforeCode: `ReactDOM.unmountComponentAtNode(domNode);`,
    afterCode: `root.unmount();`,
    documentationUrl: "https://react.dev/blog/2024/04/25/react-19-upgrade-guide",
  },
  {
    symbol: "useFormState",
    package: "react-dom",
    status: "deprecated",
    deprecatedIn: "19.0.0",
    replacement: "useActionState",
    description: "useFormState has been deprecated in React 19 and replaced by useActionState in the core 'react' package.",
    beforeCode: `import { useFormState } from "react-dom";\nconst [state, formAction] = useFormState(fn, initialState);`,
    afterCode: `import { useActionState } from "react";\nconst [state, formAction, isPending] = useActionState(fn, initialState);`,
    documentationUrl: "https://react.dev/reference/react/useActionState",
  },
  {
    symbol: "useActionState",
    package: "react",
    status: "new",
    introducedIn: "19.0.0",
    description: "Hook for handling async form actions. Returns [state, formAction, isPending].",
    beforeCode: `// Previously required manual useState + useTransition for pending states`,
    afterCode: `import { useActionState } from "react";\n\nconst [state, formAction, isPending] = useActionState(async (prev, formData) => {\n  return await updateName(formData.get("name"));\n}, { name: "" });`,
    documentationUrl: "https://react.dev/reference/react/useActionState",
  },
  {
    symbol: "useFormStatus",
    package: "react-dom",
    status: "current",
    introducedIn: "19.0.0",
    description: "Hook providing status information of the parent <form> without prop drilling (pending, data, method, action).",
    beforeCode: `// Child submit button had to receive isSubmitting prop from parent form`,
    afterCode: `import { useFormStatus } from "react-dom";\n\nfunction SubmitButton() {\n  const { pending } = useFormStatus();\n  return <button disabled={pending}>{pending ? "Saving..." : "Save"}</button>;\n}`,
    documentationUrl: "https://react.dev/reference/react-dom/hooks/useFormStatus",
  },
  {
    symbol: "useOptimistic",
    package: "react",
    status: "new",
    introducedIn: "19.0.0",
    description: "Hook that allows optimistic UI state updates while an async action is in flight.",
    beforeCode: `// Required manual rollback state machines`,
    afterCode: `import { useOptimistic } from "react";\n\nconst [optimisticMessages, addOptimisticMessage] = useOptimistic(\n  messages,\n  (state, newMessage) => [...state, { text: newMessage, sending: true }]\n);`,
    documentationUrl: "https://react.dev/reference/react/useOptimistic",
  },
  {
    symbol: "use",
    package: "react",
    status: "new",
    introducedIn: "19.0.0",
    description: "React hook/API to unwrap Promises and read Context conditionally inside components or hooks.",
    beforeCode: `// Context could not be read conditionally inside loops or if-statements`,
    afterCode: `import { use } from "react";\n\nfunction Comments({ commentsPromise }) {\n  const comments = use(commentsPromise); // suspends until promise resolves\n  return <ul>{comments.map(c => <li key={c.id}>{c.text}</li>)}</ul>;\n}`,
    documentationUrl: "https://react.dev/reference/react/use",
  },
  {
    symbol: "forwardRef",
    package: "react",
    status: "deprecated",
    deprecatedIn: "19.0.0",
    replacement: "ref as a prop",
    description: "In React 19, function components can now receive ref directly as a prop. forwardRef is no longer needed.",
    beforeCode: `const MyInput = forwardRef((props, ref) => <input {...props} ref={ref} />);`,
    afterCode: `function MyInput({ ref, ...props }) {\n  return <input {...props} ref={ref} />;\n}`,
    documentationUrl: "https://react.dev/blog/2024/04/25/react-19-upgrade-guide#ref-as-a-prop",
  },
  {
    symbol: "defaultProps",
    package: "react",
    status: "removed",
    removedIn: "19.0.0",
    replacement: "JavaScript default arguments",
    description: "defaultProps for function components has been removed in React 19. Use standard ES6 default parameter syntax.",
    beforeCode: `function Button({ text }) { return <button>{text}</button>; }\nButton.defaultProps = { text: "Click me" };`,
    afterCode: `function Button({ text = "Click me" }) {\n  return <button>{text}</button>;\n}`,
    documentationUrl: "https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-defaultprops",
  },

  // ─── Next.js ───────────────────────────────────────────────────────────────
  {
    symbol: "cookies",
    package: "next",
    status: "changed",
    deprecatedIn: "15.0.0",
    description: "In Next.js 15+, cookies() from next/headers returns a Promise and must be awaited.",
    beforeCode: `import { cookies } from "next/headers";\n\nexport default function Page() {\n  const cookieStore = cookies();\n  const token = cookieStore.get("token");\n}`,
    afterCode: `import { cookies } from "next/headers";\n\nexport default async function Page() {\n  const cookieStore = await cookies();\n  const token = cookieStore.get("token");\n}`,
    documentationUrl: "https://nextjs.org/docs/app/building-your-application/upgrading/version-15#async-request-apis-breaking-change",
  },
  {
    symbol: "headers",
    package: "next",
    status: "changed",
    deprecatedIn: "15.0.0",
    description: "In Next.js 15+, headers() from next/headers returns a Promise and must be awaited.",
    beforeCode: `import { headers } from "next/headers";\n\nexport default function Page() {\n  const headersList = headers();\n  const referer = headersList.get("referer");\n}`,
    afterCode: `import { headers } from "next/headers";\n\nexport default async function Page() {\n  const headersList = await headers();\n  const referer = headersList.get("referer");\n}`,
    documentationUrl: "https://nextjs.org/docs/app/building-your-application/upgrading/version-15#async-request-apis-breaking-change",
  },
  {
    symbol: "params",
    package: "next",
    status: "changed",
    deprecatedIn: "15.0.0",
    description: "In Next.js 15+, params in Page, Layout, and Route Handler props is a Promise and must be awaited (or unwrapped with React.use()).",
    beforeCode: `export default function Page({ params }: { params: { slug: string } }) {\n  const { slug } = params;\n  return <h1>{slug}</h1>;\n}`,
    afterCode: `export default async function Page({\n  params,\n}: {\n  params: Promise<{ slug: string }>;\n}) {\n  const { slug } = await params;\n  return <h1>{slug}</h1>;\n}`,
    documentationUrl: "https://nextjs.org/docs/app/building-your-application/upgrading/version-15#async-request-apis-breaking-change",
  },
  {
    symbol: "searchParams",
    package: "next",
    status: "changed",
    deprecatedIn: "15.0.0",
    description: "In Next.js 15+, searchParams in Page props is a Promise and must be awaited.",
    beforeCode: `export default function Page({ searchParams }: { searchParams: { query?: string } }) {\n  return <div>Query: {searchParams.query}</div>;\n}`,
    afterCode: `export default async function Page({\n  searchParams,\n}: {\n  searchParams: Promise<{ query?: string }>;\n}) {\n  const { query } = await searchParams;\n  return <div>Query: {query}</div>;\n}`,
    documentationUrl: "https://nextjs.org/docs/app/building-your-application/upgrading/version-15#async-request-apis-breaking-change",
  },
  {
    symbol: "revalidateTag",
    package: "next",
    status: "current",
    description: "Purges cached data on demand for requests tagged with next.tags in fetch options.",
    beforeCode: ``,
    afterCode: `import { revalidateTag } from "next/cache";\n\nexport async function updateProfile() {\n  "use server";\n  await db.update();\n  revalidateTag("user-profile");\n}`,
    documentationUrl: "https://nextjs.org/docs/app/api-reference/functions/revalidateTag",
  },
  {
    symbol: "connection",
    package: "next",
    status: "new",
    introducedIn: "15.0.0",
    description: "Explicitly opts an App Router route or component into dynamic rendering before awaiting incoming requests.",
    beforeCode: ``,
    afterCode: `import { connection } from "next/server";\n\nexport default async function Page() {\n  await connection();\n  // remaining code runs dynamically at request time\n}`,
    documentationUrl: "https://nextjs.org/docs/app/api-reference/functions/connection",
  },

  // ─── Tailwind CSS ──────────────────────────────────────────────────────────
  {
    symbol: "@tailwind",
    package: "tailwindcss",
    status: "removed",
    deprecatedIn: "3.4.0",
    removedIn: "4.0.0",
    replacement: '@import "tailwindcss";',
    description: "Tailwind CSS v4 replaces the three @tailwind directives with a single CSS import statement.",
    beforeCode: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`,
    afterCode: `@import "tailwindcss";`,
    documentationUrl: "https://tailwindcss.com/docs/upgrade-guide#import-syntax",
  },
  {
    symbol: "@theme",
    package: "tailwindcss",
    status: "new",
    introducedIn: "4.0.0",
    description: "In Tailwind CSS v4, custom theme tokens and design systems are configured directly in CSS via @theme.",
    beforeCode: `// In tailwind.config.js\nmodule.exports = {\n  theme: { extend: { colors: { brand: "#0ea5e9" } } }\n}`,
    afterCode: `@import "tailwindcss";\n\n@theme {\n  --color-brand: #0ea5e9;\n  --font-display: "Inter", sans-serif;\n}`,
    documentationUrl: "https://tailwindcss.com/docs/theme",
  },
  {
    symbol: "@utility",
    package: "tailwindcss",
    status: "new",
    introducedIn: "4.0.0",
    description: "Registers custom utility classes in CSS in Tailwind v4 without requiring a JavaScript plugin.",
    beforeCode: `// Previously required addUtilities in tailwind.config.js plugin`,
    afterCode: `@utility tab-4 {\n  tab-size: 4;\n}`,
    documentationUrl: "https://tailwindcss.com/docs/adding-custom-styles#registering-custom-utilities",
  },
  {
    symbol: "@apply",
    package: "tailwindcss",
    status: "current",
    description: "Inlines existing Tailwind utility classes into custom CSS rules. Use sparingly in v4 in favor of direct utility classes and CSS variables.",
    beforeCode: ``,
    afterCode: `.btn-primary {\n  @apply bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition;\n}`,
    documentationUrl: "https://tailwindcss.com/docs/reusing-styles",
  },

  // ─── Vite ──────────────────────────────────────────────────────────────────
  {
    symbol: "@tailwindcss/vite",
    package: "vite",
    status: "new",
    introducedIn: "4.0.0",
    description: "Dedicated official Vite plugin for Tailwind CSS v4. Replaces PostCSS setup for faster incremental compilation.",
    beforeCode: `// Previously used postcss.config.js with tailwindcss and autoprefixer plugins`,
    afterCode: `import { defineConfig } from "vite";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({\n  plugins: [tailwindcss()],\n});`,
    documentationUrl: "https://tailwindcss.com/docs/installation/framework-guides/vite",
  },
  {
    symbol: "import.meta.env",
    package: "vite",
    status: "current",
    description: "Vite's built-in mechanism for accessing environment variables. Client-facing variables must be prefixed with VITE_.",
    beforeCode: `// process.env.VITE_API_URL (Node.js style)`,
    afterCode: `const apiUrl = import.meta.env.VITE_API_URL;`,
    documentationUrl: "https://vite.dev/guide/env-and-mode.html",
  },

  // ─── TypeScript ────────────────────────────────────────────────────────────
  {
    symbol: "moduleResolution: bundler",
    package: "typescript",
    status: "recommended",
    introducedIn: "5.0.0",
    description: "Modern module resolution mode designed specifically for bundlers like Vite, Turbopack, and Webpack. Honors package.json exports.",
    beforeCode: `{\n  "compilerOptions": {\n    "moduleResolution": "node"\n  }\n}`,
    afterCode: `{\n  "compilerOptions": {\n    "module": "ESNext",\n    "moduleResolution": "bundler"\n  }\n}`,
    documentationUrl: "https://www.typescriptlang.org/tsconfig/#moduleResolution",
  },
  {
    symbol: "verbatimModuleSyntax",
    package: "typescript",
    status: "recommended",
    introducedIn: "5.0.0",
    description: "Simplifies type-only imports/exports rules. Replaces isolatedModules, importsNotUsedAsValues, and preserveValueImports.",
    beforeCode: `{\n  "compilerOptions": {\n    "isolatedModules": true,\n    "importsNotUsedAsValues": "error"\n  }\n}`,
    afterCode: `{\n  "compilerOptions": {\n    "verbatimModuleSyntax": true\n  }\n}`,
    documentationUrl: "https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax",
  },
];

/**
 * Searches the API registry for matching symbols.
 */
export function queryApi({ name, package: pkg, version }) {
  const q = String(name || "").toLowerCase().trim();
  const pkgFilter = pkg ? String(pkg).toLowerCase().trim() : null;

  return API_ENTRIES.filter((entry) => {
    if (pkgFilter && entry.package.toLowerCase() !== pkgFilter) {
      return false;
    }
    const sym = entry.symbol.toLowerCase();
    return sym === q || sym.includes(q) || q.includes(sym);
  });
}

/**
 * Formats an API query result for agent consumption.
 */
export function formatApiReport(matches, query) {
  if (matches.length === 0) {
    return (
      `# FrontLens API Check: "${query.name}"\n\n` +
      `No known deprecations or removals recorded for "${query.name}"` +
      (query.package ? ` in package "${query.package}".` : ".\n") +
      `Tip: Check spelling or try a related symbol name.`
    );
  }

  const sections = matches.map((item) => {
    const badge = item.status.toUpperCase();
    const lines = [
      `### \`${item.symbol}\` (${item.package}) — [${badge}]`,
      `- **Status**: ${item.status}`,
      item.introducedIn ? `- **Introduced in**: ${item.introducedIn}` : null,
      item.deprecatedIn ? `- **Deprecated in**: ${item.deprecatedIn}` : null,
      item.removedIn ? `- **Removed in**: ${item.removedIn}` : null,
      item.replacement ? `- **Replacement**: \`${item.replacement}\`` : null,
      "",
      item.description,
    ].filter(Boolean);

    if (item.beforeCode) {
      lines.push("", "```typescript", "// Before / Deprecated:", item.beforeCode, "```");
    }

    if (item.afterCode) {
      lines.push("", "```typescript", "// Recommended / Modern:", item.afterCode, "```");
    }

    if (item.documentationUrl) {
      lines.push("", `Official Documentation: ${item.documentationUrl}`);
    }

    return lines.join("\n");
  });

  return `# FrontLens API Intelligence\n\nFound ${matches.length} matching API definition(s):\n\n${sections.join("\n\n---\n\n")}`;
}
