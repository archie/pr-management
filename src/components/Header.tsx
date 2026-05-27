"use client";

import { signOut, useSession } from "next-auth/react";

export function Header({
  fetchedAt,
  isFetching,
  onRefresh,
  onOpenHelp,
  onOpenSettings,
}: {
  fetchedAt?: string;
  isFetching: boolean;
  onRefresh: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
}) {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-baseline gap-3">
        <h1 className="text-base font-semibold tracking-tight">PR Board</h1>
        {fetchedAt && (
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
            updated {timeAgo(fetchedAt)}
          </span>
        )}
        {isFetching && (
          <span className="text-[11px] text-neutral-400">refreshing…</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenHelp}
          aria-label="Help"
          title="What the board shows"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-300 bg-white text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
        >
          ?
        </button>
        <button
          onClick={onRefresh}
          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
        >
          Refresh
        </button>
        <button
          onClick={onOpenSettings}
          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
        >
          Settings
        </button>
        {session?.user?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt={session.user.name ?? "user"}
            className="h-6 w-6 rounded-full"
          />
        )}
        <button
          onClick={() => signOut()}
          className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}
