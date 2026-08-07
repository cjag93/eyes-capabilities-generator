import type {
  FrameworkGenerator,
  GeneratorOptions,
  MatchLevel,
  ProjectFile,
  Viewport,
} from "../types";

/**
 * Selenium (JavaScript / TypeScript) generator. Same "runnable project" shape
 * as `playwright.ts` and `cypress.ts` — config, an industry-themed sample login
 * page, and one full-window check per match level (Dynamic / Exact / Layout, no
 * locators) — built on the `@applitools/eyes-selenium` quickstart:
 *
 *   - a `ClassicRunner` or `VisualGridRunner` shared by the suite
 *   - `Configuration` + `BatchInfo` -> `eyes.setConfiguration(config)`
 *   - `eyes.open(driver, appName, testName, new RectangleSize(w, h))`
 *   - `eyes.check(Target.window().fully().withName(...).matchLevel(...))`
 *   - `eyes.closeAsync()` per test, `runner.getAllTestResults()` at the end
 *
 * Jest is the test runner (matching Applitools' official example project), and
 * `start-server-and-test` boots `serve.js` because Selenium has no equivalent
 * of Playwright's `webServer`.
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
    viewport: Viewport;
    viewports: Viewport[];
    useUltrafastGrid: boolean;
  },
): string {
  const { appName, batchName, checkpoint, viewport, viewports, useUltrafastGrid } =
    opts;
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
  test("matches the login page", async () => {
    await driver.get("http://localhost:8080/login.html");

    await eyes.check(
      Target.window()
        .fully()
        .withName("${checkpoint}")
        .matchLevel("${level.matchLevel}"),
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

const LOGIN_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{APP_NAME}} — Sign in</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        background: #eef4f8;
        color: #0f2233;
      }
      .card {
        width: 360px;
        padding: 32px;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(15, 34, 51, 0.08);
      }
      .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
      .brand .dot { width: 28px; height: 28px; border-radius: 8px; background: #0b8f6a; }
      .brand h1 { font-size: 18px; margin: 0; }
      .brand span { display: block; font-size: 12px; color: #5b7385; font-weight: 500; }
      label { display: block; font-size: 13px; font-weight: 600; margin: 16px 0 6px; }
      input {
        width: 100%; padding: 10px 12px; border: 1px solid #d5e0e8;
        border-radius: 10px; font-size: 14px;
      }
      button {
        margin-top: 24px; width: 100%; padding: 11px; border: 0;
        border-radius: 10px; background: #0b8f6a; color: #fff;
        font-size: 15px; font-weight: 600; cursor: pointer;
      }
      .foot { margin-top: 16px; text-align: center; font-size: 12px; color: #5b7385; }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="brand">
        <div class="dot"></div>
        <div>
          <h1>{{APP_NAME}}</h1>
          <span>{{INDUSTRY_LABEL}} portal</span>
        </div>
      </div>
      <form onsubmit="return false">
        <label for="email">Email</label>
        <input id="email" type="email" placeholder="you@example.com" />
        <label for="password">Password</label>
        <input id="password" type="password" placeholder="••••••••" />
        <button type="submit">Sign in</button>
      </form>
      <p class="foot">Authorized access only — demo page for visual testing.</p>
    </main>
  </body>
</html>
`;

const SERVE_JS = `const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "pages");
const port = 8080;
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };

http
  .createServer((req, res) => {
    const urlPath = req.url === "/" ? "/login.html" : req.url.split("?")[0];
    const file = path.join(root, path.normalize(urlPath));
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
      });
      res.end(data);
    });
  })
  .listen(port, () => console.log("Serving pages/ on http://localhost:" + port));
`;

const README = `# {{APP_NAME}} — Applitools Eyes starter (Selenium)

A minimal, runnable Applitools Eyes project for the {{INDUSTRY_LABEL}} login
page. It runs the **same** page through three visual checkpoints — one per
match level — so you can see how each behaves:

- \`tests/login.dynamic.test.{{EXT}}\` — **Dynamic** match level
- \`tests/login.exact.test.{{EXT}}\` — **Exact** match level
- \`tests/login.layout.test.{{EXT}}\` — **Layout** match level

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

## 3. Run

\`\`\`bash
npm test
\`\`\`

\`start-server-and-test\` boots \`serve.js\` (which serves \`pages/login.html\` on
port 8080), runs Jest, then shuts the server down — so everything runs with no
external dependencies.

## Ultrafast Grid

Each spec has a \`USE_ULTRAFAST_GRID\` constant at the top. When true, the
checkpoint is rendered across every browser added via \`config.addBrowser(...)\`
without launching them locally. When false, a \`ClassicRunner\` captures on this
machine only.
`;

export const selenium: FrameworkGenerator = {
  id: "selenium",
  label: "Selenium",
  supportedLanguages: ["javascript", "typescript"],
  generate({ language, useUltrafastGrid, industry }: GeneratorOptions) {
    const ts = language === "typescript";
    const ext = ts ? "ts" : "js";
    const vars = {
      APP_NAME: industry.appName,
      BATCH_NAME: industry.batchName,
      INDUSTRY_LABEL: industry.label,
      PROJECT_SLUG: industry.id,
      EXT: ext,
    };

    const viewports = industry.viewports.length
      ? industry.viewports
      : [{ width: 1440, height: 900 }];
    const primaryViewport = viewports[0];

    const testOpts = {
      appName: vars.APP_NAME,
      batchName: vars.BATCH_NAME,
      checkpoint: checkpointName(industry.checkpoints),
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
          start: "node serve.js",
          jest: "jest",
          test: "start-server-and-test start http://localhost:8080/login.html jest",
        },
        devDependencies: {
          "@applitools/eyes-selenium": "^4.83.0",
          dotenv: "^16.4.0",
          jest: "^29.7.0",
          "selenium-webdriver": "^4.27.0",
          "start-server-and-test": "^2.0.0",
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
`;

    const gitignore = `node_modules/
.env
`;

    const files: ProjectFile[] = [
      { path: "package.json", contents: packageJson, language: "json" },
      { path: "jest.config.js", contents: jestConfig, language: "javascript" },
      { path: "serve.js", contents: SERVE_JS, language: "javascript" },
      {
        path: "pages/login.html",
        contents: render(LOGIN_HTML, vars),
        language: "html",
      },
      ...LEVELS.map((level) => ({
        path: `tests/login.${level.id}.test.${ext}`,
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
      filename: `tests/login.${primary.id}.test.${ext}`,
      language,
      code: testFile(primary, ts, testOpts),
      files,
    };
  },
};
