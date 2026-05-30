"use client";

import { useEffect } from "react";

export type AppearanceSettings = {
  theme:
    | "midnight"
    | "graphite"
    | "light"
    | "nordic"
    | "sunset"
    | "sakura"
    | "ocean"
    | "forest"
    | "royal"
    | "noir"
    | "copper"
    | "aurora";
  accent:
    | "cyan"
    | "blue"
    | "indigo"
    | "violet"
    | "emerald"
    | "lime"
    | "rose"
    | "pink"
    | "amber"
    | "orange"
    | "white";
  density: "comfortable" | "compact";
  motion: "full" | "reduced";
};

export const appearanceStorageKey = "nextrack:appearance";

export const defaultAppearance: AppearanceSettings = {
  theme: "midnight",
  accent: "cyan",
  density: "comfortable",
  motion: "full"
};

export function applyAppearance(settings: AppearanceSettings) {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.accent = settings.accent;
  root.dataset.density = settings.density;
  root.dataset.motion = settings.motion;
}

export function readAppearance(): AppearanceSettings {
  try {
    const stored = window.localStorage.getItem(appearanceStorageKey);
    return stored ? { ...defaultAppearance, ...JSON.parse(stored) } : defaultAppearance;
  } catch {
    return defaultAppearance;
  }
}

export function AppearanceController() {
  useEffect(() => {
    applyAppearance(readAppearance());
  }, []);

  return null;
}
