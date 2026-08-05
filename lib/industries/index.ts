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
export const industries: Record<string, IndustryPreset> = {
  // [ecommerce.id]: ecommerce,   <- Person D
  // [finance.id]: finance,       <- Person D
  // [healthcare.id]: healthcare, <- Person D
  // [saas.id]: saas,             <- Person D
};
