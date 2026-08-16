"use client";

import { useState } from "react";
import type { AsanaVisualPack, VisualTab } from "@/lib/types/visuals";
import { StepGuidePlayer } from "./StepGuidePlayer";
import { VideoEmbedPanel } from "./VideoEmbedPanel";
import { ReferencePhotoPanel, PhotoGallery } from "./ReferencePhotoPanel";

const TABS: { id: VisualTab; label: string }[] = [
  { id: "steps", label: "Step guide" },
  { id: "video", label: "Demonstration video" },
  { id: "reference", label: "Reference photo" },
  { id: "anatomy", label: "Anatomy & load" },
];

export function AsanaVisualStudio({
  pack,
  poseName,
}: {
  pack: AsanaVisualPack;
  poseName: string;
}) {
  const [tab, setTab] = useState<VisualTab>("steps");
  const photoUrl = pack.referencePhoto?.url ?? `/reference-poses/${pack.poseKey}.jpg`;
  const primaryVideo = pack.videos[0];

  return (
    <section className="rounded-3xl border border-teal-200 bg-gradient-to-br from-white to-teal-50/40 p-6 dark:border-teal-900 dark:from-zinc-950 dark:to-teal-950/20">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
          Instruction studio
        </p>
        <h2 className="mt-1 text-2xl font-semibold">How to practice {poseName}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Real reference photos and verified instructor videos — not synthetic 3D. Follow the step
          guide, then watch the demonstration for alignment cues from an experienced teacher.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              tab === item.id
                ? "bg-teal-700 text-white"
                : "border border-zinc-200 bg-white text-zinc-700 hover:border-teal-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "steps" ? (
        <StepGuidePlayer
          steps={pack.steps}
          photoUrl={photoUrl}
          poseName={poseName}
          alt={pack.referencePhoto?.alt ?? `${poseName} reference`}
        />
      ) : null}

      {tab === "video" && primaryVideo ? (
        <VideoEmbedPanel video={primaryVideo} />
      ) : null}

      {tab === "reference" && pack.referencePhoto ? (
        <>
          <ReferencePhotoPanel photo={pack.referencePhoto} />
          {pack.gallery?.length ? (
            <div className="mt-6">
              <PhotoGallery photos={pack.gallery} />
            </div>
          ) : null}
        </>
      ) : null}

      {tab === "anatomy" ? (
        <ul className="space-y-3">
          {pack.anatomyRegions.map((region) => (
            <li
              key={region.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="font-medium text-rose-700 dark:text-rose-300">{region.label}</p>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{region.clinicalNote}</p>
              {region.ayurvedaNote ? (
                <p className="mt-2 text-xs text-indigo-700 dark:text-indigo-300">
                  Ayurveda: {region.ayurvedaNote}
                </p>
              ) : null}
            </li>
          ))}
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{pack.biomechanicsCaption}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{pack.simulationCaption}</p>
        </ul>
      ) : null}
    </section>
  );
}
