const DOMAINS = [
  "Tantrayukti interpretive meta-layer",
  "Ansh–Ansa / Amshamsha Kalpana",
  "Panchamahabhuta & tridosha gunas",
  "Sapta dhatu, mala, agni taxonomy",
  "13 srotasas + moola sthana",
  "Pancha kosha, indriya, triguna",
  "Biomechanics & biokinetics",
  "Clinical psychophysiology",
  "Lineage pedagogy (Iyengar-first)",
  "Evidence governance (T/B/A codes)",
];

export default function PrinciplesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Principles library</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          The full ontology spans roughly 120 variables across 22 domains. Phase
          4 will add browsable siddhanta articles with Tantrayukti tagging and
          scholar exports.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {DOMAINS.map((domain) => (
          <div
            key={domain}
            className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {domain}
          </div>
        ))}
      </div>
    </div>
  );
}
