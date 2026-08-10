import type {
  FrameworkGenerator,
  GeneratorOptions,
  IndustryPreset,
  IndustryRegion,
  MatchLevel,
  ProjectFile,
  Viewport,
} from "../types";
import { SAMPLE_APP_FILES } from "../sample-app.generated";

/**
 * WebdriverIO generator. Same "runnable project" shape as `playwright.ts`,
 * `cypress.ts`, and `selenium.ts` — config, a launcher for the industry's
 * sample app, and one full-window check per match level (Strict / Exact /
 * Layout, no locators) — built on the `@applitools/eyes-webdriverio`
 * quickstart.
 *
 * Note this SDK is *not* wired in as a WDIO service: the quickstart uses the
 * `Eyes` class directly inside the spec, driving WDIO's global `browser`:
 *
 *   - a `ClassicRunner` or `VisualGridRunner` shared by the suite
 *   - `Configuration` + `BatchInfo` -> `eyes.setConfiguration(config)`
 *   - `eyes.open(browser, appName, testName, new RectangleSize(w, h))`
 *   - `eyes.check(name, Target.window().fully().matchLevel(...))`
 *   - `eyes.closeAsync()` per test, `runner.getAllTestResults()` at the end
 *
 * Mocha is the test framework (WDIO's default, matching Applitools' official
 * example), and `start-server-and-test` boots the sample app when the preset
 * points at a local one.
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
 * Name Eyes records for the checkpoint: the app under test, the industry, then
 * the checkpoint itself — "Acme Bank — Finance — Login". Composing all three
 * keeps a step identifiable in the dashboard, where checkpoints from different
 * industries otherwise share generic names like "Login".
 */
