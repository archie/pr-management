"use client";

import { useEffect, useState } from "react";
import type { Settings, Theme } from "@/hooks/useSettings";

export function SettingsModal({
  open,
  onClose,
  settings,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (next: Settings) => void;
}) {
  const [orgsText, setOrgsText] = useState(settings.orgs.join(", "));
  const [showDone, setShowDone] = useState(settings.showDone);
  const [showWaitingFor, setShowWaitingFor] = useState(settings.showWaitingFor);
  const [experimentalBoard, setExperimentalBoard] = useState(
    settings.experimentalBoard,
  );
  const [theme, setTheme] = useState<Theme>(settings.theme);

  useEffect(() => {
    if (open) {
      setOrgsText(settings.orgs.join(", "));
      setShowDone(settings.showDone);
      setShowWaitingFor(settings.showWaitingFor);
      setExperimentalBoard(settings.experimentalBoard);
      setTheme(settings.theme);
    }
  }, [
    open,
    settings.orgs,
    settings.showDone,
    settings.showWaitingFor,
    settings.experimentalBoard,
    settings.theme,
  ]);

  if (!open) return null;

  const handleSave = () => {
    const orgs = orgsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onSave({ orgs, showDone, showWaitingFor, experimentalBoard, theme });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-5 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">Settings</h2>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Filter PRs by GitHub org or user. Comma-separated. Leave empty to
          include every repo you can see.
        </p>
        <label className="mt-4 block text-sm font-medium">Orgs / users</label>
        <input
          type="text"
          value={orgsText}
          onChange={(e) => setOrgsText(e.target.value)}
          placeholder="MinutHQ, anthropics"
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700"
          />
          <span>Show &ldquo;Done&rdquo; column</span>
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showWaitingFor}
            onChange={(e) => setShowWaitingFor(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700"
          />
          <span>Show pending reviewers on cards</span>
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={experimentalBoard}
            onChange={(e) => setExperimentalBoard(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700"
          />
          <span>
            Experimental board layout{" "}
            <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              Beta
            </span>
          </span>
        </label>
        <p className="ml-6 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Replaces &ldquo;Review required&rdquo; and &ldquo;Changes
          requested&rdquo; with &ldquo;Waiting my input&rdquo; and &ldquo;Waiting
          for review&rdquo;, grouping your open PRs by whose turn it is.
        </p>
        <label className="mt-4 block text-sm font-medium">Theme</label>
        <div className="mt-1 inline-flex rounded-md border border-neutral-300 p-0.5 dark:border-neutral-700">
          {(["system", "light", "dark"] as Theme[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTheme(option)}
              className={
                theme === option
                  ? "rounded px-3 py-1 text-xs font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "rounded px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }
            >
              {option === "system" ? "System" : option === "light" ? "Light" : "Dark"}
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
