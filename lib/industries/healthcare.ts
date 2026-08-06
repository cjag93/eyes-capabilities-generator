import type { IndustryPreset } from "../types";

export const healthcare: IndustryPreset = {
  id: "healthcare",
  label: "Healthcare",
  description:
    "Patient portal flows: sign in, dashboard, and appointments across desktop and mobile.",
  appName: "Acme Health",
  batchName: "Healthcare Visual Regression",
  sampleUrl: "https://demo.applitools.com",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 390, height: 844, label: "Mobile" },
  ],
  checkpoints: ["Login"],
  tags: ["healthcare", "auth", "responsive"],
};
