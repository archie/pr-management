"use client";

import type { BoardData, ColumnId, PR } from "@/lib/types";
import { COLUMN_LABEL, COLUMN_ORDER, EXPERIMENTAL_COLUMN_ORDER } from "@/lib/types";
import { toExperimentalColumn } from "@/lib/kanban";
import { useHotkeys } from "@/hooks/useHotkeys";
import { PRCard } from "./PRCard";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const COLLAPSED_KEY = "pr-board-collapsed-repos:v1";

// Collapsed swimlanes are a per-browser convenience, so they live in their own
// localStorage key rather than in Settings.
function useCollapsedRepos() {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COLLAPSED_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setCollapsed(new Set(parsed.filter((r) => typeof r === "string")));
      }
    } catch {
      // ignore unreadable storage; everything starts expanded
    }
  }, []);

  const toggle = useCallback((repo: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(repo)) next.delete(repo);
      else next.add(repo);
      try {
        window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
      } catch {
        // ignore; the toggle still works for this session
      }
      return next;
    });
  }, []);

  const setMany = useCallback((repos: string[], collapse: boolean) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      for (const r of repos) {
        if (collapse) next.add(r);
        else next.delete(r);
      }
      try {
        window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
      } catch {
        // ignore; the change still applies for this session
      }
      return next;
    });
  }, []);

  return { collapsed, toggle, setMany };
}

function bucketize(prs: PR[]) {
  // bucket[repo][column] = PR[]
  const map = new Map<string, Map<ColumnId, PR[]>>();
  for (const pr of prs) {
    if (!map.has(pr.repo)) map.set(pr.repo, new Map());
    const inner = map.get(pr.repo)!;
    if (!inner.has(pr.column)) inner.set(pr.column, []);
    inner.get(pr.column)!.push(pr);
  }
  // sort each bucket: stacks together (by stack id+position), then by updatedAt desc
  for (const inner of map.values()) {
    for (const list of inner.values()) {
      list.sort((a, b) => {
        if (a.stackId && b.stackId && a.stackId === b.stackId) {
          return (a.stackPosition ?? 0) - (b.stackPosition ?? 0);
        }
        if (a.stackId && !b.stackId) return -1;
        if (!a.stackId && b.stackId) return 1;
        if (a.stackId && b.stackId) return a.stackId.localeCompare(b.stackId);
        return b.updatedAt.localeCompare(a.updatedAt);
      });
    }
  }
  return map;
}

