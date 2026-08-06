import type { IndustryPreset } from "../types";

export const digitalMedia: IndustryPreset = {
  id: "digital-media",
  label: "Digital Media",
  description: "Streaming and publishing flows: browse, watch/read, subscription.",
  appName: "Acme Media",
  batchName: "Digital Media Visual Regression",
  sampleUrl: "https://demo.applitools.com",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Home", "Content Detail", "Player", "Subscription"],
  tags: ["media", "streaming"],
};
