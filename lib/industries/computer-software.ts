import type { IndustryPreset } from "../types";

export const computerSoftware: IndustryPreset = {
  id: "computer-software",
  label: "Computer Software",
  description: "SaaS product flows: onboarding, dashboards, settings.",
  appName: "Acme SaaS",
  batchName: "Computer Software Visual Regression",
  sampleUrl: "http://localhost:3000/samples/computer-software",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Login", "Onboarding", "Dashboard", "Settings"],
  tags: ["software", "saas"],
  dynamicRegions: [
    { selector: '[data-testid="status-ticker"]', matchLevel: "dynamic" },
    { selector: '[data-testid="notification-badge"]', matchLevel: "dynamic" },
    { selector: '[data-testid="onboarding-progress"]', matchLevel: "layout" },
    { selector: '[data-testid="usage-chart"]', matchLevel: "layout" },
    { selector: '[data-testid="activity-feed"]', matchLevel: "layout" },
  ],
};
