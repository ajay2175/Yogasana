"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ComplexityLevel, LensId } from "@/lib/types/ontology";
import { LENSES } from "@/lib/lens/config";
import type { LensContextValue } from "@/lib/lens/formatters";

const LensContext = createContext<LensContextValue | null>(null);

export function LensProvider({ children }: { children: ReactNode }) {
  const [lens, setLensState] = useState<LensId>("wellness");
  const [complexity, setComplexityState] = useState<ComplexityLevel>(1);

  const setLens = (next: LensId) => {
    setLensState(next);
    setComplexityState(LENSES[next].defaultComplexity);
  };

  const value = useMemo<LensContextValue>(
    () => ({
      lens,
      complexity,
      setLens,
      setComplexity: setComplexityState,
      config: LENSES[lens],
    }),
    [lens, complexity],
  );

  return <LensContext.Provider value={value}>{children}</LensContext.Provider>;
}

export function useLens() {
  const context = useContext(LensContext);
  if (!context) {
    throw new Error("useLens must be used within LensProvider");
  }
  return context;
}
