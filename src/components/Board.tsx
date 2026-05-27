"use client";

import type { BoardData, ColumnId, PR } from "@/lib/types";
import { COLUMN_LABEL, COLUMN_ORDER, EXPERIMENTAL_COLUMN_ORDER } from "@/lib/types";
import { toExperimentalColumn } from "@/lib/kanban";
import { PRCard } from "./PRCard";
import clsx from "clsx";
import { useMemo } from "react";

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
        className="grid min-w-[1400px] gap-3"
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
}: {
  repo: string;
  inner: Map<ColumnId, PR[]>;
  columns: ColumnId[];
  showWaitingFor: boolean;
}) {
  return (
    <>
      <div className="flex items-start border-t border-neutral-200 px-2 py-3 dark:border-neutral-800">
        <span className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {repo}
        </span>
      </div>
      {columns.map((col) => {
        const items = inner.get(col) ?? [];
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
