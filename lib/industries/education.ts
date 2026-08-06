import type { IndustryPreset } from "../types";

export const education: IndustryPreset = {
  id: "education",
  label: "Education",
  description: "LMS flows: course catalog, coursework, grading.",
  appName: "Acme Learning",
  batchName: "Education Visual Regression",
  sampleUrl: "https://demo.applitools.com",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Login", "Course Catalog", "Course Detail", "Assignment Submission", "Grade Report"],
  tags: ["education", "lms"],
};
