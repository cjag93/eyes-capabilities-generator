// Snapshots the industry sample pages into `lib/sample-app.generated.ts` so the
// framework generators can ship a runnable copy of the sample app inside every
// downloaded project.
//
// `lib/` is bundled for the browser (the wizard generates snippets client-side),
// so it cannot read the filesystem at generate time — the sources have to be
// embedded as string constants ahead of time. Re-run after touching anything
// under `app/samples/`:
//
//     npm run generate:sample-app
//
// CI re-runs this and fails if the checked-in file is stale.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(repoRoot, p), "utf8");

const rootPkg = JSON.parse(read("package.json"));

/** Industry sample routes, minus the index (it imports the generator engine). */
const industryDirs = readdirSync(join(repoRoot, "app/samples"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
  .map((entry) => entry.name)
  .sort();

if (industryDirs.length === 0) {
  throw new Error("No sample routes found under app/samples/");
}

/**
 * Files copied verbatim from this repo. The sample pages depend only on `react`
 * and `../_components/shared`, so this closure is complete — verified by the
 * import check below.
 */
const copied = [
  // "text" rather than "css": ProjectFile["language"] has no css member and
  // lib/types.ts is frozen. It is only a syntax-highlight hint for the preview.
  { path: "app/globals.css", source: "app/globals.css", language: "text" },
  {
    path: "app/samples/_components/shared.tsx",
    source: "app/samples/_components/shared.tsx",
    language: "typescript",
  },
  ...industryDirs.map((id) => ({
    path: `app/samples/${id}/page.tsx`,
    source: `app/samples/${id}/page.tsx`,
    language: "typescript",
  })),
];

// Guard: a sample page that reaches outside this closure would produce a
// project that cannot build. Fail loudly at codegen time instead.
const ALLOWED_IMPORTS = /^(react|next\/[\w/-]+|\.\.?\/[\w./-]+)$/;
for (const file of copied) {
  const contents = read(file.source);
  for (const [, specifier] of contents.matchAll(/from\s+"([^"]+)"/g)) {
    if (!ALLOWED_IMPORTS.test(specifier)) {
      throw new Error(
        `${file.source} imports "${specifier}", which the standalone sample app ` +
          `cannot resolve. Keep sample pages dependent on react/next/relative ` +
          `paths only, or teach this script to bundle it.`,
      );
    }
  }
}

/**
 * Files authored here rather than copied. The repo's own root layout and
 * samples index depend on things the standalone app does not have (the
 * generator engine, a typegen'd `LayoutProps<"/">` for a route that would not
 * exist), so the sample app gets minimal equivalents.
 */
const LAYOUT = `import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eyes sample apps",
  description:
    "Industry sample pages used as the target for Applitools Eyes visual tests.",
};

// Runs before paint so the saved (or system) theme is applied without a flash.
const themeScript = \`(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||((t==="system"||!t)&&window.matchMedia("(prefers-color-scheme: dark)").matches);var c=document.documentElement.classList;c.toggle("dark",d);c.toggle("light",!d);}catch(e){}})();\`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={\`\${geistSans.variable} \${geistMono.variable} h-full antialiased\`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
`;

const indexPage = `import Link from "next/link";

// Standalone index for the bundled sample app. The generator repo's own
// /samples page is not copied here because it imports the snippet engine.
const SAMPLES = [
${industryDirs.map((id) => `  "${id}",`).join("\n")}
];

export default function SamplesIndex() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Eyes sample apps</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Each page is a visual-testing target with deliberately unstable content
        (live clocks, randomized charts, counters).
      </p>
      <ul className="mt-8 grid gap-2">
        {SAMPLES.map((id) => (
          <li key={id}>
            <Link
              href={\`/samples/\${id}\`}
              className="block rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium transition-colors hover:border-accent"
            >
              /samples/{id}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
`;

const samplePkg = JSON.stringify(
  {
    name: "eyes-sample-app",
    version: "1.0.0",
    private: true,
    scripts: { dev: "next dev", build: "next build", start: "next start" },
    dependencies: {
      next: rootPkg.dependencies.next,
      react: rootPkg.dependencies.react,
      "react-dom": rootPkg.dependencies["react-dom"],
    },
    devDependencies: {
      "@tailwindcss/postcss": rootPkg.devDependencies["@tailwindcss/postcss"],
      "@types/node": rootPkg.devDependencies["@types/node"],
      "@types/react": rootPkg.devDependencies["@types/react"],
      "@types/react-dom": rootPkg.devDependencies["@types/react-dom"],
      tailwindcss: rootPkg.devDependencies.tailwindcss,
      typescript: rootPkg.devDependencies.typescript,
    },
  },
  null,
  2,
);

const sampleTsconfig = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2017",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: { "@/*": ["./*"] },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  },
  null,
  2,
);

const authored = [
  { path: "package.json", contents: samplePkg, language: "json" },
  { path: "tsconfig.json", contents: sampleTsconfig, language: "json" },
  { path: "next.config.ts", contents: read("next.config.ts"), language: "typescript" },
  {
    path: "postcss.config.mjs",
    contents: read("postcss.config.mjs"),
    language: "javascript",
  },
  { path: "app/layout.tsx", contents: LAYOUT, language: "typescript" },
  { path: "app/page.tsx", contents: indexPage, language: "typescript" },
  { path: ".gitignore", contents: "node_modules/\n.next/\n", language: "text" },
];

const files = [
  ...authored,
  ...copied.map((f) => ({
    path: f.path,
    contents: read(f.source),
    language: f.language,
  })),
].sort((a, b) => a.path.localeCompare(b.path));

const output = `// AUTO-GENERATED by scripts/generate-sample-app.mjs — do not edit by hand.
// Run \`npm run generate:sample-app\` after changing anything under app/samples/.
//
// A self-contained copy of the industry sample pages, emitted into every
// generated project under \`sample-app/\` so the tests have a real target
// without depending on a checkout of this repo.

import type { ProjectFile } from "./types";

/** Sample routes included in the bundle, e.g. "finance" -> /samples/finance. */
export const SAMPLE_APP_ROUTES: string[] = [
${industryDirs.map((id) => `  "${id}",`).join("\n")}
];

export const SAMPLE_APP_FILES: ProjectFile[] = ${JSON.stringify(files, null, 2)};
`;

writeFileSync(join(repoRoot, "lib/sample-app.generated.ts"), output);

const bytes = files.reduce((n, f) => n + f.contents.length, 0);
console.log(
  `Wrote lib/sample-app.generated.ts — ${files.length} files, ` +
    `${industryDirs.length} sample routes, ${(bytes / 1024).toFixed(1)} KB.`,
);
