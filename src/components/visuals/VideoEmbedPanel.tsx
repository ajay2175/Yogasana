"use client";

import type { DemonstrationVideo } from "@/lib/types/visuals";

export function VideoEmbedPanel({ video }: { video: DemonstrationVideo }) {
  const start = video.startSeconds ? `?start=${video.startSeconds}` : "";

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-200 bg-black dark:border-zinc-800">
        <iframe
          title={video.title}
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}${start}`}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">{video.title}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {video.instructor} · {video.durationLabel}
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          {video.note}
        </p>
      </div>
    </div>
  );
}