function checkpointTag(industry: IndustryPreset): string {
  const first = industry.checkpoints[0] ?? "Login";
  return jsString(`${industry.appName} — ${industry.label} — ${first}`);
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
 * The fluent region calls to append to `Target.window()`, one per Eyes region
 * bucket, preserving the order the preset lists them in.
 */
function regionCalls(regions: IndustryRegion[] = []): string {
  const grouped = new Map<string, string[]>();
  for (const region of regions) {
    const key = REGION_KEYS[region.matchLevel];
    if (!key) continue;
    grouped.set(key, [...(grouped.get(key) ?? []), region.selector]);
  }

  return [...grouped]
    .map(
      ([key, selectors]) => `
        .${key}(
${selectors.map((s) => `          "${jsString(s)}",`).join("\n")}
        )`,
    )
    .join("");
}

/** Ultrafast Grid browser matrix — Chrome, Firefox, and Safari on the primary viewport. */
function gridBrowsers(viewport: Viewport): string {
  return `      config.addBrowser(${viewport.width}, ${viewport.height}, BrowserType.CHROME);
      config.addBrowser(${viewport.width}, ${viewport.height}, BrowserType.FIREFOX);
      config.addBrowser(${viewport.width}, ${viewport.height}, BrowserType.SAFARI);`;
}

function testFile(
  level: (typeof LEVELS)[number],
  ts: boolean,
  opts: {
    appName: string;
    batchName: string;
    checkpoint: string;
    tag: string;
    target: SampleTarget;
    regions?: IndustryRegion[];
    viewport: Viewport;
    useUltrafastGrid: boolean;
  },
): string {
  const {
    appName,
    batchName,
    checkpoint,
    tag,
    target,
    regions,
    viewport,
    useUltrafastGrid,
  } = opts;
  const testName = `${checkpoint} — ${level.label} match level`;

  const imports = ts
    ? `import {
  BatchInfo,
  BrowserType,
  ClassicRunner,
  Configuration,
  Eyes,
  EyesRunner,
  RectangleSize,
  RunnerOptions,
  Target,
  VisualGridRunner,
} from "@applitools/eyes-webdriverio";`
    : `const {
  BatchInfo,
  BrowserType,
  ClassicRunner,
  Configuration,
  Eyes,
  RectangleSize,
  RunnerOptions,
  Target,
  VisualGridRunner,
} = require("@applitools/eyes-webdriverio");`;

  const decls = ts
    ? `  let runner: EyesRunner;
  let eyes: Eyes;`
    : `  let runner;
  let eyes;`;

  return `${imports}

// Flip this to switch runners. When true, the Ultrafast Grid re-renders the
// captured DOM across every browser added below without launching them
// locally; when false, a ClassicRunner captures on this machine only.
const USE_ULTRAFAST_GRID = ${useUltrafastGrid};

// Resolved against wdio.conf's baseUrl (${jsString(target.origin)}).
const SAMPLE_PATH = "${jsString(target.path)}";

describe("${testName}", () => {
${decls}

  before(() => {
    runner = USE_ULTRAFAST_GRID
      ? new VisualGridRunner(RunnerOptions().testConcurrency(5))
      : new ClassicRunner();
  });

  beforeEach(async () => {
    // Eyes reads APPLITOOLS_API_KEY from the environment (loaded from .env in
    // wdio.conf), so no key is ever hard-coded here.
    const config = new Configuration();
    config.setBatch(new BatchInfo("${batchName}"));

    if (USE_ULTRAFAST_GRID) {
${gridBrowsers(viewport)}
    }

    eyes = new Eyes(runner);
    eyes.setConfiguration(config);

    // \`browser\` is WebdriverIO's global session object.
    await eyes.open(
      browser,
      "${appName}",
      "${testName}",
      new RectangleSize(${viewport.width}, ${viewport.height}),
    );
  });

  // One checkpoint, one match level, no locators — just a full-window check.
  // The region calls cover elements that legitimately drift between runs
  // (live clocks, async-loaded charts, counters).
  it("matches the sample page", async () => {
    await browser.url(SAMPLE_PATH);

    await eyes.check(
      "${tag}",
      Target.window()
        .fully()
        .matchLevel("${level.matchLevel}")${regionCalls(regions)},
    );
  });

  afterEach(async () => {
    // closeAsync() does not block; results are collected in the after hook.
    await eyes.closeAsync();
  });

  after(async () => {
    // Pass false so a visual difference reports instead of throwing here.
    const results = await runner.getAllTestResults(false);
    console.log(results);
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

const README = `# {{APP_NAME}} — Applitools Eyes starter (WebdriverIO)

A minimal, runnable Applitools Eyes project pointed at the {{INDUSTRY_LABEL}}
sample page ({{SAMPLE_URL}}). It runs the **same** page through three visual
checkpoints — one per match level — so you can see how each behaves:

- \`test/{{PROJECT_SLUG}}.strict.test.{{EXT}}\` — **Strict** match level
- \`test/{{PROJECT_SLUG}}.exact.test.{{EXT}}\` — **Exact** match level
- \`test/{{PROJECT_SLUG}}.layout.test.{{EXT}}\` — **Layout** match level

Each test is the standard Eyes WebdriverIO flow — a shared runner, then
\`eyes.open\` / \`eyes.check(Target.window().fully()...)\` / \`eyes.closeAsync\`,
with one full-window check and no locators.

## 1. Install

\`\`\`bash
npm install
\`\`\`

You also need Chrome installed. WebdriverIO 9 manages the driver automatically.

## 2. Add your Applitools API key

\`\`\`bash
cp .env.example .env
# then edit .env and paste your APPLITOOLS_API_KEY
\`\`\`

Get a key from the [Applitools dashboard](https://eyes.applitools.com).

{{RUN_SECTION}}
## Headed or headless

Tests run **headed** by default, so a Chrome window opens and you can watch the
{{INDUSTRY_LABEL}} sample page render as the checkpoint is captured.

\`\`\`bash
npm test                  # headed (default)
npm run test:headless     # headless
HEADLESS=1 npm test       # headless, one-off
\`\`\`

\`HEADLESS\` is read in \`wdio.conf\` and adds \`--headless=new\` to the Chrome
capabilities. Use it in CI — a headed browser needs a display, so \`npm test\`
will fail on a bare CI runner.

## Ultrafast Grid

Each spec has a \`USE_ULTRAFAST_GRID\` constant at the top. When true, the
checkpoint is rendered across every browser added via \`config.addBrowser(...)\`
without launching them locally. When false, a \`ClassicRunner\` captures on this
machine only.
`;

const RUN_LOCAL = `## 3. Run

\`\`\`bash
npm test
\`\`\`

That is everything — the sample app ships with this project.
\`start-server-and-test\` boots it, waits for {{SAMPLE_URL}}, runs the WDIO
suite, then shuts the server down.

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

`;

export const webdriverio: FrameworkGenerator = {
  id: "webdriverio",
  label: "WebdriverIO",
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

    const viewports = industry.viewports.length
      ? industry.viewports
      : [{ width: 1440, height: 900 }];
    const primaryViewport = viewports[0];

    const testOpts = {
      appName: vars.APP_NAME,
      batchName: vars.BATCH_NAME,
      checkpoint: checkpointName(industry.checkpoints),
      tag: checkpointTag(industry),
      target,
      regions: industry.dynamicRegions,
      viewport: primaryViewport,
      useUltrafastGrid,
    };

    const packageJson = JSON.stringify(
      {
        name: `${vars.PROJECT_SLUG}-eyes-webdriverio`,
        version: "1.0.0",
        private: true,
        scripts: {
          ...(target.isLocal ? { "start:sample": "node sample-app.js" } : {}),
          wdio: "wdio run ./wdio.conf." + ext,
          "wdio:headless": `cross-env HEADLESS=1 wdio run ./wdio.conf.${ext}`,
          test: target.isLocal
            ? `start-server-and-test start:sample ${target.url} wdio`
            : "wdio run ./wdio.conf." + ext,
          "test:headless": target.isLocal
            ? `start-server-and-test start:sample ${target.url} wdio:headless`
            : `cross-env HEADLESS=1 wdio run ./wdio.conf.${ext}`,
        },
        devDependencies: {
          "@applitools/eyes-webdriverio": "^5.61.0",
          "cross-env": "^7.0.3",
          "@wdio/cli": "^9.0.0",
          "@wdio/local-runner": "^9.0.0",
          "@wdio/mocha-framework": "^9.0.0",
          "@wdio/spec-reporter": "^9.0.0",
          dotenv: "^16.4.0",
          ...(target.isLocal ? { "start-server-and-test": "^2.0.0" } : {}),
          ...(ts
            ? {
                "@types/mocha": "^10.0.0",
                "@types/node": "^22.0.0",
                "ts-node": "^10.9.0",
                typescript: "^5.7.0",
              }
            : {}),
        },
      },
      null,
      2,
    );

    // Headed by default so the sample app is visible while the test runs.
    const headlessConst = `// Headed by default, so you can watch the sample app render while the
// checkpoint is captured. Set HEADLESS=1 (or run \`npm run test:headless\`) for a
// headless run — that is what you want in CI.
const headless = process.env.HEADLESS === "1" || process.env.HEADLESS === "true";`;

    const capabilities = `[
      {
        browserName: "chrome",
        "goog:chromeOptions": {
          args: headless ? ["--headless=new", "--disable-gpu"] : [],
        },
      },
    ]`;

    const wdioConfig = ts
      ? `import "dotenv/config";

${headlessConst}

export const config: WebdriverIO.Config = {
  runner: "local",
  specs: ["./test/**/*.test.ts"],
  maxInstances: 1,
  capabilities: ${capabilities},
  logLevel: "error",
  baseUrl: "${target.origin}",
  waitforTimeout: 10000,
  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    timeout: 120000,
  },
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      project: "./tsconfig.json",
      transpileOnly: true,
    },
  },
};
`
      : `require("dotenv").config();

${headlessConst}

exports.config = {
  runner: "local",
  specs: ["./test/**/*.test.js"],
  maxInstances: 1,
  capabilities: ${capabilities},
  logLevel: "error",
  baseUrl: "${target.origin}",
  waitforTimeout: 10000,
  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    timeout: 120000,
  },
};
`;

    const tsconfig = JSON.stringify(
      {
        compilerOptions: {
          target: "es2022",
          module: "commonjs",
          lib: ["es2022", "dom"],
          types: [
            "node",
            "@wdio/globals/types",
            "@wdio/mocha-framework",
            "expect-webdriverio",
          ],
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          noEmit: true,
        },
        include: ["test/**/*.ts", "wdio.conf.ts"],
      },
      null,
      2,
    );

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
logs/
`;

    const files: ProjectFile[] = [
      { path: "package.json", contents: packageJson, language: "json" },
      { path: `wdio.conf.${ext}`, contents: wdioConfig, language },
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
        path: `test/${vars.PROJECT_SLUG}.${level.id}.test.${ext}`,
        contents: testFile(level, ts, testOpts),
        language,
      })),
      ...(ts
        ? [
            {
              path: "tsconfig.json",
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
      filename: `test/${vars.PROJECT_SLUG}.${primary.id}.test.${ext}`,
      language,
      code: testFile(primary, ts, testOpts),
      files,
    };
  },
};
