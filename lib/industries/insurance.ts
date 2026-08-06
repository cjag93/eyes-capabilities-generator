import type { IndustryPreset } from "../types";

export const insurance: IndustryPreset = {
  id: "insurance",
  label: "Insurance",
  description: "Policy and claims flows: quotes, policy management, claims filing.",
  appName: "Acme Insurance",
  batchName: "Insurance Visual Regression",
  sampleUrl: "https://demo.applitools.com",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Get a Quote", "Policy Dashboard", "File a Claim", "Billing"],
  tags: ["insurance", "claims"],
};
