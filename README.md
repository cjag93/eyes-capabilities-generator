# Eyes Capabilities Generator

A BrowserStack-capabilities-style configuration generator for **Applitools Eyes**.
Pick an **Industry** and a **Framework (+ language)**, and get a copyable /
downloadable Applitools Eyes code snippet tailored to that combination.

The industry drives the *content* of the snippet (app/batch naming, the URL it
navigates to, viewports, and which visual checkpoints it captures). The
framework decides the *shape* of the snippet (SDK, language, and API calls).

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- Deployed on Vercel (PR preview URLs)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm run lint    # eslint
```

## Architecture

Everything hangs off two **registries** so contributors add self-contained
files instead of editing shared ones:

```
lib/
├─ types.ts            # shared contracts (frozen — coordinate before changing)
├─ engine.ts           # combines the registries -> snippet
├─ frameworks/
│  └─ index.ts         # framework registry  (Person C)
└─ industries/
   └─ index.ts         # industry registry   (Person D)
```

A snippet is produced by `generateSnippet({ frameworkId, industryId, language,
useUltrafastGrid })` in [`lib/engine.ts`](lib/engine.ts), which looks up the
chosen framework + industry and calls the framework's `generate()` with the
industry preset. **Adding a framework or industry never touches the engine or
the UI.**

## Team workflow

- `main` is the shared baseline — branch off it, don't commit to it directly.
- Branch naming: `feature/<name>-<short-desc>`, `fix/...`, `chore/...`.
- Open a PR, get one review, squash-merge.

Ownership split:

| Person | Area |
| ------ | ---- |
| A | App shell (`app/`), layout, styling, CI/deploy |
| B | Wizard components + `CodePreview` (copy/download) |
| C | Framework generators (`lib/frameworks/*`) |
| D | Industry presets (`lib/industries/*`) + `lib/types.ts` steward |

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a framework or an industry.
