import type { IndustryPreset } from "../types";

export const manufacturing: IndustryPreset = {
  id: "manufacturing",
  label: "Manufacturing",
  description: "Industrial operations flows: inventory, work orders, quality control.",
  appName: "Acme Manufacturing",
  batchName: "Manufacturing Visual Regression",
  sampleUrl: "http://localhost:3000/samples/manufacturing",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Dashboard", "Inventory", "Work Orders", "Quality Control"],
  tags: ["manufacturing", "operations"],
  dynamicRegions: [
    { selector: '[data-testid="alerts-badge"]', matchLevel: "dynamic" },
    { selector: '[data-testid="shift-countdown"]', matchLevel: "dynamic" },
    { selector: '[data-testid="throughput-gauge"]', matchLevel: "layout" },
    { selector: '[data-testid="inventory-table"]', matchLevel: "layout" },
    { selector: '[data-testid="defect-chart"]', matchLevel: "layout" },
  ],
};
