import type { IndustryPreset } from "../types";
import { finance } from "./finance";
import { ecommerce } from "./ecommerce";
import { healthcare } from "./healthcare";
import { education } from "./education";
import { telecom } from "./telecom";
import { computerSoftware } from "./computer-software";
import { insurance } from "./insurance";
import { digitalMedia } from "./digital-media";
import { manufacturing } from "./manufacturing";
import { federal } from "./federal";
import { logistics } from "./logistics";

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
  [finance.id]: finance,
  [ecommerce.id]: ecommerce,
  [healthcare.id]: healthcare,
  [education.id]: education,
  [telecom.id]: telecom,
  [computerSoftware.id]: computerSoftware,
  [insurance.id]: insurance,
  [digitalMedia.id]: digitalMedia,
  [manufacturing.id]: manufacturing,
  [federal.id]: federal,
  [logistics.id]: logistics,
};
