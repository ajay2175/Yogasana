export default function AdvisorPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Condition advisor</h1>
      <p className="max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        Phase 2 will add fractional anshamsha matching, post-meal logic, and
        safety veto scoring. For now, use Explore to inspect individual asanas
        and contraindications.
      </p>
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-sm font-medium">Planned intake variables</p>
        <ul className="mt-3 grid gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
          <li>Prakriti / vikriti fractional profile</li>
          <li>Goals (glucose, anxiety, back pain, sleep)</li>
          <li>Comorbidities and medications</li>
          <li>Kala: post-meal, season, time of day</li>
          <li>Biomechanical phenotype</li>
          <li>Lineage and prop availability</li>
        </ul>
      </div>
    </div>
  );
}
