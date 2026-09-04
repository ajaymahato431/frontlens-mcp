/**
 * Project context detection engine for frontlens-mcp.
 *
 * Inspects package.json, lockfiles, node_modules, and project configuration
 * files to detect installed frontend frameworks, versions, and architectural
 * patterns (e.g. Next.js App Router vs Pages Router, Tailwind v3 vs v4).
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/** Known frontend libraries and tools we track. */
export const TRACKED_PACKAGES = [
  "react",
  "react-dom",
  "next",
  "vite",
  "tailwindcss",
  "@tailwindcss/vite",
  "@tailwindcss/postcss",
  "typescript",
  "react-router",
  "react-router-dom",
  "@tanstack/react-query",
  "zustand",
  "postcss",
  "eslint",
];

/**
 * Searches upward from `startDir` for a directory containing `package.json`.
 */
export function findProjectRoot(startDir = process.cwd()) {
  let current = resolve(startDir);
  while (true) {
    const pkgPath = join(current, "package.json");
    if (existsSync(pkgPath)) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      // Reached filesystem root without finding package.json
      return null;
    }
    current = parent;
  }
}

/**
 * Tries to read the exact installed version from node_modules or package-lock.json.
 */
function resolveInstalledVersion(projectRoot, packageName, declaredVersion) {
  // 1. Check node_modules/<package>/package.json
  const modulePkgPath = join(projectRoot, "node_modules", packageName, "package.json");
  if (existsSync(modulePkgPath)) {
    try {
      const data = JSON.parse(readFileSync(modulePkgPath, "utf8"));
      if (data.version) return data.version;
    } catch {
      // Ignore parse failure and fall back
    }
  }

  // 2. Check package-lock.json packages entry
  const lockPath = join(projectRoot, "package-lock.json");
  if (existsSync(lockPath)) {
    try {
      const lockData = JSON.parse(readFileSync(lockPath, "utf8"));
      const key = `node_modules/${packageName}`;
      if (lockData.packages?.[key]?.version) {
        return lockData.packages[key].version;
      }
      if (lockData.dependencies?.[packageName]?.version) {
        return lockData.dependencies[packageName].version;
      }
    } catch {
      // Fall back
    }
  }

  // 3. Fall back to declared version in package.json
  return declaredVersion || null;
}

/**
 * Scans for config files in the project root.
 */
