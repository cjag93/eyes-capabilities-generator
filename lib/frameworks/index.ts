import type { FrameworkGenerator } from "../types";

/**
 * Framework registry.
 *
 * Person C: add a new framework by creating a file in this folder that exports
 * a `FrameworkGenerator`, then register it here. Example:
 *
 *   import { playwright } from "./playwright";
 *   export const frameworks = { [playwright.id]: playwright };
 *
 * See CONTRIBUTING.md ("Add a framework") for the full walkthrough.
 */
import { playwright } from "./playwright";

export const frameworks: Record<string, FrameworkGenerator> = {
  [playwright.id]: playwright,
  // [cypress.id]: cypress,           <- Person C
  // [selenium.id]: selenium,         <- Person C
  // [webdriverio.id]: webdriverio,   <- Person C
};
