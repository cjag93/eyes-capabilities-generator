import type { IndustryPreset } from "../types";

export const healthcare: IndustryPreset = {
  id: "healthcare",
  label: "Healthcare",
  description: "Patient portal flows: appointments, records, billing.",
  appName: "Acme Health",
  batchName: "Healthcare Visual Regression",
  sampleUrl: "http://localhost:3000/samples/healthcare",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Login", "Patient Dashboard", "Appointment Scheduling", "Medical Records"],
  tags: ["healthcare", "compliance"],
  dynamicRegions: [
    { selector: '[data-testid="greeting"]', matchLevel: "layout" },
    { selector: '[data-testid="vitals-chart"]', matchLevel: "layout" },
    { selector: '[data-testid="calendar"]', matchLevel: "layout" },
    { selector: '[data-testid="message-badge"]', matchLevel: "layout" },
    { selector: '[data-testid="records-list"]', matchLevel: "layout" },
  ],
};
