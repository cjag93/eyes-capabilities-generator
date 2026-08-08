import type {
  FrameworkGenerator,
  GeneratorOptions,
  IndustryPreset,
  IndustryRegion,
  MatchLevel,
  ProjectFile,
  Viewport,
} from "../types";

/**
 * WebdriverIO generator. Same "runnable project" shape as `playwright.ts`,
 * `cypress.ts`, and `selenium.ts` — config, a launcher for the industry's
 * sample app, and one full-window check per match level (Dynamic / Exact /
 * Layout, no locators) — built on the `@applitools/eyes-webdriverio`
 * quickstart.
 *
 * Note this SDK is *not* wired in as a WDIO service: the quickstart uses the
 * `Eyes` class directly inside the spec, driving WDIO's global `browser`:
 *
 *   - a `ClassicRunner` or `VisualGridRunner` shared by the suite
 *   - `Configuration` + `BatchInfo` -> `eyes.setConfiguration(config)`
 *   - `eyes.open(browser, appName, testName, new RectangleSize(w, h))`
 *   - `eyes.check(Target.window().fully().withName(...).matchLevel(...))`
 *   - `eyes.closeAsync()` per test, `runner.getAllTestResults()` at the end
 *
 * Mocha is the test framework (WDIO's default, matching Applitools' official
 * example), and `start-server-and-test` boots the sample app when the preset
 * points at a local one.
 */

const LEVELS: { id: MatchLevel; label: string; matchLevel: string }[] = [
  { id: "dynamic", label: "Dynamic", matchLevel: "Dynamic" },
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
  dynamic: "dynamicRegions",
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

/** Ultrafast Grid browser matrix, derived from the industry's viewports. */
function gridBrowsers(viewports: Viewport[]): string {
  const desktop = viewports
    .map(
      (v) =>
        `      config.addBrowser(${v.width}, ${v.height}, BrowserType.CHROME);
      config.addBrowser(${v.width}, ${v.height}, BrowserType.FIREFOX);`,
    )
    .join("\n");

  return `${desktop}
      config.addDeviceEmulation(DeviceName.Pixel_2, ScreenOrientation.PORTRAIT);`;
}

function testFile(
  level: (typeof LEVELS)[number],
  ts: boolean,
  opts: {
    appName: string;
    batchName: string;
    checkpoint: string;
    target: SampleTarget;
    regions?: IndustryRegion[];
    viewport: Viewport;
    viewports: Viewport[];
    useUltrafastGrid: boolean;
  },
): string {
  const {
    appName,
    batchName,
    checkpoint,
    target,
    regions,
    viewport,
    viewports,
    useUltrafastGrid,
  } = opts;
  const testName = `${checkpoint} — ${level.label} match level`;

  const imports = ts
    ? `import {
  BatchInfo,
  BrowserType,
  ClassicRunner,
  Configuration,
  DeviceName,
  Eyes,
  EyesRunner,
  RectangleSize,
  RunnerOptions,
  ScreenOrientation,
  Target,
  VisualGridRunner,
} from "@applitools/eyes-webdriverio";`
    : `const {
  BatchInfo,
  BrowserType,
  ClassicRunner,
  Configuration,
  DeviceName,
  Eyes,
  RectangleSize,
  RunnerOptions,
  ScreenOrientation,
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
${gridBrowsers(viewports)}
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
      Target.window()
        .fully()
        .withName("${checkpoint}")
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
 * Boots this repo's Next.js dev server so the sample page is reachable. Only
 * emitted for presets whose sampleUrl is local.
 */
const SAMPLE_APP_JS = `// Starts the {{INDUSTRY_LABEL}} sample app that serves {{SAMPLE_URL}}.
// The sample page lives in the eyes-capabilities-generator repo, so point
// SAMPLE_APP_DIR at your checkout if it is not in the default location.
const { spawn } = require("child_process");
const path = require("path");

const appDir = path.resolve(
  process.env.SAMPLE_APP_DIR || path.join("..", "eyes-capabilities-generator"),
);

console.log("Starting the {{INDUSTRY_LABEL}} sample app from " + appDir);

const child = spawn("npm", ["run", "dev"], {
  cwd: appDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("error", (error) => {
  console.error("Could not start the sample app from " + appDir);
  console.error("Set SAMPLE_APP_DIR to your eyes-capabilities-generator checkout.");
  console.error(error.message);
  process.exit(1);
});

child.on("exit", (code) => process.exit(code === null ? 1 : code));
`;

const README = `# {{APP_NAME}} — Applitools Eyes starter (WebdriverIO)

A minimal, runnable Applitools Eyes project pointed at the {{INDUSTRY_LABEL}}
sample page ({{SAMPLE_URL}}). It runs the **same** page through three visual
checkpoints — one per match level — so you can see how each behaves:

- \`test/{{PROJECT_SLUG}}.dynamic.test.{{EXT}}\` — **Dynamic** match level
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
## Ultrafast Grid

Each spec has a \`USE_ULTRAFAST_GRID\` constant at the top. When true, the
checkpoint is rendered across every browser added via \`config.addBrowser(...)\`
without launching them locally. When false, a \`ClassicRunner\` captures on this
machine only.
`;

const RUN_LOCAL = `## 3. Point at the sample app

The {{INDUSTRY_LABEL}} sample page is served by the
\`eyes-capabilities-generator\` repo. \`sample-app.js\` starts it for you, but it
needs to know where the repo is. It defaults to
\`../eyes-capabilities-generator\`; override it in \`.env\`:

\`\`\`bash
SAMPLE_APP_DIR=/path/to/eyes-capabilities-generator
\`\`\`

## 4. Run

\`\`\`bash
npm test
\`\`\`

\`start-server-and-test\` boots the sample app, waits for {{SAMPLE_URL}}, runs
the WDIO suite, then shuts the server down.

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
      target,
      regions: industry.dynamicRegions,
      viewport: primaryViewport,
      viewports,
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
          test: target.isLocal
            ? `start-server-and-test start:sample ${target.url} wdio`
            : "wdio run ./wdio.conf." + ext,
        },
        devDependencies: {
          "@applitools/eyes-webdriverio": "^5.61.0",
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

    // Headless Chrome so `npm test` works in CI with no display.
    const capabilities = `[
      {
        browserName: "chrome",
        "goog:chromeOptions": {
          args: ["--headless=new", "--disable-gpu"],
        },
      },
    ]`;

    const wdioConfig = ts
      ? `import "dotenv/config";

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
# Where the eyes-capabilities-generator repo lives, so sample-app.js can serve
# ${target.url}. Defaults to ../eyes-capabilities-generator.
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
