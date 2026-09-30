"use client";

import type { BoardData, ColumnId, PR } from "@/lib/types";
import { COLUMN_LABEL, COLUMN_ORDER, EXPERIMENTAL_COLUMN_ORDER } from "@/lib/types";
import { toExperimentalColumn } from "@/lib/kanban";
import { PRCard } from "./PRCard";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";

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

  return { collapsed, toggle };
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
}: {
  data: BoardData;
  hiddenColumns?: ColumnId[];
  showWaitingFor?: boolean;
  experimental?: boolean;
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
  const { collapsed, toggle } = useCollapsedRepos();

  if (visibleRepos.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-neutral-300 bg-white p-8 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
        No pull requests found. Try adjusting orgs in settings.
      </div>
    );
  }

  return (
    <div className="board-scroll overflow-x-auto">
      <div
        className="grid min-w-[1400px] gap-x-3"
        style={{
          gridTemplateColumns: `200px repeat(${visibleColumns.length}, minmax(220px, 1fr))`,
        }}
      >
        {/* header row */}
        <div className="sticky top-0 z-10 bg-neutral-50 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
          Repo
        </div>
        {visibleColumns.map((col) => (
          <div
            key={col}
            className="sticky top-0 z-10 bg-neutral-50 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400"
          >
            {COLUMN_LABEL[col]}
          </div>
        ))}

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
            />
          );
        })}
      </div>
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
}: {
  repo: string;
  inner: Map<ColumnId, PR[]>;
  columns: ColumnId[];
  showWaitingFor: boolean;
  collapsed: boolean;
  onToggle: () => void;
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
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

function ChevronIcon({ className }: { className?: string }) {
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
