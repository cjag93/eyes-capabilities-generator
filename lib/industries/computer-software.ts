import type { IndustryPreset } from "../types";

export const computerSoftware: IndustryPreset = {
  id: "computer-software",
  label: "Computer Software",
  description: "SaaS product flows: onboarding, dashboards, settings.",
  appName: "Acme SaaS",
  batchName: "Computer Software Visual Regression",
  sampleUrl: "https://demo.applitools.com",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Login", "Onboarding", "Dashboard", "Settings"],
  tags: ["software", "saas"],
};
