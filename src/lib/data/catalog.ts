import type { AsanaCatalog } from "@/lib/types/asana";
import catalog from "@/data/asana-catalog.json";

export function getCatalog(): AsanaCatalog {
  return catalog as AsanaCatalog;
}

export function getAllAsanas() {
  return getCatalog().asanas;
}

export function getAsanaBySlug(slug: string) {
  return getAllAsanas().find((asana) => asana.identity.slug === slug);
}

export function searchAsanas(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return getAllAsanas();
  }

  return getAllAsanas().filter((asana) => {
    const haystack = [
      asana.identity.nameEnglish,
      asana.identity.nameSanskrit,
      ...asana.identity.aliases,
      asana.identity.slug,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}
