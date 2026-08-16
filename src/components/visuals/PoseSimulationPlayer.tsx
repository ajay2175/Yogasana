"use client";

import { useEffect, useState } from "react";
import type { SimulationStep } from "@/lib/types/visuals";
import { PoseDiagram } from "./PoseDiagram";

interface PoseSimulationPlayerProps {
  poseKey: string;
  steps: SimulationStep[];
  caption: string;
}

export function PoseSimulationPlayer({
  poseKey,
  steps,
  caption,
}: PoseSimulationPlayerProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  const current = steps[index] ?? steps[0];

  useEffect(() => {
    if (!playing || steps.length <= 1) {
      return;
    }
    const timer = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % steps.length);
    }, current.durationMs);
    return () => window.clearTimeout(timer);
  }, [playing, index, current.durationMs, steps.length]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-[5/8] overflow-hidden rounded-2xl border border-teal-200 bg-white dark:border-teal-900 dark:bg-zinc-950">
        <PoseDiagram poseKey={poseKey} step={current.poseStep} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-teal-200">
            Step {index + 1} / {steps.length}
          </p>
          <p className="text-lg font-semibold">{current.label}</p>
        </div>
      </div>

      <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        {current.instruction}
      </p>
      <p className="text-xs text-zinc-500">{caption}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
        >
          {playing ? "Pause simulation" : "Play simulation"}
        </button>
        {steps.map((step, stepIndex) => (
          <button
            key={step.id}
            type="button"
            onClick={() => {
              setIndex(stepIndex);
              setPlaying(false);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              stepIndex === index
                ? "border-teal-600 bg-teal-50 text-teal-900 dark:bg-teal-950 dark:text-teal-100"
                : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            {step.label}
          </button>
        ))}
      </div>
    </div>
  );
}
