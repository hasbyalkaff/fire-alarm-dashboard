"use client";

import { create } from "zustand";

export type Density = "comfortable" | "compact";

/** Row heights per density (Design System §6.3): comfortable 48px, compact 40px. */
export const ROW_HEIGHT: Record<Density, number> = { comfortable: 48, compact: 40 };

interface DensityState {
  density: Density;
  hydrated: boolean;
  setDensity: (d: Density) => void;
  hydrate: () => void;
}

/**
 * User-selectable table density, persisted to localStorage and shared across the
 * DataTable and the UserMenu toggle. Defaults to comfortable to match the resting
 * design; technicians scanning thousands of devices switch to compact.
 */
export const useDensity = create<DensityState>((set) => ({
  density: "comfortable",
  hydrated: false,
  setDensity: (density) => {
    if (typeof window !== "undefined") localStorage.setItem("facp-density", density);
    set({ density });
  },
  hydrate: () => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("facp-density") : null;
    set({ density: stored === "compact" ? "compact" : "comfortable", hydrated: true });
  },
}));