export function Board({
  data,
  hiddenColumns,
  showWaitingFor = true,
  experimental = false,
  corner,
  emptyMessage = "No pull requests found. Try adjusting orgs in settings.",
  shortcutsEnabled = true,
  onNotify,
}: {
  data: BoardData;
  hiddenColumns?: ColumnId[];
  showWaitingFor?: boolean;
  experimental?: boolean;
  /** Rendered in the header row above the repo column (the app title and controls). */
  corner?: ReactNode;
  /** Shown instead of the board when no PRs are visible. */
  emptyMessage?: ReactNode;
  /** Card shortcuts (j/k, enter, c, [ ]) are live; off while a modal is open. */
  shortcutsEnabled?: boolean;
  /** Short confirmation for keyboard actions, e.g. a copied link. */
  onNotify?: (message: string) => void;
}) {
  // In experimental mode, remap each PR's column to the "whose turn is it"
  // layout; everything downstream reads the (possibly remapped) pr.column.
  const prs = useMemo(
    () =>
      experimental
        ? data.prs.map((p) => ({ ...p, column: toExperimentalColumn(p) }))
        : data.prs,
    [data.prs, experimental],
  );
  const order = experimental ? EXPERIMENTAL_COLUMN_ORDER : COLUMN_ORDER;
  const visibleColumns = useMemo(
    () => order.filter((c) => !hiddenColumns?.includes(c)),
    [order, hiddenColumns],
  );
  const visibleRepos = useMemo(() => {
    const hidden = new Set(hiddenColumns ?? []);
    const reposWithVisiblePRs = new Set(
      prs.filter((p) => !hidden.has(p.column)).map((p) => p.repo),
    );
    return data.repos.filter((r) => reposWithVisiblePRs.has(r));
  }, [data.repos, prs, hiddenColumns]);
  const buckets = bucketize(prs);
  const columnCounts = useMemo(() => {
    const counts = new Map<ColumnId, number>();
    for (const p of prs) counts.set(p.column, (counts.get(p.column) ?? 0) + 1);
    return counts;
  }, [prs]);
  const { collapsed, toggle, setMany } = useCollapsedRepos();
  const selection = useCardSelection({
    buckets,
    columns: visibleColumns,
    repos: visibleRepos,
    collapsed,
    setCollapsed: setMany,
    enabled: shortcutsEnabled,
    onNotify,
  });

  if (visibleRepos.length === 0) {
    return (
      <>
        {corner && <div className="flex h-10 items-center">{corner}</div>}
        <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-neutral-300 bg-white p-8 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
          {emptyMessage}
        </div>
      </>
    );
  }

  // No overflow on this wrapper: the page's <main> is the only scroll
  // container, so the sticky header row pins to it when scrolling down.
  return (
    <div
      className="grid min-w-[1400px] gap-x-3"
      style={{
        gridTemplateColumns: `220px repeat(${visibleColumns.length}, minmax(220px, 1fr))`,
      }}
    >
      {/* header row: one sticky subgrid so its background also covers the column gaps */}
      <div className="sticky top-0 z-10 col-span-full grid min-h-10 grid-cols-subgrid items-center bg-neutral-50 dark:bg-neutral-950">
        {/* pinned left too, so the controls stay reachable when scrolling sideways */}
        <div className="sticky left-0 z-10 flex h-full items-center bg-neutral-50 dark:bg-neutral-950">
          {corner}
        </div>
        {visibleColumns.map((col) => (
          <div
            key={col}
            className="flex items-baseline gap-1.5 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
          >
            {COLUMN_LABEL[col]}
            {(columnCounts.get(col) ?? 0) > 0 && (
              <span className="font-normal tabular-nums text-neutral-400 dark:text-neutral-500">
                {columnCounts.get(col)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* swimlanes */}
      {visibleRepos.map((repo) => {
        const inner = buckets.get(repo) ?? new Map();
        return (
          <RepoRow
            key={repo}
            repo={repo}
            inner={inner}
            columns={visibleColumns}
            showWaitingFor={showWaitingFor}
            collapsed={collapsed.has(repo)}
            onToggle={() => toggle(repo)}
            selectedId={selection.selectedId}
          />
        );
      })}
    </div>
  );
}

function RepoRow({
  repo,
  inner,
  columns,
  showWaitingFor,
  collapsed,
  onToggle,
  selectedId,
}: {
  repo: string;
  inner: Map<ColumnId, PR[]>;
  columns: ColumnId[];
  showWaitingFor: boolean;
  collapsed: boolean;
  onToggle: () => void;
  selectedId: string | null;
}) {
  const total = columns.reduce((n, col) => n + (inner.get(col)?.length ?? 0), 0);
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        title={collapsed ? `Expand ${repo}` : `Collapse ${repo}`}
        className={clsx(
          "flex items-start gap-1.5 border-t border-neutral-200 px-2 text-left hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900",
          collapsed ? "py-2" : "py-3",
        )}
      >
        <ChevronIcon
          className={clsx(
            "mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition-transform",
            !collapsed && "rotate-90",
          )}
        />
        <span className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {repo}
        </span>
        {collapsed && (
          <span className="ml-auto shrink-0 text-xs tabular-nums text-neutral-400">
            {total}
          </span>
        )}
      </button>
      {columns.map((col) => {
        const items = inner.get(col) ?? [];
        if (collapsed) {
          // Collapsed lanes keep per-column counts so it's still clear where
          // PRs are waiting; clicking anywhere on the row expands it again.
          return (
            <button
              key={col}
              type="button"
              onClick={onToggle}
              tabIndex={-1}
              aria-hidden
              className="flex items-center border-t border-neutral-200 px-3 py-2 text-left text-xs tabular-nums text-neutral-400 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
              {items.length > 0 ? `${items.length} PR${items.length === 1 ? "" : "s"}` : ""}
            </button>
          );
        }
        return (
          <div
            key={col}
            className={clsx(
              "flex flex-col gap-2 border-t border-neutral-200 px-1.5 py-2 dark:border-neutral-800",
            )}
          >
            {items.map((pr) => (
              <PRCard
                key={pr.id}
                pr={pr}
                showWaitingFor={showWaitingFor}
                selected={pr.id === selectedId}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

/**
 * Keyboard selection of a single card. j/k walk the cards top to bottom down
 * each column (across repo rows), then on to the next column; enter or o opens
 * the selected PR, c copies its link. [ and ] collapse or expand the selected
 * card's repo, or every repo when nothing is selected. Esc deselects.
 */
function useCardSelection({
  buckets,
  columns,
  repos,
  collapsed,
  setCollapsed,
  enabled,
  onNotify,
}: {
  buckets: Map<string, Map<ColumnId, PR[]>>;
  columns: ColumnId[];
  repos: string[];
  collapsed: Set<string>;
  setCollapsed: (repos: string[], collapse: boolean) => void;
  enabled: boolean;
  onNotify?: (message: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The selected PR itself, so [ ] and c still work while its repo is collapsed.
  const selectedRef = useRef<PR | null>(null);

  const order = useMemo(() => {
    const cards: PR[] = [];
    for (const col of columns) {
      for (const repo of repos) {
        if (collapsed.has(repo)) continue;
        cards.push(...(buckets.get(repo)?.get(col) ?? []));
      }
    }
    return cards;
  }, [buckets, columns, repos, collapsed]);

  const allPRs = useMemo(
    () =>
      [...buckets.values()].flatMap((inner) => [...inner.values()].flat()),
    [buckets],
  );
  // Drop the selection once its PR is gone (filtered out or no longer open).
  const selected = allPRs.find((p) => p.id === selectedId) ?? null;
  selectedRef.current = selected;

  useEffect(() => {
    if (!selectedId) return;
    document
      .querySelector(`[data-pr-id="${selectedId}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selectedId]);

  const move = (step: 1 | -1) => {
    if (order.length === 0) return;
    const i = order.findIndex((p) => p.id === selectedId);
    const next =
      i === -1
        ? step === 1
          ? 0
          : order.length - 1
        : Math.min(Math.max(i + step, 0), order.length - 1);
    setSelectedId(order[next].id);
  };

  const open = (e: KeyboardEvent) => {
    // A focused link or button already handles Enter natively.
    const el = e.target as HTMLElement | null;
    if (e.key === "Enter" && (el?.tagName === "A" || el?.tagName === "BUTTON")) {
      return false;
    }
    const pr = selectedRef.current;
    if (!pr) return false;
    window.open(pr.url, "_blank", "noopener,noreferrer");
  };

  const copy = () => {
    const pr = selectedRef.current;
    if (!pr) {
      onNotify?.("Select a PR with j/k first");
      return;
    }
    navigator.clipboard.writeText(pr.url).then(
      () => onNotify?.(`Copied link to #${pr.number}`),
      () => onNotify?.("Couldn't copy the link"),
    );
  };

  const collapse = (collapse: boolean) => {
    const pr = selectedRef.current;
    setCollapsed(pr ? [pr.repo] : repos, collapse);
  };

  useHotkeys(
    {
      j: () => move(1),
      k: () => move(-1),
      Enter: open,
      o: open,
      c: copy,
      "[": () => collapse(true),
      "]": () => collapse(false),
      Escape: () => {
        if (!selectedId) return false;
        setSelectedId(null);
      },
    },
    enabled,
  );

  return { selectedId: selected?.id ?? null };
}

export function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
