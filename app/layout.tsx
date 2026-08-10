import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Applitools Eyes Capabilities Generator",
    template: "%s · Applitools Eyes Capabilities Generator",
  },
  description:
    "Pick an industry and a framework, and get a copyable Applitools Eyes visual-testing snippet tailored to that combination.",
  applicationName: "Applitools Eyes Capabilities Generator",
  keywords: [
    "Applitools",
    "Eyes",
    "visual testing",
    "visual regression",
    "Playwright",
    "Cypress",
    "Selenium",
    "code generator",
  ],
  authors: [{ name: "Applitools Eyes Capabilities Generator team" }],
  openGraph: {
    title: "Applitools Eyes Capabilities Generator",
    description:
      "Generate tailored Applitools Eyes snippets from an industry + framework combination.",
    type: "website",
  },
};

// Runs before paint to apply the saved (or system) theme and avoid a flash of
// the wrong palette. Mirrors the logic in app/theme-toggle.tsx.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||((t==="system"||!t)&&window.matchMedia("(prefers-color-scheme: dark)").matches);var c=document.documentElement.classList;c.toggle("dark",d);c.toggle("light",!d);}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
