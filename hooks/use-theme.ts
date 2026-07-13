"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "system";

function apply(pref: ThemePref) {
  const dark =
    pref === "dark" ||
    (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("facp-theme") as ThemePref | null) ?? "system";
    setPref(stored);
  }, []);

  const setTheme = useCallback((next: ThemePref) => {
    setPref(next);
    localStorage.setItem("facp-theme", next);
    apply(next);
  }, []);

  return { pref, setTheme };
}
