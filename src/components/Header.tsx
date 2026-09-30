"use client";

import { signOut, useSession } from "next-auth/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export interface HeaderProps {
  fetchedAt?: string;
  isFetching: boolean;
  onRefresh: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
}

export function Header(props: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-baseline gap-3">
        <h1 className="text-base font-semibold tracking-tight">PR Board</h1>
        {props.fetchedAt && (
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
            updated {timeAgo(props.fetchedAt)}
          </span>
        )}
      </div>
      <HeaderControls {...props} />
    </header>
  );
}

/** Compact title + controls for the board's header row. "Updated" moves into the refresh tooltip. */
export function BoardCorner(props: HeaderProps) {
  return (
    <div className="flex w-full items-center justify-between gap-2 pl-1">
      <h1 className="text-sm font-semibold tracking-tight">PR Board</h1>
      <HeaderControls {...props} />
    </div>
  );
}

export function HeaderControls({
  fetchedAt,
  isFetching,
  onRefresh,
  onOpenHelp,
  onOpenSettings,
}: HeaderProps) {
  const refreshTitle = isFetching
    ? "Refreshing…"
    : fetchedAt
      ? `Refresh (updated ${timeAgo(fetchedAt)})`
      : "Refresh";

  return (
    <div className="flex items-center gap-1">
      <IconButton onClick={onOpenHelp} label="What the board shows">
        <span className="text-xs font-medium">?</span>
      </IconButton>
      <IconButton onClick={onRefresh} label={refreshTitle}>
        <RefreshIcon className={clsx("h-4 w-4", isFetching && "animate-spin")} />
      </IconButton>
      <IconButton onClick={onOpenSettings} label="Settings">
        <GearIcon className="h-4 w-4" />
      </IconButton>
      <UserMenu />
    </div>
  );
}

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
    >
      {children}
    </button>
  );
}

function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = session?.user?.name ?? "Account";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        title={name}
        className="flex h-7 w-7 items-center justify-center rounded-full hover:ring-2 hover:ring-neutral-200 dark:hover:ring-neutral-700"
      >
        {session?.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt={name} className="h-6 w-6 rounded-full" />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[11px] font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[10rem] rounded-md border border-neutral-200 bg-white py-1 text-sm shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <div className="truncate px-3 py-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            {name}
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="block w-full px-3 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6" />
      <path d="M16.5 3.5v3.5H13" />
    </svg>
  );
}

export function GearIcon({ className }: { className?: string }) {
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
        d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        clipRule="evenodd"
      />
    </svg>
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
