import type { IndustryPreset } from "../types";

export const digitalMedia: IndustryPreset = {
  id: "digital-media",
  label: "Digital Media",
  description: "Streaming and publishing flows: browse, watch/read, subscription.",
  appName: "Acme Media",
  batchName: "Digital Media Visual Regression",
  sampleUrl: "http://localhost:3000/samples/digital-media",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Home", "Content Detail", "Player", "Subscription"],
  tags: ["media", "streaming"],
  dynamicRegions: [
    { selector: '[data-testid="episodes-badge"]', matchLevel: "dynamic" },
    { selector: '[data-testid="player-progress"]', matchLevel: "dynamic" },
    { selector: '[data-testid="subscription-countdown"]', matchLevel: "dynamic" },
    { selector: '[data-testid="featured-carousel"]', matchLevel: "layout" },
    { selector: '[data-testid="trending-chart"]', matchLevel: "layout" },
    { selector: '[data-testid="content-grid"]', matchLevel: "layout" },
  ],
};
