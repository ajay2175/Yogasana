import Link from "next/link";
import { getCatalog } from "@/lib/data/catalog";
import { LensControls } from "@/components/LensControls";

export default function HomePage() {
  const catalog = getCatalog();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-teal-700 to-emerald-900 px-8 py-10 text-white">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-teal-100">
          Yoga · Ayurveda · Biomechanics · Evidence
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">
          One knowledge graph. Four lenses. Every claim labeled.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-teal-50">
          Explore asanas with classical, biomedical, and integrative layers kept
          separate. Switch between Clinical, Wellness, Pedagogy, and Scholar
          views without duplicating the underlying data.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/explore"
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-teal-900"
          >
            Explore asanas
          </Link>
          <Link
            href="/advisor"
            className="rounded-full border border-white/40 px-5 py-2 text-sm font-medium text-white"
          >
            Condition advisor
          </Link>
        </div>
      </section>

      <LensControls />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-3xl font-semibold">{catalog.asanas.length}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Seed asanas in Phase 1 catalog
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-3xl font-semibold">4</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Audience lenses with progressive disclosure
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-3xl font-semibold">~120</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Planned ontology variables across 22 domains
          </p>
        </div>
      </section>
    </div>
  );
}
