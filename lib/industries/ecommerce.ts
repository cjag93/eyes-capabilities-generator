import type { IndustryPreset } from "../types";

export const ecommerce: IndustryPreset = {
  id: "ecommerce",
  label: "eCommerce",
  description: "Online storefront flows: browse, cart, checkout.",
  appName: "Acme Store",
  batchName: "eCommerce Visual Regression",
  sampleUrl: "http://localhost:3000/samples/ecommerce",
  viewports: [
    { width: 1440, height: 900, label: "Desktop" },
    { width: 375, height: 667, label: "Mobile" },
  ],
  checkpoints: ["Home", "Product Listing", "Product Detail", "Cart", "Checkout"],
  tags: ["ecommerce", "checkout"],
  dynamicRegions: [
    { selector: '[data-testid="promo-carousel"]', matchLevel: "layout" },
    { selector: '[data-testid="flash-sale-countdown"]', matchLevel: "layout" },
    { selector: '[data-testid="cart-badge"]', matchLevel: "layout" },
    { selector: '[data-testid="product-grid"]', matchLevel: "layout" },
  ],
};
