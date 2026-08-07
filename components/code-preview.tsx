"use client";

import type { GeneratedSnippet, LanguageId } from "@/lib/types";
import { useEffect, useState, type ReactNode } from "react";
import { highlightCode } from "./syntax-highlight";

interface CodePreviewProps {
  snippet: GeneratedSnippet;
  /** Used to name the downloaded project zip, e.g. "playwright-finance". */
  projectName?: string;
}

type CopyState = "idle" | "copied" | "error";

// Each language's own brand color, used only as a small identifying dot —
// same convention GitHub/VS Code use for file icons.
const LANGUAGE_DOT: Partial<Record<LanguageId, string>> = {
  typescript: "#3178c6",
  javascript: "#f0db4f",
  python: "#3776ab",
  java: "#f89820",
  csharp: "#a179dc",
};

export function CodePreview({ snippet, projectName }: CodePreviewProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [zipState, setZipState] = useState<"idle" | "building" | "error">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 1800);
    }
  }

  function handleDownloadFile() {
    downloadBlob(new Blob([snippet.code], { type: "text/plain;charset=utf-8" }), snippet.filename);
  }

  async function handleDownloadProject() {
    if (!snippet.files || snippet.files.length === 0) return;
    setZipState("building");
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const file of snippet.files) {
        zip.file(file.path, file.contents);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${projectName ?? "eyes-project"}.zip`);
      setZipState("idle");
    } catch {
      setZipState("error");
      setTimeout(() => setZipState("idle"), 2000);
    }
  }

  const lineCount = snippet.code.split("\n").length;
  const dotColor = LANGUAGE_DOT[snippet.language];

  return (
    // Keyed by the content itself: every time the generated snippet
    // actually changes, this remounts SettleOnMount fresh, which is what
    // drives the entrance transition — no synchronous setState-on-change
    // needed (React Compiler flags that pattern in effects).
    <SettleOnMount settleKey={`${snippet.filename}:${snippet.code.length}`}>
      <div
        className="flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm"
        style={{ borderTop: "2px solid var(--accent)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-muted px-4 py-2.5">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded bg-surface px-2 py-1 text-foreground">
              {dotColor && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: dotColor }}
                  aria-hidden="true"
                />
              )}
              {snippet.filename}
            </span>
            <span className="uppercase tracking-wide">{snippet.language}</span>
          </div>

          <div className="flex items-center gap-2">
            {snippet.files && snippet.files.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadProject}
                disabled={zipState === "building"}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted disabled:opacity-60"
              >
                {zipState === "building" ? "Zipping…" : zipState === "error" ? "Failed — retry" : "Download project (.zip)"}
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadFile}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              Download file
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
            >
              {copyState === "copied" ? "Copied!" : copyState === "error" ? "Couldn\u2019t copy" : "Copy code"}
            </button>
          </div>
        </div>

        <div className="flex max-h-[480px] overflow-y-auto">
          <div
            aria-hidden="true"
            className="select-none border-r border-border px-3 py-4 text-right font-mono text-[13px] leading-6 text-muted-foreground/50"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <pre className="flex-1 overflow-x-auto px-4 py-4 text-[13px] leading-6">
            <code
              className="font-mono text-foreground"
              // Safe: highlightCode HTML-escapes every character of the input
              // (matched and unmatched alike) before wrapping tokens in spans.
              dangerouslySetInnerHTML={{ __html: highlightCode(snippet.code) }}
            />
          </pre>
        </div>

        {snippet.files && snippet.files.length > 0 && (
          <div className="border-t border-border bg-surface-muted px-4 py-2 text-xs text-muted-foreground">
            Project download includes {snippet.files.length} file{snippet.files.length === 1 ? "" : "s"}:{" "}
            {snippet.files.map((f) => f.path).join(", ")}
          </div>
        )}
      </div>
    </SettleOnMount>
  );
}

/**
 * Fades/slides its children in on mount. Pass a `settleKey` that changes
 * whenever the content changes — React remounts this component fresh
 * (starting at the initial `settled = false`), so there's never a need to
 * reset state from inside an effect.
 */
function SettleOnMount({ settleKey, children }: { settleKey: string; children: ReactNode }) {
  return <SettleOnMountInner key={settleKey}>{children}</SettleOnMountInner>;
}

function SettleOnMountInner({ children }: { children: ReactNode }) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`transition-all duration-300 ${settled ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
    >
      {children}
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}