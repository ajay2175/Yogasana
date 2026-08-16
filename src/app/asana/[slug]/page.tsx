import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllAsanas, getAsanaBySlug } from "@/lib/data/catalog";
import { getVisualsForSlug } from "@/lib/visuals/catalog";
import { AsanaDetailPanels } from "@/components/AsanaDetailPanels";
import { AsanaVisualStudio } from "@/components/visuals/AsanaVisualStudio";
import { LensControls } from "@/components/LensControls";
import { EvidenceBadgeRow } from "@/components/EvidenceBadge";

export function generateStaticParams() {
  return getAllAsanas().map((asana) => ({
    slug: asana.identity.slug,
  }));
}

export default async function AsanaDetailPage({
  params,
}: PageProps<"/asana/[slug]">) {
  const { slug } = await params;
  const asana = getAsanaBySlug(slug);
  const visuals = getVisualsForSlug(slug);

  if (!asana) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link
        href="/explore"
        className="text-sm text-teal-700 hover:underline dark:text-teal-300"
      >
        ← Back to explore
      </Link>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">{asana.identity.nameSanskrit}</p>
        <h1 className="mt-1 text-4xl font-semibold">{asana.identity.nameEnglish}</h1>
        {asana.identity.aliases.length > 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Also known as: {asana.identity.aliases.join(", ")}
          </p>
        ) : null}
        <div className="mt-4">
          <EvidenceBadgeRow codes={asana.evidenceCodes} />
        </div>
      </div>

      {visuals ? <AsanaVisualStudio pack={visuals} poseName={asana.identity.nameEnglish} /> : null}

      <LensControls />
      <AsanaDetailPanels asana={asana} />
    </div>
  );
}
