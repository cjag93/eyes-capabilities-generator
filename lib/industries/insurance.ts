import type { IndustryPreset } from "../types";

export const insurance: IndustryPreset = {
  id: "insurance",
  label: "Insurance",
  description: "Policy and claims flows: quotes, policy management, claims filing.",
  appName: "Acme Insurance",
  batchName: "Insurance Visual Regression",
  sampleUrl: "http://localhost:3000/samples/insurance",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Get a Quote", "Policy Dashboard", "File a Claim", "Billing"],
  tags: ["insurance", "claims"],
  dynamicRegions: [
    { selector: '[data-testid="premium-estimate"]', matchLevel: "layout" },
    { selector: '[data-testid="claims-badge"]', matchLevel: "layout" },
    { selector: '[data-testid="renewal-countdown"]', matchLevel: "layout" },
    { selector: '[data-testid="coverage-chart"]', matchLevel: "layout" },
    { selector: '[data-testid="claims-list"]', matchLevel: "layout" },
  ],
};
