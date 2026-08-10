import type {
  FrameworkGenerator,
  GeneratorOptions,
  IndustryPreset,
  IndustryRegion,
  MatchLevel,
  ProjectFile,
} from "../types";
import { SAMPLE_APP_FILES } from "../sample-app.generated";

/**
 * Playwright generator (reference implementation of the "runnable project"
 * pattern). Given an industry preset it emits a bare-minimum, runnable
 * Applitools Eyes project pointed at that industry's sample app: config, a
 * launcher for the sample app, and one full-window `eyes.check` per match level
 * (Strict / Exact / Layout, no locators).
 *
 * It works by token-substituting small templates. Person C: copy this shape for
 * Cypress / Selenium / WebdriverIO — same file set, different SDK syntax.
 */

const LEVELS: { id: MatchLevel; label: string; matchLevel: string }[] = [
  { id: "strict", label: "Strict", matchLevel: "Strict" },
  { id: "exact", label: "Exact", matchLevel: "Exact" },
  { id: "layout", label: "Layout", matchLevel: "Layout" },
];

/** Desktop browsers emitted into Ultrafast Grid config when UFG is enabled. */
const UFG_BROWSERS = ["chrome", "firefox", "safari"] as const;

function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

/** Escape a preset value for embedding in a double-quoted JS string literal. */
function jsString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** The industry's first checkpoint names the single check these tests take. */
function checkpointName(checkpoints: string[]): string {
  return jsString(checkpoints[0] ?? "Login");
}

/**
 * Eyes region bucket for each preset match level. There is no "exact" region
 * type, so exact falls back to `strictRegions` — the nearest region-level
 * equivalent.
 */
const REGION_KEYS: Record<MatchLevel, string> = {
  strict: "strictRegions",
  layout: "layoutRegions",
  exact: "strictRegions",
};

/**
 * Collapse the preset's `dynamicRegions` into one entry per Eyes region bucket,
 * preserving the order the preset lists them in.
 */
function groupRegions(regions: IndustryRegion[] = []): [string, string[]][] {
  const grouped = new Map<string, string[]>();
  for (const region of regions) {
    const key = REGION_KEYS[region.matchLevel];
    if (!key) continue;
    grouped.set(key, [...(grouped.get(key) ?? []), region.selector]);
  }
  return [...grouped];
}

/**
 * Where the generated test navigates, and whether the project has to boot the
 * sample app itself.
 *
 * Presets with a real sample page under `app/samples/*` point at this repo's
 * dev server (`http://localhost:3000/samples/<id>`), so the project ships a
 * launcher and a `webServer` block. Catalog-only presets point at a public demo
 * URL, so there is nothing to start.
 */
interface SampleTarget {
  url: string;
  origin: string;
  path: string;
  isLocal: boolean;
}

function sampleTarget(industry: IndustryPreset): SampleTarget {
  try {
    const parsed = new URL(industry.sampleUrl);
    return {
      url: industry.sampleUrl,
      origin: parsed.origin,
      path: `${parsed.pathname}${parsed.search}`,
      isLocal: parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1",
    };
  } catch {
    // A preset with a malformed sampleUrl still generates something runnable.
    return {
      url: industry.sampleUrl,
      origin: industry.sampleUrl,
      path: "/",
      isLocal: false,
    };
  }
}

function testFile(
  level: (typeof LEVELS)[number],
  ts: boolean,
  checkpoint: string,
  target: SampleTarget,
  regions: IndustryRegion[] = [],
): string {
  const importLine = ts
    ? `import { test } from "@applitools/eyes-playwright/fixture";`
    : `const { test } = require("@applitools/eyes-playwright/fixture");`;

  // Elements the preset flags as legitimately unstable, so the check does not
  // fail on expected drift (live clocks, async-loaded charts, counters).
  const regionEntries = groupRegions(regions).map(
    ([key, selectors]) => `    ${key}: [
${selectors.map((s) => `      "${jsString(s)}",`).join("\n")}
    ],`,
  );

  const checkSettings = regionEntries.length
    ? `{
    fully: true,
    matchLevel: "${level.matchLevel}",
${regionEntries.join("\n")}
  }`
    : `{ fully: true, matchLevel: "${level.matchLevel}" }`;

  return `${importLine}

// One checkpoint, one match level, no locators — just a full-window check of
// ${jsString(target.url)} (the path resolves against baseURL in playwright.config).
test("${checkpoint} — ${level.label} match level", async ({ page, eyes }) => {
  await page.goto("${jsString(target.path)}");
  await eyes.check("${checkpoint}", ${checkSettings});
});
`;
}

