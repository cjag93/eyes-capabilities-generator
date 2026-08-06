import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12 sm:px-8 sm:py-16">
        <section className="flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Applitools Eyes snippet generator
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Generate a tailored Applitools Eyes test in seconds
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-7 text-muted-foreground">
            Pick an{" "}
            <span className="font-medium text-foreground">industry</span> and a{" "}
            <span className="font-medium text-foreground">framework</span>, then
            download the files you need to run your first visual test.
          </p>
        </section>

        {/*
          Wizard integration point — owned by Person B.
          Person B: replace the placeholder below with the wizard, e.g.
              import { GeneratorWizard } from "@/components/wizard";
              ...
              <GeneratorWizard />
          The wizard reads frameworks/industries from lib/engine.ts
          (listFrameworks / listIndustries) and renders CodePreview.
        */}
        <section
          aria-label="Snippet generator"
          className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8"
        >
          <WizardPlaceholder />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <EyeMark className="h-6 w-6 text-accent" />
          <span className="text-sm font-semibold tracking-tight sm:text-base">
            Eyes Capabilities Generator
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <a
            href="https://applitools.com/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Eyes docs
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8">
        <p>
          Snippets reference{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[0.85em]">
            APPLITOOLS_API_KEY
          </code>{" "}
          from your environment — never hard-code secrets.
        </p>
        <p>Built for Applitools Eyes.</p>
      </div>
    </footer>
  );
}

/**
 * Temporary stand-in so the shell renders and the build stays green before
 * Person B lands the wizard. Delete this once the wizard is wired in.
 */
function WizardPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-muted/50 px-6 py-16 text-center">
      <EyeMark className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">The generator wizard mounts here</p>
      <p className="max-w-md text-sm text-muted-foreground">
        Industry &amp; framework pickers, options, and the copy/download code
        preview are coming from Person B&apos;s wizard components.
      </p>
    </div>
  );
}

function EyeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
