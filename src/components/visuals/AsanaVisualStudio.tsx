"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { AsanaVisualPack, VisualTab } from "@/lib/types/visuals";

const ImmersivePoseSimulator = dynamic(
  () =>
    import("./three/ImmersivePoseSimulator").then((mod) => mod.ImmersivePoseSimulator),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(70vh,520px)] items-center justify-center rounded-2xl bg-slate-900 text-sm text-teal-200">
        Loading 3D pose simulator…
      </div>
    ),
  },
);

const TABS: { id: VisualTab; label: string; hint: string }[] = [
  {
    id: "simulation3d",
    label: "3D simulation video",
    hint: "Auto-playing avatar mimics entry → hold → refine",
  },
  {
    id: "immersive",
    label: "VR / AR view",
    hint: "Orbit in 3D or enter AR/VR on supported devices",
  },
  {
    id: "anatomy",
    label: "3D anatomy overlay",
    hint: "Loaded regions highlighted on the avatar",
  },
];

export function AsanaVisualStudio({
  pack,
  poseName,
}: {
  pack: AsanaVisualPack;
  poseName: string;
}) {
  const [tab, setTab] = useState<VisualTab>("simulation3d");

  return (
    <section className="rounded-3xl border border-teal-200 bg-gradient-to-br from-white to-teal-50/40 p-6 dark:border-teal-900 dark:from-zinc-950 dark:to-teal-950/20">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
          Immersive visual studio
        </p>
        <h2 className="mt-1 text-2xl font-semibold">3D pose mimic — no external video links</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          A procedural 3D avatar performs each asana step-by-step like a simulation video. Rotate
          with drag, zoom with scroll, or use Enter AR / Enter VR on supported phones and headsets.
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

      <ImmersivePoseSimulator
        poseKey={pack.poseKey}
        poseName={poseName}
        steps={pack.steps}
        anatomyRegions={pack.anatomyRegions}
        caption={pack.simulationCaption}
        mode={tab === "immersive" ? "immersive" : tab === "anatomy" ? "anatomy" : "simulation"}
      />

      {tab === "anatomy" ? (
        <ul className="mt-6 space-y-3">
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
        </ul>
      ) : null}
    </section>
  );
}