/**
 * Boots the sample app bundled under `sample-app/`. Only emitted for presets
 * whose sampleUrl is local.
 */
const SAMPLE_APP_JS = `// Starts the bundled sample app that serves {{SAMPLE_URL}}.
//
// The app is a self-contained Next.js project in ./sample-app; its dependencies
// install on first run. Set SAMPLE_APP_DIR to use a different copy instead
// (for example a checkout of eyes-capabilities-generator).
const { spawn, spawnSync } = require("child_process");
const { existsSync } = require("fs");
const path = require("path");

const appDir = path.resolve(__dirname, process.env.SAMPLE_APP_DIR || "sample-app");

if (!existsSync(path.join(appDir, "node_modules"))) {
  console.log("Installing sample app dependencies (first run only)...");
  const install = spawnSync("npm", ["install"], {
    cwd: appDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (install.status !== 0) {
    console.error("Could not install sample app dependencies in " + appDir);
    process.exit(install.status === null ? 1 : install.status);
  }
}

console.log("Starting the {{INDUSTRY_LABEL}} sample app from " + appDir);

const child = spawn("npm", ["run", "dev"], {
  cwd: appDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("error", (error) => {
  console.error("Could not start the sample app from " + appDir);
  console.error(error.message);
  process.exit(1);
});

child.on("exit", (code) => process.exit(code === null ? 1 : code));
`;

const README = `# {{APP_NAME}} — Applitools Eyes starter (Playwright)

A minimal, runnable Applitools Eyes project pointed at the {{INDUSTRY_LABEL}}
sample page ({{SAMPLE_URL}}). It runs the **same** page through three visual
checkpoints — one per match level — so you can see how each behaves:

- \`tests/{{PROJECT_SLUG}}.strict.spec.{{EXT}}\` — **Strict** match level
- \`tests/{{PROJECT_SLUG}}.exact.spec.{{EXT}}\` — **Exact** match level
- \`tests/{{PROJECT_SLUG}}.layout.spec.{{EXT}}\` — **Layout** match level

Each test does one full-window \`eyes.check\` — no locators.

## 1. Install

\`\`\`bash
npm install
npx playwright install chromium
\`\`\`

## 2. Add your Applitools API key

\`\`\`bash
cp .env.example .env
# then edit .env and paste your APPLITOOLS_API_KEY
\`\`\`

Get a key from the [Applitools dashboard](https://eyes.applitools.com).

{{RUN_SECTION}}`;

const RUN_LOCAL = `## 3. Run

\`\`\`bash
npm test
\`\`\`

That is everything — the sample app ships with this project.

## The bundled sample app

\`sample-app/\` is a self-contained Next.js copy of the industry sample pages,
including {{SAMPLE_URL}}. Playwright's \`webServer\` runs \`sample-app.js\`, which
installs the app's dependencies on first run (so the first \`npm test\` takes a
minute), starts it, and waits for the page before the tests begin.

If you already have it running, Playwright reuses that server instead of
starting a second one. To test a different copy — a checkout of
\`eyes-capabilities-generator\`, or a deployed URL's local equivalent — set
\`SAMPLE_APP_DIR\` in \`.env\`.

You can browse the other industries' pages too; they are all included under
\`sample-app/app/samples/\`.
`;

const RUN_REMOTE = `## 3. Run

\`\`\`bash
npm test
\`\`\`

The tests hit {{SAMPLE_URL}} directly, so there is nothing to start locally.
`;

