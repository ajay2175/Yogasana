"use client";

import { LENSES, COMPLEXITY_LABELS } from "@/lib/lens/config";
import { useLens } from "@/components/LensProvider";
import type { ComplexityLevel, LensId } from "@/lib/types/ontology";

export function LensControls() {
  const { lens, complexity, setLens, setComplexity, config } = useLens();

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Lens
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(LENSES) as LensId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setLens(id)}
              className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                lens === id
                  ? "border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-950 dark:text-teal-100"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
              }`}
            >
              <span className="block font-medium">{LENSES[id].label}</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {LENSES[id].description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Detail level
          </p>
          <span className="text-xs text-zinc-500">
            {COMPLEXITY_LABELS[complexity]} ({complexity}/{config.maxComplexity})
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={config.maxComplexity}
          step={1}
          value={complexity}
          onChange={(event) =>
            setComplexity(Number(event.target.value) as ComplexityLevel)
          }
          className="w-full accent-teal-600"
        />
      </div>
    </div>
  );
}
