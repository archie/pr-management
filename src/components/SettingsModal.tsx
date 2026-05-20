"use client";

import { useEffect, useState } from "react";
import type { Settings } from "@/hooks/useSettings";

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

  useEffect(() => {
    if (open) setOrgsText(settings.orgs.join(", "));
  }, [open, settings.orgs]);

  if (!open) return null;

  const handleSave = () => {
    const orgs = orgsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onSave({ orgs });
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
