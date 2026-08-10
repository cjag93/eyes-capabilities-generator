/**
 * Shared contracts for the Eyes Capabilities Generator.
 *
 * This is the one file every contributor depends on. Treat it as frozen:
 * changes here ripple across all framework generators and industry presets,
 * so coordinate with the team before editing (see CONTRIBUTING.md).
 */

export interface Viewport {
  width: number;
  height: number;
  /** Optional human label, e.g. "Desktop", "Mobile". */
  label?: string;
}

/**
 * A CSS selector paired with the Eyes match level it should be checked at.
 * Use these for elements that legitimately differ between test runs
 * (timestamps, counters, randomized/async-loaded content) so the generated
 * region-based checks don't fail on expected drift. See
 * https://applitools.com/docs/eyes/playwright/api/defining-regions.
 */
export interface IndustryRegion {
  /** CSS selector identifying the element(s) this region applies to. */
  selector: string;
  matchLevel: MatchLevel;
}

/**
 * An industry-specific preset that drives the *content* of a generated
 * snippet: what app/batch it reports as, where it navigates, which
 * viewports it runs, and which visual checkpoints it captures.
 *
 * Person D owns the files in `lib/industries/*`.
 */
export interface IndustryPreset {
  id: string;
  label: string;
  description: string;
  /** Reported as the Eyes "app name". */
  appName: string;
  /** Reported as the Eyes batch name (groups results in the dashboard). */
  batchName: string;
  /** Demo URL the generated test navigates to. */
  sampleUrl: string;
  /** Viewports the test should cover. First entry is the primary size. */
  viewports: Viewport[];
  /** Human-readable checkpoint names -> one `eyes.check(...)` per entry. */
  checkpoints: string[];
  /** Tags applied to the batch for filtering in the dashboard. */
  tags: string[];
  /**
   * Elements on `sampleUrl` known to change between test runs (live
   * timestamps, random/async-loaded content, rotating carousels). Optional —
   * only presets with a real sample app to point selectors at need to fill
   * this in.
   */
  dynamicRegions?: IndustryRegion[];
}

/** Language identifiers double as syntax-highlighting hints. */
export type LanguageId =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "csharp";

/**
 * Match levels used by generated starter tests (one file per level) and by
 * industry region presets. Dynamic is intentionally not supported — starters
 * use Strict, Exact, and Layout only.
 */
export type MatchLevel = "strict" | "exact" | "layout";

/** A single file in a generated runnable project. */
export interface ProjectFile {
  /** Path relative to the project root, e.g. "tests/login.layout.spec.js". */
  path: string;
  contents: string;
  /** Highlight hint for the preview UI. */
  language?: LanguageId | "html" | "json" | "env" | "markdown" | "text";
}

export interface GeneratedSnippet {
  /** Suggested filename for download, e.g. "eyes.spec.ts". */
  filename: string;
  language: LanguageId;
  code: string;
  /**
   * Optional full, runnable project (bare-minimum config + a sample page + one
   * test per match level). When present, the UI offers a "download project"
   * (zip) in addition to copying `code`. Purely additive: consumers that only
   * read `code` keep working.
   */
  files?: ProjectFile[];
}

export interface GeneratorOptions {
  language: LanguageId;
  /** Emit an Ultrafast Grid (cross-browser) configuration. */
  useUltrafastGrid: boolean;
  industry: IndustryPreset;
}

/**
 * A framework generator turns an industry preset + options into a snippet.
 *
 * Person C owns the files in `lib/frameworks/*`.
 */
export interface FrameworkGenerator {
  id: string;
  label: string;
  supportedLanguages: LanguageId[];
  generate(opts: GeneratorOptions): GeneratedSnippet;
}
