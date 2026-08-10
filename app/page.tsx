import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { GeneratorWizard } from "@/components/wizard";

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

        <section
          aria-label="Snippet generator"
          className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8"
        >
          <GeneratorWizard />
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
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/applitools-mark.png"
            alt="Applitools"
            width={28}
            height={28}
            className="h-7 w-7 shrink-0"
            priority
          />
          <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
            Applitools Eyes Capabilities Generator
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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="max-w-xl space-y-1.5">
          <p className="text-pretty leading-6">
            Starter projects are provided to help you evaluate Applitools Eyes.
            Store your API key in{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[0.85em]">
              .env
            </code>
            ; never commit credentials to source control.
          </p>
          <p className="text-pretty leading-6">
            For details on our security practices, visit the{" "}
            <a
              href="https://trust.applitools.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Applitools Trust Center
            </a>
            .
          </p>
        </div>
        <p className="shrink-0">Built for Applitools Eyes.</p>
      </div>
    </footer>
  );
}

