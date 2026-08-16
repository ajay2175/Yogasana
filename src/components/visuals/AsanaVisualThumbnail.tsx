"use client";

/** Lightweight list preview — full 3D AR/VR studio loads on the detail page only. */
export function AsanaVisualThumbnail({
  poseKey,
  name,
}: {
  poseKey: string;
  name: string;
  steps?: unknown;
  anatomyRegions?: unknown;
}) {
  return (
    <div
      className="relative mb-4 flex aspect-[16/9] flex-col items-center justify-center overflow-hidden rounded-xl border border-teal-200 bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-900 dark:border-teal-800"
      aria-hidden
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-1/2 top-1/2 h-24 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/40" />
        <div className="absolute left-1/2 top-[38%] h-8 w-8 -translate-x-1/2 rounded-full bg-amber-200/50" />
      </div>
      <p className="relative z-10 text-xs font-semibold uppercase tracking-widest text-teal-200">
        3D · AR · VR
      </p>
      <p className="relative z-10 mt-1 px-4 text-center text-[11px] text-teal-100/90">
        Open for interactive pose simulation
      </p>
      <span className="sr-only">{name} — {poseKey} 3D preview available on detail page</span>
    </div>
  );
}
