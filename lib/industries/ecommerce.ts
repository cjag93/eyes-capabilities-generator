import type { IndustryPreset } from "../types";

export const ecommerce: IndustryPreset = {
  id: "ecommerce",
  label: "eCommerce",
  description: "Online storefront flows: browse, cart, checkout.",
  appName: "Acme Store",
  batchName: "eCommerce Visual Regression",
  sampleUrl: "https://demo.applitools.com",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Home", "Product Listing", "Product Detail", "Cart", "Checkout"],
  tags: ["ecommerce", "checkout"],
};
