"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pr-board-settings:v1";

export interface Settings {
  orgs: string[];
}

const DEFAULT_SETTINGS: Settings = {
  orgs: ["MinutHQ"],
};

function read(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      orgs: Array.isArray(parsed.orgs) ? parsed.orgs : DEFAULT_SETTINGS.orgs,
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
