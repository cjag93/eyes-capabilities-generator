/**
 * Roadmap catalog.
 *
 * The registries in `frameworks/` and `industries/` only contain things that
 * are *fully implemented*. This catalog lists the full planned line-up so the
 * UI can show everything up front and mark not-yet-built entries as
 * "coming soon". Availability is computed from the registries, so an entry
 * flips to "available" automatically the moment its generator/preset is
 * registered — nothing here needs editing when Person C or D lands one.
 */
import { frameworks } from "./frameworks";
import { industries } from "./industries";

export type FrameworkCategory = "web" | "component" | "mobile";
export type CatalogStatus = "available" | "coming-soon";

export interface FrameworkCatalogEntry {
  id: string;
  label: string;
  category: FrameworkCategory;
  /** Human-readable language labels for display, e.g. ["JavaScript", "Java"]. */
  languages: string[];
}

export interface IndustryCatalogEntry {
  id: string;
  label: string;
}

export type WithAvailability<T> = T & {
  available: boolean;
  status: CatalogStatus;
};

/** The full framework line-up (see the finalized team list). */
const FRAMEWORK_ROADMAP: FrameworkCatalogEntry[] = [
  { id: "selenium-java", label: "Selenium", category: "web", languages: ["Java"] },
  {
    id: "playwright",
    label: "Playwright",
    category: "web",
    languages: ["JavaScript", "TypeScript"],
  },
  {
    id: "cypress",
    label: "Cypress",
    category: "web",
    languages: ["JavaScript", "TypeScript"],
  },
  {
    id: "storybook",
    label: "Storybook",
    category: "component",
    languages: ["JavaScript", "TypeScript"],
  },
  {
    id: "appium",
    label: "Appium",
    category: "mobile",
    languages: ["Java", "JavaScript"],
  },
  { id: "xcuitest", label: "XCUITest", category: "mobile", languages: ["Swift"] },
];

/** The planned industry line-up. */
const INDUSTRY_ROADMAP: IndustryCatalogEntry[] = [
  { id: "healthcare", label: "Healthcare" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "finance", label: "Finance" },
  { id: "saas", label: "SaaS" },
];

function decorate<T extends { id: string }>(
  entries: T[],
  registry: Record<string, unknown>,
): WithAvailability<T>[] {
  return entries.map((entry) => {
    const available = Object.prototype.hasOwnProperty.call(registry, entry.id);
    return {
      ...entry,
      available,
      status: available ? "available" : "coming-soon",
    };
  });
}

/** All frameworks with a computed availability flag (for a grouped picker). */
export function frameworkCatalog(): WithAvailability<FrameworkCatalogEntry>[] {
  return decorate(FRAMEWORK_ROADMAP, frameworks);
}

/** All industries with a computed availability flag. */
export function industryCatalog(): WithAvailability<IndustryCatalogEntry>[] {
  return decorate(INDUSTRY_ROADMAP, industries);
}
