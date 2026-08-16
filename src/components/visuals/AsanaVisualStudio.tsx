"use client";

import { useState } from "react";
import type { AsanaVisualPack, VisualTab } from "@/lib/types/visuals";
import { PoseSimulationPlayer } from "./PoseSimulationPlayer";
import { PhotoGallery, ReferencePhotoPanel } from "./ReferencePhotoPanel";
import { VideoEmbedPanel } from "./VideoEmbedPanel";
import { PoseDiagram } from "./PoseDiagram";

const TABS: { id: VisualTab; label: string; hint: string }[] = [
  { id: "simulation", label: "Step simulation", hint: "Animated entry → hold → refinement" },
  { id: "photo", label: "Reference photos", hint: "Real-body shape and alignment" },
  { id: "video", label: "Instruction video", hint: "Short expert demonstration" },
  { id: "anatomy", label: "Anatomy map", hint: "Loaded regions for clinicians" },
];

export function AsanaVisualStudio({ pack }: { pack: AsanaVisualPack }) {
  const [tab, setTab] = useState<VisualTab>("simulation");

  const photos = pack.gallery?.length
    ? pack.gallery
    : pack.referencePhoto
      ? [pack.referencePhoto]
      : [];

  return (
    <section className="rounded-3xl border border-teal-200 bg-gradient-to-br from-white to-teal-50/40 p-6 dark:border-teal-900 dark:from-zinc-950 dark:to-teal-950/20">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
          Visual studio
        </p>
        <h2 className="mt-1 text-2xl font-semibold">See the pose before you practice</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Use simulation steps for learning, reference photos for shape, videos for
          lineage technique, and anatomy overlays for clinical visualization.
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
            title={item.hint}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "simulation" ? (
        <PoseSimulationPlayer
          poseKey={pack.poseKey}
          steps={pack.steps}
          caption={pack.simulationCaption}
        />
      ) : null}

      {tab === "photo" ? (
        photos.length > 0 ? (
          <PhotoGallery photos={photos} />
        ) : (
          <p className="text-sm text-zinc-500">Reference photos coming soon for this pose.</p>
        )
      ) : null}

      {tab === "video" ? (
        pack.videos.length > 0 ? (
          <div className="space-y-8">
            {pack.videos.map((video) => (
              <VideoEmbedPanel key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Video demonstrations coming soon.</p>
        )
      ) : null}

      {tab === "anatomy" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="aspect-[5/8] overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <PoseDiagram
              poseKey={pack.poseKey}
              step={2}
              highlightRegions={pack.anatomyRegions}
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">
              {pack.biomechanicsCaption}
            </p>
            <ul className="space-y-3">
              {pack.anatomyRegions.map((region) => (
                <li
                  key={region.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <p className="font-medium text-rose-700 dark:text-rose-300">
                    {region.label}
                  </p>
                  <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {region.clinicalNote}
                  </p>
                  {region.ayurvedaNote ? (
                    <p className="mt-2 text-xs text-indigo-700 dark:text-indigo-300">
                      Ayurveda: {region.ayurvedaNote}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** Compact thumbnail for cards — always shows hold-phase diagram */
export function AsanaVisualThumbnail({
  poseKey,
  name,
}: {
  poseKey: string;
  name: string;
}) {
  return (
    <div
      className="relative mb-4 aspect-[5/3] overflow-hidden rounded-xl border border-teal-100 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/30"
      aria-hidden
    >
      <PoseDiagram poseKey={poseKey} step={2} className="scale-110" />
      <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
        Preview
      </span>
      <span className="sr-only">{name} pose preview</span>
    </div>
  );
}
