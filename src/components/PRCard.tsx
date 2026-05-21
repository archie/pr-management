import type { PR } from "@/lib/types";
import clsx from "clsx";

function ChecksDot({ state }: { state: PR["checksState"] }) {
  if (state === null) return null;
  const color =
    state === "SUCCESS"
      ? "bg-emerald-500"
      : state === "FAILURE" || state === "ERROR"
        ? "bg-rose-500"
        : "bg-amber-400";
  const title =
    state === "SUCCESS"
      ? "Checks passing"
      : state === "FAILURE" || state === "ERROR"
        ? "Checks failing"
        : "Checks running";
  return (
    <span
      title={title}
      className={clsx("inline-block h-2 w-2 rounded-full", color)}
    />
  );
}

function ReviewBadge({ decision }: { decision: PR["reviewDecision"] }) {
  if (!decision) return null;
  const label =
    decision === "APPROVED"
      ? "Approved"
      : decision === "CHANGES_REQUESTED"
        ? "Changes"
        : "Pending";
  const color =
    decision === "APPROVED"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      : decision === "CHANGES_REQUESTED"
        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  return (
    <span
      className={clsx(
        "rounded px-1.5 py-0.5 text-[10px] font-medium",
        color,
      )}
    >
      {label}
    </span>
  );
}

export function PRCard({ pr }: { pr: PR }) {
  return (
    <a
      href={pr.url}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        "group block rounded-md border border-neutral-200 bg-white p-2.5 shadow-sm transition",
        "hover:border-neutral-300 hover:shadow",
        "dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700",
      )}
      style={
        pr.stackColor
          ? { boxShadow: `inset 3px 0 0 0 ${pr.stackColor}` }
          : undefined
      }
    >
      <div className="min-w-0">
        <div className="line-clamp-2 text-sm font-medium leading-snug text-neutral-900 dark:text-neutral-100">
          {pr.title}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
          <span className="font-mono">#{pr.number}</span>
          <span className="text-neutral-300 dark:text-neutral-600">·</span>
          <span
            className="truncate font-mono text-neutral-600 dark:text-neutral-300"
            title={pr.headRefName}
          >
            {pr.headRefName}
          </span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ReviewBadge decision={pr.reviewDecision} />
        <ChecksDot state={pr.checksState} />
        {pr.stackId && pr.stackPosition && pr.stackSize ? (
          <span
            className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${pr.stackColor}22`,
              color: pr.stackColor ?? undefined,
            }}
            title={`Part of a stack of ${pr.stackSize}`}
          >
            Stack {pr.stackPosition}/{pr.stackSize}
          </span>
        ) : null}
      </div>
    </a>
  );
}
