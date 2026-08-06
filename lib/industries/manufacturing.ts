import type { IndustryPreset } from "../types";

export const manufacturing: IndustryPreset = {
  id: "manufacturing",
  label: "Manufacturing",
  description: "Industrial operations flows: inventory, work orders, quality control.",
  appName: "Acme Manufacturing",
  batchName: "Manufacturing Visual Regression",
  sampleUrl: "https://demo.applitools.com",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Dashboard", "Inventory", "Work Orders", "Quality Control"],
  tags: ["manufacturing", "operations"],
};
