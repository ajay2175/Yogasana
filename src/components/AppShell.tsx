import Link from "next/link";
import { LensProvider } from "@/components/LensProvider";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/advisor", label: "Advisor" },
  { href: "/principles", label: "Principles" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LensProvider>
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-semibold text-zinc-900 dark:text-zinc-100">
            Asana Integrative Advisor
          </Link>
          <nav className="flex gap-4 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-zinc-600 hover:text-teal-700 dark:text-zinc-300 dark:hover:text-teal-300"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-zinc-200 px-4 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
        Textual, biomedical, and integrative claims are labeled separately. Not medical advice.
      </footer>
    </LensProvider>
  );
}
