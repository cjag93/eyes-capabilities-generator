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
 * Selenium (JavaScript / TypeScript) generator. Same "runnable project" shape
 * as `playwright.ts` and `cypress.ts` — config, a launcher for the industry's
 * sample app, and one full-window check per match level (Dynamic / Exact /
 * Layout, no locators) — built on the `@applitools/eyes-selenium` quickstart:
 *
 *   - a `ClassicRunner` or `VisualGridRunner` shared by the suite
 *   - `Configuration` + `BatchInfo` -> `eyes.setConfiguration(config)`
 *   - `eyes.open(driver, appName, testName, new RectangleSize(w, h))`
 *   - `eyes.check(Target.window().fully().withName(...).matchLevel(...))`
 *   - `eyes.closeAsync()` per test, `runner.getAllTestResults()` at the end
 *
 * Jest is the test runner (matching Applitools' official example project), and
 * `start-server-and-test` boots the sample app when the preset points at a
 * local one, because Selenium has no equivalent of Playwright's `webServer`.
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
    ? `import { Builder, WebDriver } from "selenium-webdriver";
import { Options as ChromeOptions } from "selenium-webdriver/chrome";
import {
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
} from "@applitools/eyes-selenium";`
    : `const { Builder } = require("selenium-webdriver");
const { Options: ChromeOptions } = require("selenium-webdriver/chrome");
const {
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
} = require("@applitools/eyes-selenium");`;

  const decls = ts
    ? `  let runner: EyesRunner;
  let driver: WebDriver;
  let eyes: Eyes;`
    : `  let runner;
  let driver;
  let eyes;`;

  return `${imports}

// Flip this to switch runners. When true, the Ultrafast Grid re-renders the
// captured DOM across every browser added below without launching them
// locally; when false, a ClassicRunner captures on this machine only.
const USE_ULTRAFAST_GRID = ${useUltrafastGrid};

// The ${jsString(appName)} sample page under test.
const SAMPLE_URL = "${jsString(target.url)}";

describe("${testName}", () => {
${decls}

  beforeAll(() => {
    runner = USE_ULTRAFAST_GRID
      ? new VisualGridRunner(RunnerOptions().testConcurrency(5))
      : new ClassicRunner();
  });

  beforeEach(async () => {
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(new ChromeOptions().addArguments("--headless=new"))
      .build();

    // Eyes reads APPLITOOLS_API_KEY from the environment (loaded from .env by
    // jest.config's setupFiles), so no key is ever hard-coded here.
    const config = new Configuration();
    config.setBatch(new BatchInfo("${batchName}"));

    if (USE_ULTRAFAST_GRID) {
${gridBrowsers(viewports)}
    }

    eyes = new Eyes(runner);
    eyes.setConfiguration(config);

    await eyes.open(
      driver,
      "${appName}",
      "${testName}",
      new RectangleSize(${viewport.width}, ${viewport.height}),
    );
  }, 60000);

  // One checkpoint, one match level, no locators — just a full-window check.
  // The region calls cover elements that legitimately drift between runs
  // (live clocks, async-loaded charts, counters).
  test("matches the sample page", async () => {
    await driver.get(SAMPLE_URL);

    await eyes.check(
      Target.window()
        .fully()
        .withName("${checkpoint}")
        .matchLevel("${level.matchLevel}")${regionCalls(regions)},
    );
  }, 60000);

  afterEach(async () => {
    // closeAsync() does not block; results are collected in afterAll.
    await eyes.closeAsync();
    await driver.quit();
  }, 60000);

  afterAll(async () => {
    // Pass false so a visual difference reports instead of throwing here.
    const results = await runner.getAllTestResults(false);
    console.log(results);
  }, 120000);
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

const README = `# {{APP_NAME}} — Applitools Eyes starter (Selenium)

A minimal, runnable Applitools Eyes project pointed at the {{INDUSTRY_LABEL}}
sample page ({{SAMPLE_URL}}). It runs the **same** page through three visual
checkpoints — one per match level — so you can see how each behaves:

- \`tests/{{PROJECT_SLUG}}.dynamic.test.{{EXT}}\` — **Dynamic** match level
- \`tests/{{PROJECT_SLUG}}.exact.test.{{EXT}}\` — **Exact** match level
- \`tests/{{PROJECT_SLUG}}.layout.test.{{EXT}}\` — **Layout** match level

Each test is the standard Eyes Selenium flow — a shared runner, then
\`eyes.open\` / \`eyes.check(Target.window().fully()...)\` / \`eyes.closeAsync\`,
with one full-window check and no locators.

## 1. Install

\`\`\`bash
npm install
\`\`\`

You also need Chrome installed. Selenium 4 resolves ChromeDriver automatically.

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

const RUN_LOCAL = `## 3. Run

\`\`\`bash
npm test
\`\`\`

That is everything — the sample app ships with this project.
\`start-server-and-test\` boots it, waits for {{SAMPLE_URL}}, runs Jest, then
shuts the server down.

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

export const selenium: FrameworkGenerator = {
  id: "selenium",
  label: "Selenium",
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
        name: `${vars.PROJECT_SLUG}-eyes-selenium`,
        version: "1.0.0",
        private: true,
        scripts: {
          ...(target.isLocal ? { "start:sample": "node sample-app.js" } : {}),
          jest: "jest",
          test: target.isLocal
            ? `start-server-and-test start:sample ${target.url} jest`
            : "jest",
        },
        devDependencies: {
          "@applitools/eyes-selenium": "^4.83.0",
          dotenv: "^16.4.0",
          jest: "^29.7.0",
          "selenium-webdriver": "^4.27.0",
          ...(target.isLocal ? { "start-server-and-test": "^2.0.0" } : {}),
          ...(ts
            ? {
                "@types/jest": "^29.5.0",
                "@types/selenium-webdriver": "^4.1.0",
                "ts-jest": "^29.2.0",
                typescript: "^5.7.0",
              }
            : {}),
        },
      },
      null,
      2,
    );

    const jestConfig = `${ts ? `/** @type {import("ts-jest").JestConfigWithTsJest} */\n` : ""}module.exports = {
${ts ? `  preset: "ts-jest",\n` : ""}  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.${ext}"],
  // Loads APPLITOOLS_API_KEY from .env before the suites run.
  setupFiles: ["dotenv/config"],
  testTimeout: 60000,
};
`;

    const tsconfig = JSON.stringify(
      {
        compilerOptions: {
          target: "es2020",
          module: "commonjs",
          lib: ["es2020", "dom"],
          types: ["node", "jest"],
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          noEmit: true,
        },
        include: ["tests/**/*.ts"],
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
`;

    const files: ProjectFile[] = [
      { path: "package.json", contents: packageJson, language: "json" },
      { path: "jest.config.js", contents: jestConfig, language: "javascript" },
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
        path: `tests/${vars.PROJECT_SLUG}.${level.id}.test.${ext}`,
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
      filename: `tests/${vars.PROJECT_SLUG}.${primary.id}.test.${ext}`,
      language,
      code: testFile(primary, ts, testOpts),
      files,
    };
  },
};
