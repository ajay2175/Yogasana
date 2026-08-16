"use client";

import { useState } from "react";
import Image from "next/image";
import type { ReferencePhoto } from "@/lib/types/visuals";

export function ReferencePhotoPanel({ photo }: { photo: ReferencePhoto }) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
        {failed ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-zinc-500">
            Reference photo unavailable — use the step simulation or video tab.
          </div>
        ) : (
          <Image
            src={photo.url}
            alt={photo.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <figcaption className="text-xs leading-5 text-zinc-500">
        {photo.credit}
        {photo.license ? ` · ${photo.license}` : null}
      </figcaption>
    </figure>
  );
}

export function PhotoGallery({ photos }: { photos: ReferencePhoto[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {photos.map((photo) => (
        <ReferencePhotoPanel key={photo.url} photo={photo} />
      ))}
    </div>
  );
}
