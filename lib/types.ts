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
}

/** Language identifiers double as syntax-highlighting hints. */
export type LanguageId =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "csharp";

export interface GeneratedSnippet {
  /** Suggested filename for download, e.g. "eyes.spec.ts". */
  filename: string;
  language: LanguageId;
  code: string;
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
