import Link from "next/link";
import { listIndustries } from "@/lib/engine";

const ICONS: Record<string, string> = {
  finance: "🏦",
  ecommerce: "🛒",
  healthcare: "➕",
  education: "🎓",
  telecom: "📶",
};

export default function SamplesIndexPage() {
  const industries = listIndustries();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Sample apps</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          One-page demo apps for each industry preset in{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">lib/industries/*</code>. Each
          bakes in common visual-testing challenges — dynamic timestamps, random chart data, async
          skeleton loaders, carousels, modals, hover states, and responsive breakpoints — that
          Applitools Eyes is built to handle. Hover any 🧪 badge on a page for details.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {industries.map((industry) => (
          <li key={industry.id}>
            <Link
              href={`/samples/${industry.id}`}
              className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                {ICONS[industry.id] ?? "📄"} {industry.label}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{industry.description}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/" className="text-sm font-medium underline">
        ← Back to the generator
      </Link>
    </div>
  );
}
