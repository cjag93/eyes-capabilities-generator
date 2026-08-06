import type {
  FrameworkGenerator,
  GeneratorOptions,
  MatchLevel,
  ProjectFile,
} from "../types";

/**
 * Playwright generator (reference implementation of the "runnable project"
 * pattern). Given an industry preset it emits a bare-minimum, runnable
 * Applitools Eyes project: config, an industry-themed sample login page, and
 * one full-window `eyes.check` test per match level (Dynamic / Exact / Layout,
 * no locators).
 *
 * It works by token-substituting small templates. Person C: copy this shape for
 * Cypress / Selenium — same file set, different SDK syntax.
 */

const LEVELS: { id: MatchLevel; label: string; matchLevel: string }[] = [
  { id: "dynamic", label: "Dynamic", matchLevel: "Dynamic" },
  { id: "exact", label: "Exact", matchLevel: "Exact" },
  { id: "layout", label: "Layout", matchLevel: "Layout" },
];

function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

function testFile(
  level: (typeof LEVELS)[number],
  ts: boolean,
): string {
  const importLine = ts
    ? `import { test } from "@applitools/eyes-playwright/fixture";`
    : `const { test } = require("@applitools/eyes-playwright/fixture");`;

  return `${importLine}

// One checkpoint, one match level, no locators — just a full-window check.
test("Login — ${level.label} match level", async ({ page, eyes }) => {
  await page.goto("/login.html");
  await eyes.check("Login", { fully: true, matchLevel: "${level.matchLevel}" });
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
          <span>{{INDUSTRY_LABEL}} patient portal</span>
        </div>
      </div>
      <form onsubmit="return false">
        <label for="email">Email</label>
        <input id="email" type="email" placeholder="you@example.com" />
        <label for="password">Password</label>
        <input id="password" type="password" placeholder="••••••••" />
        <button type="submit">Sign in</button>
      </form>
      <p class="foot">Protected health information — authorized access only.</p>
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

const README = `# {{APP_NAME}} — Applitools Eyes starter (Playwright)

A minimal, runnable Applitools Eyes project for the {{INDUSTRY_LABEL}} login
page. It runs the **same** page through three visual checkpoints — one per
match level — so you can see how each behaves:

- \`tests/login.dynamic.spec\` — **Dynamic** match level
- \`tests/login.exact.spec\` — **Exact** match level
- \`tests/login.layout.spec\` — **Layout** match level

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

## 3. Run

\`\`\`bash
npm test
\`\`\`

The test server (\`serve.js\`) serves \`pages/login.html\` locally, so everything
runs with no external dependencies.
`;

export const playwright: FrameworkGenerator = {
  id: "playwright",
  label: "Playwright",
  supportedLanguages: ["javascript", "typescript"],
  generate({ language, industry }: GeneratorOptions) {
    const ts = language === "typescript";
    const ext = ts ? "ts" : "js";
    const vars = {
      APP_NAME: industry.appName,
      BATCH_NAME: industry.batchName,
      INDUSTRY_LABEL: industry.label,
      PROJECT_SLUG: industry.id,
    };

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

    const playwrightConfig = ts
      ? `import "dotenv/config";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:8080" },
  webServer: {
    command: "node serve.js",
    url: "http://localhost:8080/login.html",
    reuseExistingServer: !process.env.CI,
  },
});
`
      : `require("dotenv").config();
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:8080" },
  webServer: {
    command: "node serve.js",
    url: "http://localhost:8080/login.html",
    reuseExistingServer: !process.env.CI,
  },
});
`;

    const applitoolsConfig = `// Applitools reads APPLITOOLS_API_KEY from the environment (.env).
module.exports = {
  appName: "${vars.APP_NAME}",
  batch: { name: "${vars.BATCH_NAME}" },
};
`;

    const envExample = `# Get your key from https://eyes.applitools.com (Account settings).
APPLITOOLS_API_KEY=
`;

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
      { path: "serve.js", contents: SERVE_JS, language: "javascript" },
      {
        path: "pages/login.html",
        contents: render(LOGIN_HTML, vars),
        language: "html",
      },
      ...LEVELS.map((level) => ({
        path: `tests/login.${level.id}.spec.${ext}`,
        contents: testFile(level, ts),
        language,
      })),
      { path: ".env.example", contents: envExample, language: "env" },
      { path: ".gitignore", contents: gitignore, language: "text" },
      { path: "README.md", contents: render(README, vars), language: "markdown" },
    ];

    const primary = LEVELS[2]; // Layout, as the preview snippet.
    return {
      filename: `tests/login.${primary.id}.spec.${ext}`,
      language,
      code: testFile(primary, ts),
      files,
    };
  },
};
