import type { IndustryPreset } from "../types";

export const telecom: IndustryPreset = {
  id: "telecom",
  label: "Telecom",
  description: "Carrier account flows: plans, billing, support.",
  appName: "Acme Telecom",
  batchName: "Telecom Visual Regression",
  sampleUrl: "http://localhost:3000/samples/telecom",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Login", "Account Overview", "Plan Management", "Billing History", "Support Chat"],
  tags: ["telecom", "billing"],
};
