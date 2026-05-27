"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pr-board-settings:v1";

export type Theme = "system" | "light" | "dark";

export interface Settings {
  orgs: string[];
  showDone: boolean;
  showWaitingFor: boolean;
  experimentalBoard: boolean;
  theme: Theme;
}

const DEFAULT_SETTINGS: Settings = {
  orgs: ["MinutHQ"],
  showDone: true,
  showWaitingFor: true,
  experimentalBoard: false,
  theme: "system",
};

function isTheme(v: unknown): v is Theme {
  return v === "system" || v === "light" || v === "dark";
}

function read(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      orgs: Array.isArray(parsed.orgs) ? parsed.orgs : DEFAULT_SETTINGS.orgs,
      showDone:
        typeof parsed.showDone === "boolean"
          ? parsed.showDone
          : DEFAULT_SETTINGS.showDone,
      showWaitingFor:
        typeof parsed.showWaitingFor === "boolean"
          ? parsed.showWaitingFor
          : DEFAULT_SETTINGS.showWaitingFor,
      experimentalBoard:
        typeof parsed.experimentalBoard === "boolean"
          ? parsed.experimentalBoard
          : DEFAULT_SETTINGS.experimentalBoard,
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_SETTINGS.theme,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(read());
    setHydrated(true);
  }, []);

  const update = useCallback((next: Settings) => {
    setSettings(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, []);

  return { settings, update, hydrated };
}
