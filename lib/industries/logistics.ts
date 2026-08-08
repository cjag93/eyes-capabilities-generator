import type { IndustryPreset } from "../types";

export const logistics: IndustryPreset = {
  id: "logistics",
  label: "Logistics",
  description: "Supply chain flows: shipment tracking, dispatch, warehouse management.",
  appName: "Acme Logistics",
  batchName: "Logistics Visual Regression",
  sampleUrl: "http://localhost:3000/samples/logistics",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Dashboard", "Shipment Tracking", "Dispatch", "Warehouse"],
  tags: ["logistics", "supply-chain"],
  dynamicRegions: [
    { selector: '[data-testid="alerts-badge"]', matchLevel: "dynamic" },
    { selector: '[data-testid="eta-countdown"]', matchLevel: "dynamic" },
    { selector: '[data-testid="fleet-chart"]', matchLevel: "layout" },
    { selector: '[data-testid="warehouse-gauge"]', matchLevel: "layout" },
    { selector: '[data-testid="dispatch-queue"]', matchLevel: "layout" },
  ],
};
