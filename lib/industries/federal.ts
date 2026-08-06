import type { IndustryPreset } from "../types";

export const federal: IndustryPreset = {
  id: "federal",
  label: "Federal",
  description: "Government service flows: citizen login, application forms, benefits status.",
  appName: "Acme Federal Services",
  batchName: "Federal Visual Regression",
  sampleUrl: "https://demo.applitools.com",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Login", "Application Form", "Benefits Status", "Documents"],
  tags: ["federal", "government", "compliance"],
};