function inspectConfigs(projectRoot) {
  const configs = {
    vite: null,
    next: null,
    tailwind: null,
    postcss: null,
    typescript: null,
  };

  const checks = [
    { key: "vite", files: ["vite.config.ts", "vite.config.js", "vite.config.mjs", "vite.config.cjs"] },
    { key: "next", files: ["next.config.ts", "next.config.js", "next.config.mjs"] },
    { key: "tailwind", files: ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.cjs", "tailwind.config.mjs"] },
    { key: "postcss", files: ["postcss.config.js", "postcss.config.mjs", "postcss.config.cjs", "postcss.config.json"] },
    { key: "typescript", files: ["tsconfig.json"] },
  ];

  for (const { key, files } of checks) {
    for (const f of files) {
      if (existsSync(join(projectRoot, f))) {
        configs[key] = f;
        break;
      }
    }
  }

  return configs;
}

/**
 * Checks if a project uses Tailwind CSS v4 vs v3 based on CSS contents or dependencies.
 */
function inspectTailwindSetup(projectRoot, tailwindVersion) {
  const major = parseInt(String(tailwindVersion).replace(/^[^\d]*/, ""), 10);
  if (major >= 4) return { isV4: true, isV3: false, method: "version >= 4" };

  // Look for CSS files that use @import "tailwindcss"
  const candidateDirs = [projectRoot, join(projectRoot, "src"), join(projectRoot, "app"), join(projectRoot, "styles")];
  for (const dir of candidateDirs) {
    if (!existsSync(dir)) continue;
    try {
      const files = readdirSync(dir);
      for (const file of files) {
        if (file.endsWith(".css")) {
          const content = readFileSync(join(dir, file), "utf8");
          if (/@import\s+["']tailwindcss["']/.test(content)) {
            return { isV4: true, isV3: false, cssFile: file, method: '@import "tailwindcss"' };
          }
          if (/@tailwind\s+(?:base|utilities|components)/.test(content)) {
            return { isV4: false, isV3: true, cssFile: file, method: "@tailwind directives" };
          }
        }
      }
    } catch {
      // Ignore directory read errors
    }
  }

  return { isV4: major >= 4, isV3: major === 3, method: "inferred" };
}

/**
 * Checks for Next.js App Router vs Pages Router.
 */
function inspectNextArchitecture(projectRoot) {
  const hasAppRouter =
    existsSync(join(projectRoot, "app")) || existsSync(join(projectRoot, "src", "app"));
  const hasPagesRouter =
    existsSync(join(projectRoot, "pages")) || existsSync(join(projectRoot, "src", "pages"));

  return {
    hasAppRouter,
    hasPagesRouter,
    primaryRouter: hasAppRouter ? "App Router" : hasPagesRouter ? "Pages Router" : "Unknown",
  };
}

/**
 * Main detection entry point.
 */
export function detectProject(directory = process.cwd()) {
  const root = findProjectRoot(directory);
  if (!root) {
    return {
      found: false,
      directory: resolve(directory),
      message: "No package.json found in the specified path or any parent directory.",
    };
  }

  const pkgJsonPath = join(root, "package.json");
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
  } catch (err) {
    return {
      found: false,
      directory: root,
      message: `Failed to parse package.json: ${err.message}`,
    };
  }

  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
    ...(pkg.peerDependencies || {}),
  };

  const detectedPackages = {};
  for (const name of TRACKED_PACKAGES) {
    if (allDeps[name]) {
      const declared = allDeps[name];
      const exact = resolveInstalledVersion(root, name, declared);
      detectedPackages[name] = {
        declared,
        installed: exact,
        major: parseInt(String(exact || declared).replace(/^[^\d]*/, ""), 10) || null,
      };
    }
  }

  // Determine meta-framework and primary framework
  let metaFramework = null;
  let framework = null;

  if (detectedPackages["next"]) {
    metaFramework = "Next.js";
    framework = "React";
  } else if (detectedPackages["vite"]) {
    metaFramework = "Vite";
    if (detectedPackages["react"]) framework = "React";
    else framework = "Other (Vite)";
  } else if (detectedPackages["react"]) {
    framework = "React";
  }

  const configs = inspectConfigs(root);
  const tailwindInfo = detectedPackages["tailwindcss"]
    ? inspectTailwindSetup(root, detectedPackages["tailwindcss"].installed)
    : null;
  const nextInfo = detectedPackages["next"] ? inspectNextArchitecture(root) : null;

  // Compile advisories
  const advisories = [];

  if (detectedPackages["react"]?.major >= 19) {
    advisories.push(
      "React 19 detected: ReactDOM.render and ReactDOM.hydrate are removed (use createRoot / hydrateRoot). " +
        "Form status and state should use useActionState / useFormStatus. Refs can be passed directly as props."
    );
  }

  if (tailwindInfo?.isV4) {
    advisories.push(
      'Tailwind CSS v4 detected: Configuration is CSS-first using `@import "tailwindcss";` and `@theme` directives. ' +
        "No tailwind.config.js is required unless migrating."
    );
  } else if (tailwindInfo?.isV3) {
    advisories.push(
      "Tailwind CSS v3 detected: Uses `@tailwind` directives and tailwind.config.js."
    );
  }

  if (detectedPackages["next"]?.major >= 15) {
    advisories.push(
      "Next.js 15+ detected: Dynamic request headers (cookies(), headers()) and page props (params, searchParams) are asynchronous Promises."
    );
  }

  if (detectedPackages["vite"] && detectedPackages["tailwindcss"] && tailwindInfo?.isV4) {
    advisories.push(
      "Vite + Tailwind v4: Use `@tailwindcss/vite` plugin in vite.config.ts for optimal compilation speed."
    );
  }

  return {
    found: true,
    name: pkg.name || "unnamed-project",
    projectRoot: root,
    framework,
    metaFramework,
    packages: detectedPackages,
    configs,
    tailwind: tailwindInfo,
    next: nextInfo,
    advisories,
  };
}

/**
 * Formats a detectProject result into a concise agent-friendly report.
 */
export function formatProjectReport(result) {
  if (!result.found) {
    return `# FrontLens Project Context\n\n${result.message}`;
  }

  const lines = [
    `# FrontLens Project Context: ${result.name}`,
    `Root: ${result.projectRoot}`,
    `Framework: ${result.framework || "None"} | Meta-Framework: ${result.metaFramework || "None"}`,
    "",
    "## Detected Ecosystem Packages",
  ];

  for (const [pkg, info] of Object.entries(result.packages)) {
    const installed = info.installed ? ` (resolved: ${info.installed})` : "";
    lines.push(`- **${pkg}**: \`${info.declared}\`${installed}`);
  }

  if (Object.keys(result.packages).length === 0) {
    lines.push("- No known frontend packages detected in package.json.");
  }

  if (result.next) {
    lines.push("", `## Next.js Architecture: ${result.next.primaryRouter}`);
    lines.push(`- App Router: ${result.next.hasAppRouter ? "Yes" : "No"}`);
    lines.push(`- Pages Router: ${result.next.hasPagesRouter ? "Yes" : "No"}`);
  }

  if (result.tailwind) {
    lines.push("", `## Tailwind CSS: ${result.tailwind.isV4 ? "v4 (CSS-first)" : "v3 (JS-config)"}`);
    lines.push(`- Detection: ${result.tailwind.method}`);
  }

  if (result.advisories.length > 0) {
    lines.push("", "## Actionable Intelligence & Version Notes");
    for (const adv of result.advisories) {
      lines.push(`> [!NOTE]\n> ${adv}`);
    }
  }

  return lines.join("\n");
}
