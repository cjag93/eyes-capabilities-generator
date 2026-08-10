"use client";

import { generateSnippet, listFrameworks, listIndustries } from "@/lib/engine";
import type { LanguageId } from "@/lib/types";
import { useState } from "react";
import { CodePreview } from "./code-preview";

const frameworks = listFrameworks();
const industries = listIndustries();

const LANGUAGE_LABELS: Record<LanguageId, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  csharp: "C#",
};

// Each framework's actual brand color — used as a small identifying dot,
// same convention as the per-language dot in the code preview.
const FRAMEWORK_DOT: Record<string, string> = {
  playwright: "#45BA4B",
  cypress: "#69D3A7",
  selenium: "#43B02A",
  webdriverio: "#EA5906",
};

function defaultId(ids: string[], preferred: string): string {
  return ids.includes(preferred) ? preferred : ids[0];
}

export function GeneratorWizard() {
  const [industryId, setIndustryId] = useState(() =>
    defaultId(industries.map((i) => i.id), "finance")
  );
  const [frameworkId, setFrameworkId] = useState(() =>
    defaultId(frameworks.map((f) => f.id), "playwright")
  );
  const [language, setLanguage] = useState<LanguageId>("typescript");
  const [useUltrafastGrid, setUseUltrafastGrid] = useState(true);

  const framework = frameworks.find((f) => f.id === frameworkId) ?? frameworks[0];
  const industry = industries.find((i) => i.id === industryId) ?? industries[0];

  const effectiveLanguage: LanguageId = framework.supportedLanguages.includes(language)
    ? language
    : framework.supportedLanguages[0];

  // No manual useMemo here — this project runs the React Compiler, which
  // handles memoization automatically and flags hand-rolled memoization
  // that it can't verify (effectiveLanguage is a derived, not stored, value).
  let snippet: ReturnType<typeof generateSnippet> | null = null;
  let error: string | null = null;
  try {
    snippet = generateSnippet({
      frameworkId,
      industryId,
      language: effectiveLanguage,
      useUltrafastGrid,
    });
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to generate snippet.";
  }

  function handleFrameworkChange(id: string) {
    setFrameworkId(id);
    const next = frameworks.find((f) => f.id === id);
    if (next && !next.supportedLanguages.includes(language)) {
      setLanguage(next.supportedLanguages[0]);
    }
  }

  const frameworkDot = FRAMEWORK_DOT[frameworkId];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Configuration panel */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 lg:w-[360px] lg:shrink-0">
        <EyeWatermark className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 text-accent opacity-[0.06]" />

        <div className="relative flex flex-col gap-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Configuration
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              {frameworkDot && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: frameworkDot }}
                  aria-hidden="true"
                />
              )}
              <span className="font-medium text-foreground">{framework.label}</span>
              <span className="text-muted-foreground">for</span>
              <span className="font-medium text-foreground">{industry.label}</span>
            </div>
          </div>

          <SelectField
            label="Industry"
            value={industryId}
            onChange={setIndustryId}
            options={industries.map((i) => ({ value: i.id, label: i.label }))}
          />
          <SelectField
            label="Framework"
            value={frameworkId}
            onChange={handleFrameworkChange}
            options={frameworks.map((f) => ({ value: f.id, label: f.label }))}
            dotColor={frameworkDot}
          />
          <SelectField
            label="Language"
            value={effectiveLanguage}
            onChange={(v) => setLanguage(v as LanguageId)}
            options={framework.supportedLanguages.map((lang) => ({
              value: lang,
              label: LANGUAGE_LABELS[lang],
            }))}
          />

          <div className="border-t border-border pt-5">
            <ToggleField
              label="Use Ultrafast Grid"
              description="Run this check across multiple browsers and viewports."
              checked={useUltrafastGrid}
              onChange={setUseUltrafastGrid}
            />
          </div>
        </div>
      </div>

      {/* Output — the dominant element */}
      <div className="min-w-0 flex-1">
        <div className="mb-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            What this test covers
          </p>
          <p className="mt-1.5 text-sm text-foreground">{industry.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-2">
            {industry.checkpoints.map((cp, i) => (
              <span key={cp} className="flex items-center gap-1">
                {i > 0 && <ArrowIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {cp}
                </span>
              </span>
            ))}
          </div>

          <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span>Checked on</span>
            {industry.viewports.map((v) => {
              const vpLabel = v.label ?? `${v.width}\u00d7${v.height}`;
              const lower = vpLabel.toLowerCase();
              const DeviceIcon = lower.includes("mobile")
                ? PhoneIcon
                : lower.includes("tablet")
                  ? TabletIcon
                  : MonitorIcon;
              return (
                <span key={vpLabel} className="inline-flex items-center gap-1.5">
                  <DeviceIcon className="h-4 w-4" />
                  {vpLabel}
                </span>
              );
            })}
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-border bg-surface-muted px-4 py-6 text-sm text-muted-foreground">
            Couldn&apos;t generate a snippet: {error}
          </div>
        ) : snippet ? (
          <CodePreview snippet={snippet} projectName={`${frameworkId}-${industryId}`} />
        ) : null}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  dotColor,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  dotColor?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <span className="relative">
        {dotColor && (
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: dotColor }}
            aria-hidden="true"
          />
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 w-full appearance-none rounded-lg border border-border bg-background text-sm text-foreground outline-none transition-colors hover:border-muted-foreground ${
            dotColor ? "pl-8 pr-9" : "px-3.5 pr-9"
          }`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </span>
    </label>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`pointer-events-none block h-5 w-5 rounded-full bg-surface shadow-sm transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path d="M3 9h10M10 5l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="4" width="15" height="10" rx="1.5" />
      <path d="M7 17h6M10 14v3" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <rect x="6" y="2" width="8" height="16" rx="2" />
      <path d="M9 15.3h2" strokeLinecap="round" />
    </svg>
  );
}

function TabletIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="3" width="12" height="14" rx="2" />
      <path d="M9 15.3h2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path d="M5.5 7.5 10 12l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Large, low-opacity echo of the header's eye mark — this panel's signature. */
function EyeWatermark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      className={className}
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}