"use client";

import Link from "next/link";
import type { AsanaRecord } from "@/lib/types/asana";
import { formatAsanaSummary, visibleEvidenceCodes } from "@/lib/lens/formatters";
import { getVisualsForSlug } from "@/lib/visuals/catalog";
import { useLens } from "@/components/LensProvider";
import { EvidenceBadgeRow } from "@/components/EvidenceBadge";
import { AsanaVisualThumbnail } from "@/components/visuals/AsanaVisualThumbnail";

export function AsanaCard({ asana }: { asana: AsanaRecord }) {
  const { lens } = useLens();
  const summary = formatAsanaSummary(asana, lens);
  const codes = visibleEvidenceCodes(asana, lens);
  const visuals = getVisualsForSlug(asana.identity.slug);

  return (
    <Link
      href={`/asana/${asana.identity.slug}`}
      className="group block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-teal-700"
    >
      {visuals ? (
        <div className="px-5 pt-5">
          <AsanaVisualThumbnail
            poseKey={visuals.poseKey}
            name={asana.identity.nameEnglish}
          />
        </div>
      ) : null}
      <div className="p-5 pt-0">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-300">
              {asana.identity.nameEnglish}
            </h3>
            <p className="text-sm text-zinc-500">{asana.identity.nameSanskrit}</p>
          </div>
          <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs capitalize text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            {asana.identity.family.replaceAll("_", " ")}
          </span>
        </div>
        <p className="mb-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          {summary}
        </p>
        <EvidenceBadgeRow codes={codes} />
      </div>
    </Link>
  );
}
