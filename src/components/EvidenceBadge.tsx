import type { EvidenceCode } from "@/lib/types/ontology";

const CODE_STYLES: Record<EvidenceCode, string> = {
  T1: "bg-amber-100 text-amber-900 border-amber-300",
  T2: "bg-amber-50 text-amber-800 border-amber-200",
  B0: "bg-slate-100 text-slate-700 border-slate-300",
  B1: "bg-emerald-50 text-emerald-800 border-emerald-200",
  B2: "bg-emerald-100 text-emerald-900 border-emerald-300",
  B3: "bg-emerald-200 text-emerald-950 border-emerald-400",
  A1: "bg-indigo-50 text-indigo-800 border-indigo-200",
  A2: "bg-indigo-100 text-indigo-900 border-indigo-300",
};

export function EvidenceBadge({ code }: { code: EvidenceCode | string }) {
  const style =
    CODE_STYLES[code as EvidenceCode] ??
    "bg-zinc-100 text-zinc-700 border-zinc-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${style}`}
      title={`Evidence code: ${code}`}
    >
      {code}
    </span>
  );
}

export function EvidenceBadgeRow({ codes }: { codes: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {codes.map((code) => (
        <EvidenceBadge key={code} code={code} />
      ))}
    </div>
  );
}