export const playwright: FrameworkGenerator = {
  id: "playwright",
  label: "Playwright",
  supportedLanguages: ["javascript", "typescript"],
  generate({ language, useUltrafastGrid, industry }: GeneratorOptions) {
    const ts = language === "typescript";
    const ext = ts ? "ts" : "js";
    const target = sampleTarget(industry);
    const primaryViewport = industry.viewports[0] ?? {
      width: 1280,
      height: 720,
    };
    const baseVars = {
      APP_NAME: industry.appName,
      BATCH_NAME: industry.batchName,
      INDUSTRY_LABEL: industry.label,
      PROJECT_SLUG: industry.id,
      SAMPLE_URL: target.url,
      EXT: ext,
    };
    // The run section carries its own tokens, so resolve it before it is
    // spliced into the README (render() is single-pass).
    const vars = {
      ...baseVars,
      RUN_SECTION: render(target.isLocal ? RUN_LOCAL : RUN_REMOTE, baseVars),
    };
    const checkpoint = checkpointName(industry.checkpoints);

    const packageJson = JSON.stringify(
      {
        name: `${vars.PROJECT_SLUG}-eyes-playwright`,
        version: "1.0.0",
        private: true,
        scripts: { test: "playwright test" },
        devDependencies: {
          "@applitools/eyes-playwright": "^1.34.0",
          "@playwright/test": "^1.49.0",
          dotenv: "^16.4.0",
        },
      },
      null,
      2,
    );

    // Playwright boots (and waits for) the sample app itself; nothing to do
    // when the preset points at a public demo URL.
    const webServer = target.isLocal
      ? `
  webServer: {
    command: "node sample-app.js",
    url: "${target.url}",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },`
      : "";

    const browsersInfo = UFG_BROWSERS.map(
      (name) =>
        `        { name: "${name}", width: ${primaryViewport.width}, height: ${primaryViewport.height} },`,
    ).join("\n");

    const eyesConfig = useUltrafastGrid
      ? `eyesConfig: {
      appName: "${vars.APP_NAME}",
      batch: { name: "${vars.BATCH_NAME}" },
      // Ultrafast Grid — re-renders each checkpoint across these browsers.
      type: "ufg",
      browsersInfo: [
${browsersInfo}
      ],
    }`
      : `eyesConfig: {
      appName: "${vars.APP_NAME}",
      batch: { name: "${vars.BATCH_NAME}" },
      type: "classic",
    }`;

    const playwrightConfig = ts
      ? `import "dotenv/config";
import { defineConfig } from "@playwright/test";
import type { EyesFixture } from "@applitools/eyes-playwright/fixture";

export default defineConfig<EyesFixture>({
  testDir: "./tests",
  use: {
    baseURL: "${target.origin}",
    ${eyesConfig},
  },${webServer}
});
`
      : `require("dotenv").config();
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "${target.origin}",
    ${eyesConfig},
  },${webServer}
});
`;

    const applitoolsConfig = `// Applitools reads APPLITOOLS_API_KEY from the environment (.env).
// Runner / browser matrix lives in playwright.config (eyesConfig).
module.exports = {
  appName: "${vars.APP_NAME}",
  batch: { name: "${vars.BATCH_NAME}" },
};
`;

    const envExample = `# Get your key from https://eyes.applitools.com (Account settings).
APPLITOOLS_API_KEY=
${
  target.isLocal
    ? `
# The sample app bundled in ./sample-app serves ${target.url} and is used by
# default. Point this at another copy to override it.
SAMPLE_APP_DIR=
`
    : ""
}`;

    const gitignore = `node_modules/
.env
test-results/
playwright-report/
`;

    const files: ProjectFile[] = [
      { path: "package.json", contents: packageJson, language: "json" },
      {
        path: `playwright.config.${ext}`,
        contents: playwrightConfig,
        language,
      },
      {
        path: "applitools.config.js",
        contents: applitoolsConfig,
        language: "javascript",
      },
      ...(target.isLocal
        ? [
            {
              path: "sample-app.js",
              contents: render(SAMPLE_APP_JS, vars),
              language: "javascript" as const,
            },
            // The sample app itself, so the project has a real target without
            // needing a checkout of eyes-capabilities-generator.
            ...SAMPLE_APP_FILES.map((file) => ({
              ...file,
              path: `sample-app/${file.path}`,
            })),
          ]
        : []),
      ...LEVELS.map((level) => ({
        path: `tests/${vars.PROJECT_SLUG}.${level.id}.spec.${ext}`,
        contents: testFile(level, ts, checkpoint, target, industry.dynamicRegions),
        language,
      })),
      { path: ".env.example", contents: envExample, language: "env" },
      { path: ".gitignore", contents: gitignore, language: "text" },
      { path: "README.md", contents: render(README, vars), language: "markdown" },
    ];

    const primary = LEVELS[2]; // Layout, as the preview snippet.
    return {
      filename: `tests/${vars.PROJECT_SLUG}.${primary.id}.spec.${ext}`,
      language,
      code: testFile(primary, ts, checkpoint, target, industry.dynamicRegions),
      files,
    };
  },
};
