"use client";

import type { AsanaRecord } from "@/lib/types/asana";
import { useLens } from "@/components/LensProvider";
import { EvidenceBadgeRow } from "@/components/EvidenceBadge";

interface SectionProps {
  title: string;
  body: string;
  codes?: string[];
  minComplexity?: 1 | 2 | 3 | 4;
}

function Section({ title, body, codes, minComplexity = 1 }: SectionProps) {
  const { complexity } = useLens();
  if (complexity < minComplexity) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
        {title}
      </h3>
      <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">{body}</p>
      {codes && codes.length > 0 ? (
        <div className="mt-3">
          <EvidenceBadgeRow codes={codes} />
        </div>
      ) : null}
    </section>
  );
}

export function AsanaDetailPanels({ asana }: { asana: AsanaRecord }) {
  const { lens, complexity, config } = useLens();

  return (
    <div className="space-y-4">
      {config.disclaimer ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {config.disclaimer}
        </div>
      ) : null}

      <Section title="Overview" body={asana.summary} codes={asana.evidenceCodes} />

      <Section
        title="Sharira & wellbeing"
        body={asana.shariraWellbeing}
        minComplexity={1}
      />

      {complexity >= 2 ? (
        <Section
          title="Insulin & glucose"
          body={asana.insulinGlucose}
          minComplexity={2}
        />
      ) : null}

      {complexity >= 2 ? (
        <Section
          title="Ayurveda / manas"
          body={asana.manasAyurveda}
          codes={asana.dosha?.evidenceCodes}
          minComplexity={2}
        />
      ) : null}

      {asana.dosha && complexity >= 3 && lens !== "wellness" ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
            Dosha effects
          </h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-3">
            {(["vata", "pitta", "kapha"] as const).map((dosha) => (
              <div key={dosha} className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                <dt className="font-medium capitalize">{dosha}</dt>
                <dd className="text-zinc-600 dark:text-zinc-400">
                  {asana.dosha?.[dosha] ?? "neutral"}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {asana.iyengar && complexity >= 2 && lens !== "scholar" ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
            Iyengar pedagogy
          </h3>
          {asana.iyengar.alignmentCues ? (
            <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
              {asana.iyengar.alignmentCues.map((cue) => (
                <li key={cue}>{cue}</li>
              ))}
            </ul>
          ) : null}
          {asana.iyengar.props ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Props: {asana.iyengar.props.join(", ")}
            </p>
          ) : null}
        </section>
      ) : null}

      {(asana.claims ?? []).length > 0 && complexity >= 4 && lens === "scholar" ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
            Claim provenance
          </h3>
          <ul className="space-y-3">
            {(asana.claims ?? []).map((claim) => (
              <li key={claim.id} className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {claim.statement}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <EvidenceBadgeRow codes={claim.evidenceCodes} />
                  {claim.tantrayukti?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-800 dark:bg-violet-950 dark:text-violet-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/30">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
          Safety
        </h3>
        <p className="mb-3 text-sm leading-7 text-rose-900 dark:text-rose-100">
          {asana.safety}
        </p>
        <ul className="space-y-2">
          {asana.contraindications.map((item) => (
            <li
              key={item.condition}
              className="rounded-lg bg-white/70 px-3 py-2 text-sm dark:bg-zinc-950/60"
            >
              <span className="font-medium">{item.condition}</span>
              <span className="text-rose-700 dark:text-rose-300">
                {" "}
                ({item.strength})
              </span>
              : {item.rationale}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
