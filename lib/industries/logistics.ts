import type { IndustryPreset } from "../types";

export const logistics: IndustryPreset = {
  id: "logistics",
  label: "Logistics",
  description: "Supply chain flows: shipment tracking, dispatch, warehouse management.",
  appName: "Acme Logistics",
  batchName: "Logistics Visual Regression",
  sampleUrl: "https://demo.applitools.com",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Dashboard", "Shipment Tracking", "Dispatch", "Warehouse"],
  tags: ["logistics", "supply-chain"],
};
