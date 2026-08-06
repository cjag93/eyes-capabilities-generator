import type { IndustryPreset } from "../types";

export const finance: IndustryPreset = {
  id: "finance",
  label: "Finance",
  description: "Banking / fintech flows: login, dashboard, transfers.",
  appName: "Acme Bank",
  batchName: "Finance Visual Regression",
  sampleUrl: "http://localhost:3000/samples/finance",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Login", "Dashboard", "Transfer"],
  tags: ["finance", "auth"],
  dynamicRegions: [
    { selector: '[data-testid="live-clock"]', matchLevel: "dynamic" },
    { selector: '[data-testid="unread-badge"]', matchLevel: "dynamic" },
    { selector: '[data-testid="spending-chart"]', matchLevel: "layout" },
    { selector: '[data-testid="transactions-table"]', matchLevel: "layout" },
  ],
};
