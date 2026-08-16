"use client";

import { useMemo, useState } from "react";
import { getAllAsanas } from "@/lib/data/catalog";
import { AsanaCard } from "@/components/AsanaCard";
import { LensControls } from "@/components/LensControls";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const asanas = useMemo(() => getAllAsanas(), []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return asanas;
    }
    return asanas.filter((asana) => {
      const haystack = [
        asana.identity.nameEnglish,
        asana.identity.nameSanskrit,
        ...asana.identity.aliases,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [asanas, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Explore asanas</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Search by English name, Sanskrit, or alias. Use the lens controls to
          change how summaries and evidence are shown.
        </p>
      </div>

      <LensControls />

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search e.g. Vajrasana, twist, headstand..."
        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-teal-500 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-950"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((asana) => (
          <AsanaCard key={asana.identity.slug} asana={asana} />
        ))}
      </div>
    </div>
  );
}
