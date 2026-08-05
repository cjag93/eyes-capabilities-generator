# Contributing

Thanks for building the Eyes Capabilities Generator! This guide keeps four
people productive in parallel without merge conflicts.

## Workflow

1. Branch off `main`: `git checkout -b feature/<name>-<short-desc>`.
2. Make your change (ideally within your ownership area — see the table in the
   [README](README.md)).
3. Push and open a PR into `main`. Get one review. Squash-merge.

The whole design is built so you add **new files** rather than editing shared
ones. The only truly shared file is [`lib/types.ts`](lib/types.ts) — treat it
as frozen and coordinate with the team (Person D is the steward) before
changing it.

## Add a framework (Person C)

1. Create `lib/frameworks/<framework>.ts` exporting a `FrameworkGenerator`:

   ```ts
   import type { FrameworkGenerator } from "../types";

   export const cypress: FrameworkGenerator = {
     id: "cypress",
     label: "Cypress",
     supportedLanguages: ["javascript", "typescript"],
     generate({ language, useUltrafastGrid, industry }) {
       // Build the code string from the industry preset + options.
       return {
         filename: language === "typescript" ? "eyes.cy.ts" : "eyes.cy.js",
         language,
         code: `/* ... */`,
       };
     },
   };
   ```

2. Register it in [`lib/frameworks/index.ts`](lib/frameworks/index.ts):

   ```ts
   import { cypress } from "./cypress";
   export const frameworks = { [cypress.id]: cypress /* , ... */ };
   ```

That's it — the UI and engine pick it up automatically.

## Add an industry (Person D)

1. Create `lib/industries/<industry>.ts` exporting an `IndustryPreset`:

   ```ts
   import type { IndustryPreset } from "../types";

   export const finance: IndustryPreset = {
     id: "finance",
     label: "Finance",
     description: "Banking / fintech flows...",
     appName: "Acme Bank",
     batchName: "Finance Visual Regression",
     sampleUrl: "https://demo.applitools.com",
     viewports: [{ width: 1440, height: 900, label: "Desktop" }],
     checkpoints: ["Login", "Dashboard", "Transfer"],
     tags: ["finance", "auth"],
   };
   ```

2. Register it in [`lib/industries/index.ts`](lib/industries/index.ts).

## Conventions

- Keep generators pure: `generate(opts)` in, `{ filename, language, code }` out.
- No secrets in snippets — reference `APPLITOOLS_API_KEY` from the environment.
- Run `npm run lint` before pushing.
