"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { AnnotatedPoseStep, ManualPoseAnnotation } from "@/lib/types/visuals";
import { BLAZEPOSE_CONNECTIONS, BLAZEPOSE_LABELS } from "@/lib/visuals/blazepose-topology";

export function AnnotatedAlignmentView({
  annotation,
  step,
  poseName,
}: {
  annotation: ManualPoseAnnotation;
  step: AnnotatedPoseStep;
  poseName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(13, 148, 136, 0.95)";
    ctx.lineCap = "round";

    for (const [a, b] of BLAZEPOSE_CONNECTIONS) {
      const pa = step.landmarks[String(a)];
      const pb = step.landmarks[String(b)];
      if (!pa || !pb) continue;
      ctx.beginPath();
      ctx.moveTo(pa.x * w, pa.y * h);
      ctx.lineTo(pb.x * w, pb.y * h);
      ctx.stroke();
    }

    for (const [idxStr, point] of Object.entries(step.landmarks)) {
      const idx = Number(idxStr);
      ctx.fillStyle = BLAZEPOSE_LABELS[idx] ? "#ef4444" : "#0d9488";
      ctx.beginPath();
      ctx.arc(point.x * w, point.y * h, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [step]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-teal-300 bg-zinc-900">
        <Image
          src={annotation.imageUrl}
          alt={`${poseName} annotated alignment`}
          fill
          className="object-cover"
          sizes="800px"
        />
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        <div className="absolute left-3 top-3 rounded-full bg-emerald-700/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
          Hand-annotated alignment
        </div>
      </div>

      <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-900 dark:bg-teal-950/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-200">
          {step.label} · {annotation.lineage ?? annotation.poseKey}
        </p>
        {annotation.reviewedBy ? (
          <p className="mt-1 text-xs text-zinc-500">Reviewed by {annotation.reviewedBy}</p>
        ) : (
          <p className="mt-1 text-xs text-zinc-500">Annotator: {annotation.annotator}</p>
        )}
        {step.alignmentNotes?.length ? (
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            {step.alignmentNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <p className="text-xs text-zinc-500">
        Red joints: primary alignment checkpoints. This layer is for teaching and future
        pose-comparison — not auto-generated.
      </p>
    </div>
  );
}
