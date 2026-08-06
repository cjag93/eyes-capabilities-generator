import type { IndustryPreset } from "../types";

export const finance: IndustryPreset = {
  id: "finance",
  label: "Finance",
  description: "Banking / fintech flows: login, dashboard, transfers.",
  appName: "Acme Bank",
  batchName: "Finance Visual Regression",
  sampleUrl: "https://demo.applitools.com",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Login", "Dashboard", "Transfer"],
  tags: ["finance", "auth"],
};
