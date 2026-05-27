"use client";

import {
  COLUMN_DESCRIPTION,
  COLUMN_LABEL,
  COLUMN_ORDER,
  EXPERIMENTAL_COLUMN_ORDER,
} from "@/lib/types";
import { ChecksDot, ReviewBadge } from "./PRCard";

export function HelpModal({
  open,
  onClose,
  experimental,
}: {
  open: boolean;
  onClose: () => void;
  experimental: boolean;
}) {
  if (!open) return null;

  const columns = experimental ? EXPERIMENTAL_COLUMN_ORDER : COLUMN_ORDER;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-neutral-200 bg-white p-5 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">What the board shows</h2>

        {/* Columns — adapts to the active layout */}
        <div className="mt-4 flex items-baseline justify-between">
          <h3 className="text-sm font-medium">Columns</h3>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {experimental ? "Experimental layout" : "Standard layout"}
          </span>
        </div>
        <dl className="mt-2 space-y-2.5">
          {columns.map((col) => (
            <div key={col}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {COLUMN_LABEL[col]}
              </dt>
              <dd className="mt-0.5 text-sm text-neutral-700 dark:text-neutral-300">
                {COLUMN_DESCRIPTION[col]}
              </dd>
            </div>
          ))}
        </dl>

        {/* Card indicators — live swatches */}
        <h3 className="mt-5 text-sm font-medium">Card indicators</h3>
        <ul className="mt-2 space-y-3">
          <li>
            <div className="flex flex-wrap items-center gap-1">
              <ReviewBadge decision="APPROVED" />
              <ReviewBadge decision="CHANGES_REQUESTED" />
              <ReviewBadge decision="REVIEW_REQUIRED" />
            </div>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              Review status: approved, changes requested, or pending. Hidden
              until a review exists.
            </p>
          </li>
          <li>
            <div className="flex items-center gap-2">
              <ChecksDot state="SUCCESS" />
              <ChecksDot state="FAILURE" />
              <ChecksDot state="PENDING" />
            </div>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              CI checks: passing (green), failing (red), running (amber).
            </p>
          </li>
          <li>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Waiting on{" "}
              <span className="text-neutral-700 dark:text-neutral-200">
                @alice
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              Reviewers a PR is blocked on. Toggle with &ldquo;Show pending
              reviewers on cards&rdquo; in Settings.
            </p>
          </li>
          <li>
            <span
              className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: "#3b82f622", color: "#3b82f6" }}
            >
              Stack 1/3
            </span>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              The PR belongs to a stack (linked by branch base, or a shared
              ticket key like GXP-2287). The colored left edge groups
              stackmates.
            </p>
          </li>
        </ul>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
