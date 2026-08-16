"use client";

import { useEffect, useRef } from "react";
import type { PoseLandmarkFrame } from "@/lib/visuals/mediapipe-pose-engine";
import { POSE_CONNECTIONS } from "@/lib/visuals/asana-pose-catalog";

export function PhotoPoseSimulation({
  photoUrl,
  frame,
  poseName,
  stepLabel,
}: {
  photoUrl: string;
  frame: PoseLandmarkFrame | null;
  poseName: string;
  stepLabel: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      draw();
    };
    img.src = photoUrl;
  }, [photoUrl]);

  useEffect(() => {
    draw();
  }, [frame, photoUrl]);

  function draw() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    if (!frame?.normalized?.length) return;

    const px = (x: number) => x * w;
    const py = (y: number) => y * h;

    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(13, 148, 136, 0.95)";
    ctx.lineCap = "round";

    for (const [a, b] of POSE_CONNECTIONS) {
      const pa = frame.normalized[a];
      const pb = frame.normalized[b];
      if (!pa || !pb) continue;
      ctx.beginPath();
      ctx.moveTo(px(pa.x), py(pa.y));
      ctx.lineTo(px(pb.x), py(pb.y));
      ctx.stroke();
    }

    for (const idx of [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
      const p = frame.normalized[idx];
      if (!p) continue;
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(px(p.x), py(p.y), 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} width={800} height={600} className="h-full w-full object-contain" />
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-2 text-sm text-white">
        {poseName} — {stepLabel}
      </div>
    </div>
  );
}
