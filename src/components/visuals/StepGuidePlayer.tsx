"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { SimulationStep } from "@/lib/types/visuals";

export function StepGuidePlayer({
  steps,
  photoUrl,
  poseName,
  alt,
}: {
  steps: SimulationStep[];
  photoUrl: string;
  poseName: string;
  alt: string;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const step = steps[index] ?? steps[0];

  useEffect(() => {
    if (!playing || !step) return;
    const timer = window.setTimeout(() => {
      setIndex((i) => (i + 1) % steps.length);
    }, step.durationMs);
    return () => window.clearTimeout(timer);
  }, [index, playing, step, steps.length]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 dark:border-zinc-800">
        <Image src={photoUrl} alt={alt} fill className="object-cover" sizes="(max-width:768px) 100vw, 800px" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">
            Step {index + 1} of {steps.length}
          </p>
          <p className="mt-1 text-lg font-semibold">{poseName} — {step.label}</p>
          <p className="mt-2 text-sm leading-6 text-white/90">{step.instruction}</p>
        </div>
        <div className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
          Step guide
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white"
        >
          {playing ? "Pause" : "Play"}
        </button>
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setIndex(i);
              setPlaying(false);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              i === index ? "border-teal-600 bg-teal-50 text-teal-900" : "border-zinc-300 text-zinc-600"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
