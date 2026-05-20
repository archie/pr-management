"use client";

import type { BoardData, ColumnId, PR } from "@/lib/types";
import { COLUMN_LABEL, COLUMN_ORDER } from "@/lib/types";
import { PRCard } from "./PRCard";
import clsx from "clsx";

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

export function Board({ data }: { data: BoardData }) {
  const buckets = bucketize(data.prs);
  const repos = data.repos;

  if (repos.length === 0) {
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
          gridTemplateColumns: `200px repeat(${COLUMN_ORDER.length}, minmax(220px, 1fr))`,
        }}
      >
        {/* header row */}
        <div className="sticky top-0 z-10 bg-neutral-50 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
          Repo
        </div>
        {COLUMN_ORDER.map((col) => (
          <div
            key={col}
            className="sticky top-0 z-10 bg-neutral-50 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400"
          >
            {COLUMN_LABEL[col]}
          </div>
        ))}

        {/* swimlanes */}
        {repos.map((repo) => {
          const inner = buckets.get(repo) ?? new Map();
          return (
            <RepoRow key={repo} repo={repo} inner={inner} />
          );
        })}
      </div>
    </div>
  );
}

function RepoRow({
  repo,
  inner,
}: {
  repo: string;
  inner: Map<ColumnId, PR[]>;
}) {
  return (
    <>
      <div className="flex items-start border-t border-neutral-200 px-2 py-3 dark:border-neutral-800">
        <span className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {repo}
        </span>
      </div>
      {COLUMN_ORDER.map((col) => {
        const items = inner.get(col) ?? [];
        return (
          <div
            key={col}
            className={clsx(
              "flex flex-col gap-2 border-t border-neutral-200 px-1.5 py-2 dark:border-neutral-800",
            )}
          >
            {items.map((pr) => (
              <PRCard key={pr.id} pr={pr} />
            ))}
          </div>
        );
      })}
    </>
  );
}
