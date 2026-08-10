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
 * Cypress generator. Same "runnable project" shape as `playwright.ts` — config,
 * a launcher for the industry's sample app, and one full-window check per match
 * level (Strict / Exact / Layout, no locators) — but built on the
 * `@applitools/eyes-cypress` quickstart:
 *
 *   - `cypress.config` is wrapped in `eyesPlugin(defineConfig({ ... }))`
 *   - the support file imports `@applitools/eyes-cypress/commands`
 *   - each test is `cy.eyesOpen()` -> `cy.eyesCheckWindow()` -> `cy.eyesClose()`
 *
 * Cypress has no built-in `webServer`, so `start-server-and-test` boots the
 * sample app when the preset points at a local one.
 */

const LEVELS: { id: MatchLevel; label: string; matchLevel: string }[] = [
  { id: "strict", label: "Strict", matchLevel: "Strict" },
  { id: "exact", label: "Exact", matchLevel: "Exact" },
  { id: "layout", label: "Layout", matchLevel: "Layout" },
];

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
 * sample app itself. Presets with a real sample page under `app/samples/*`
 * point at this repo's dev server; catalog-only presets point at a public demo
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
  appName: string,
  viewport: { width: number; height: number },
  checkpoint: string,
  target: SampleTarget,
  regions: IndustryRegion[] = [],
): string {
  const testName = `${checkpoint} — ${level.label} match level`;

  // Elements the preset flags as legitimately unstable, so the check does not
  // fail on expected drift (live clocks, async-loaded charts, counters).
  const regionEntries = groupRegions(regions)
    .map(
      ([key, selectors]) => `
      ${key}: [
${selectors.map((s) => `        "${jsString(s)}",`).join("\n")}
      ],`,
    )
    .join("");

  return `describe("${testName}", () => {
  beforeEach(() => {
    cy.eyesOpen({
      appName: "${appName}",
      testName: "${testName}",
      browser: { width: ${viewport.width}, height: ${viewport.height} },
    });
  });

  afterEach(() => {
    cy.eyesClose();
  });

  // One checkpoint, one match level, no locators — just a full-window check.
  it("matches the sample page", () => {
    cy.visit("${jsString(target.path)}");
    cy.eyesCheckWindow({
      tag: "${checkpoint}",
      target: "window",
      fully: true,
      matchLevel: "${level.matchLevel}",${regionEntries}
    });
  });
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

const README = `# {{APP_NAME}} — Applitools Eyes starter (Cypress)

A minimal, runnable Applitools Eyes project pointed at the {{INDUSTRY_LABEL}}
sample page ({{SAMPLE_URL}}). It runs the **same** page through three visual
checkpoints — one per match level — so you can see how each behaves:

- \`cypress/e2e/{{PROJECT_SLUG}}.strict.cy.{{EXT}}\` — **Strict** match level
- \`cypress/e2e/{{PROJECT_SLUG}}.exact.cy.{{EXT}}\` — **Exact** match level
- \`cypress/e2e/{{PROJECT_SLUG}}.layout.cy.{{EXT}}\` — **Layout** match level

Each test is the standard Eyes Cypress trio — \`cy.eyesOpen\`,
\`cy.eyesCheckWindow\`, \`cy.eyesClose\` — with one full-window check and no
locators.

## 1. Install

\`\`\`bash
npm install
\`\`\`

## 2. Add your Applitools API key

\`\`\`bash
cp .env.example .env
# then edit .env and paste your APPLITOOLS_API_KEY
\`\`\`

Get a key from the [Applitools dashboard](https://eyes.applitools.com).

{{RUN_SECTION}}
## Headed or headless

Tests run **headed** by default, so a browser window opens and you can watch the
{{INDUSTRY_LABEL}} sample page render as the checkpoint is captured.

\`\`\`bash
npm test                     # headed (default)
npm run test:headless        # headless
npm run cy:run -- --browser firefox   # extra Cypress flags pass through
\`\`\`

Cypress decides this with the \`--headed\` / \`--headless\` CLI flags rather than a
config option, so the two scripts above are the switch — there is no
\`headless\` key in \`cypress.config\` to change. (Note \`cypress run\` on its own is
headless; the \`test\` script adds \`--headed\` to flip the default.)

Use headless in CI — a headed browser needs a display, so \`npm test\` will fail
on a bare CI runner.
`;

const RUN_LOCAL = `## 3. Run

\`\`\`bash
npm test
\`\`\`

That is everything — the sample app ships with this project.
\`start-server-and-test\` boots it, waits for {{SAMPLE_URL}}, runs Cypress
headlessly, then shuts the server down.

To open the Cypress runner interactively instead:

\`\`\`bash
npm run start:sample   # in one terminal
npm run cy:open        # in another
\`\`\`

## The bundled sample app

\`sample-app/\` is a self-contained Next.js copy of the industry sample pages,
including {{SAMPLE_URL}}. \`sample-app.js\` installs its dependencies on first
run (so the first \`npm test\` takes a minute) and then serves it.

To test a different copy — a checkout of \`eyes-capabilities-generator\`, say —
set \`SAMPLE_APP_DIR\` in \`.env\`.

You can browse the other industries' pages too; they are all included under
\`sample-app/app/samples/\`.
`;

const RUN_REMOTE = `## 3. Run

\`\`\`bash
npm test
\`\`\`

The tests hit {{SAMPLE_URL}} directly, so there is nothing to start locally.

To open the Cypress runner interactively instead:

\`\`\`bash
npm run cy:open
\`\`\`
`;

export const cypress: FrameworkGenerator = {
  id: "cypress",
  label: "Cypress",
  supportedLanguages: ["javascript", "typescript"],
  generate({ language, useUltrafastGrid, industry }: GeneratorOptions) {
    const ts = language === "typescript";
    const ext = ts ? "ts" : "js";
    const target = sampleTarget(industry);
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

    const primaryViewport = industry.viewports[0] ?? {
      width: 1440,
      height: 900,
    };

    const packageJson = JSON.stringify(
      {
        name: `${vars.PROJECT_SLUG}-eyes-cypress`,
        version: "1.0.0",
        private: true,
        scripts: {
          ...(target.isLocal ? { "start:sample": "node sample-app.js" } : {}),
          "cy:open": "cypress open",
          // Headed by default so the sample app is visible while the test runs.
          "cy:run": "cypress run --headed",
          "cy:run:headless": "cypress run --headless",
          test: target.isLocal
            ? `start-server-and-test start:sample ${target.url} cy:run`
            : "cypress run --headed",
          "test:headless": target.isLocal
            ? `start-server-and-test start:sample ${target.url} cy:run:headless`
            : "cypress run --headless",
        },
        devDependencies: {
          "@applitools/eyes-cypress": "^3.44.0",
          cypress: "^13.15.0",
          dotenv: "^16.4.0",
          ...(target.isLocal ? { "start-server-and-test": "^2.0.0" } : {}),
        },
      },
      null,
      2,
    );

    const cypressConfig = ts
      ? `import "dotenv/config";
import { defineConfig } from "cypress";
import eyesPlugin from "@applitools/eyes-cypress";

export default eyesPlugin(
  defineConfig({
    e2e: {
      baseUrl: "${target.origin}",
      supportFile: "cypress/support/e2e.ts",
      specPattern: "cypress/e2e/**/*.cy.ts",
      video: false,
      setupNodeEvents(on, config) {
        return config;
      },
    },
  }),
);
`
      : `require("dotenv").config();
const { defineConfig } = require("cypress");
const eyesPlugin = require("@applitools/eyes-cypress");

module.exports = eyesPlugin(
  defineConfig({
    e2e: {
      baseUrl: "${target.origin}",
      supportFile: "cypress/support/e2e.js",
      specPattern: "cypress/e2e/**/*.cy.js",
      video: false,
      setupNodeEvents(on, config) {
        return config;
      },
    },
  }),
);
`;

    // Registers cy.eyesOpen / cy.eyesCheckWindow / cy.eyesClose.
    const supportFile = `import "@applitools/eyes-cypress/commands";
`;

    // When UFG is on, emit at least three desktop browsers on the primary viewport.
    const browserConfig = useUltrafastGrid
      ? `[
    { width: ${primaryViewport.width}, height: ${primaryViewport.height}, name: "chrome" },
    { width: ${primaryViewport.width}, height: ${primaryViewport.height}, name: "firefox" },
    { width: ${primaryViewport.width}, height: ${primaryViewport.height}, name: "safari" },
  ]`
      : `{ width: ${primaryViewport.width}, height: ${primaryViewport.height}, name: "chrome" }`;

    const applitoolsConfig = `// Applitools reads APPLITOOLS_API_KEY from the environment (.env).
module.exports = {
  appName: "${vars.APP_NAME}",
  batchName: "${vars.BATCH_NAME}",
  browser: ${browserConfig},
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
cypress/screenshots/
cypress/videos/
`;

    const tsconfig = JSON.stringify(
      {
        compilerOptions: {
          target: "es2018",
          lib: ["es2018", "dom"],
          types: ["cypress", "@applitools/eyes-cypress"],
          esModuleInterop: true,
          skipLibCheck: true,
          noEmit: true,
        },
        include: ["**/*.ts"],
      },
      null,
      2,
    );

    const files: ProjectFile[] = [
      { path: "package.json", contents: packageJson, language: "json" },
      { path: `cypress.config.${ext}`, contents: cypressConfig, language },
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
      {
        path: `cypress/support/e2e.${ext}`,
        contents: supportFile,
        language,
      },
      ...LEVELS.map((level) => ({
        path: `cypress/e2e/${vars.PROJECT_SLUG}.${level.id}.cy.${ext}`,
        contents: testFile(
          level,
          vars.APP_NAME,
          primaryViewport,
          checkpoint,
          target,
          industry.dynamicRegions,
        ),
        language,
      })),
      ...(ts
        ? [
            {
              path: "cypress/tsconfig.json",
              contents: tsconfig,
              language: "json" as const,
            },
          ]
        : []),
      { path: ".env.example", contents: envExample, language: "env" },
      { path: ".gitignore", contents: gitignore, language: "text" },
      { path: "README.md", contents: render(README, vars), language: "markdown" },
    ];

    const primary = LEVELS[2]; // Layout, as the preview snippet.
    return {
      filename: `cypress/e2e/${vars.PROJECT_SLUG}.${primary.id}.cy.${ext}`,
      language,
      code: testFile(
        primary,
        vars.APP_NAME,
        primaryViewport,
        checkpoint,
        target,
        industry.dynamicRegions,
      ),
      files,
    };
  },
};
