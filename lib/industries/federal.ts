import type { IndustryPreset } from "../types";

export const federal: IndustryPreset = {
  id: "federal",
  label: "Federal",
  description: "Government service flows: citizen login, application forms, benefits status.",
  appName: "Acme Federal Services",
  batchName: "Federal Visual Regression",
  sampleUrl: "http://localhost:3000/samples/federal",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Login", "Application Form", "Benefits Status", "Documents"],
  tags: ["federal", "government", "compliance"],
  dynamicRegions: [
    { selector: '[data-testid="session-countdown"]', matchLevel: "dynamic" },
    { selector: '[data-testid="correspondence-badge"]', matchLevel: "dynamic" },
    { selector: '[data-testid="application-progress"]', matchLevel: "layout" },
    { selector: '[data-testid="benefits-chart"]', matchLevel: "layout" },
    { selector: '[data-testid="documents-list"]', matchLevel: "layout" },
  ],
};
