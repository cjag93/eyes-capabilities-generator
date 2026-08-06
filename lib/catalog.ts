/**
 * Roadmap catalog.
 *
 * Frameworks are a fixed, team-agreed roster of six, most not yet built, so
 * they use a hardcoded roadmap and are marked "coming soon" until their
 * generator is registered.
 *
 * Industries are Person D's open-ended set, so they are derived directly from
 * the registry — whatever D registers shows up automatically (no phantom
 * entries, nothing missing), and there is no "coming soon" state for them.
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

/**
 * All registered industries. Derived from the registry (Person D's set), so
 * everything D adds appears automatically and everything listed is available.
 */
export function industryCatalog(): WithAvailability<IndustryCatalogEntry>[] {
  return Object.values(industries).map((industry) => ({
    id: industry.id,
    label: industry.label,
    available: true,
    status: "available",
  }));
}
