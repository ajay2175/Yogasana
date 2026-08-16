import type { AsanaVisualCatalog } from "@/lib/types/visuals";
import visuals from "@/data/asana-visuals.json";

export function getVisualCatalog(): AsanaVisualCatalog {
  return visuals as AsanaVisualCatalog;
}

export function getVisualsForSlug(slug: string) {
  return getVisualCatalog().packs.find((pack) => pack.slug === slug);
}
