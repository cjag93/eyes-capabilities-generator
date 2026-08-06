import type { IndustryPreset } from "../types";

/**
 * Industry registry.
 *
 * Person D: add a new industry by creating a file in this folder that exports
 * an `IndustryPreset`, then register it here. Example:
 *
 *   import { finance } from "./finance";
 *   export const industries = { [finance.id]: finance };
 *
 * See CONTRIBUTING.md ("Add an industry") for the full walkthrough.
 */
import { healthcare } from "./healthcare";

export const industries: Record<string, IndustryPreset> = {
  [healthcare.id]: healthcare,
  // [ecommerce.id]: ecommerce,   <- Person D
  // [finance.id]: finance,       <- Person D
  // [saas.id]: saas,             <- Person D
};
