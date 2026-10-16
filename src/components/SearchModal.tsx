"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toExperimentalColumn } from "@/lib/kanban";
import { highlightSegments, matchesSearch, searchTerms } from "@/lib/search";
import {
  COLUMN_LABEL,
  COLUMN_ORDER,
  EXPERIMENTAL_COLUMN_ORDER,
  type PR,
} from "@/lib/types";
import { ChecksDot, ReviewBadge } from "./PRCard";

function isTyping(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.isContentEditable ||
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT"
  );
}

/**
 * The board's search filter. The query is shared by the modal and the board:
 * typing in the modal filters the board live, and the filter stays applied
 * after the modal closes until it's cleared.
 *
 * Keys: "/" opens the modal. Esc closes the modal, or, with the modal closed,
 * clears the filter. `otherModalOpen` keeps both keys out of the way while the
 * Help or Settings modal is up.
 */
export function useBoardSearch(prs: PR[], otherModalOpen: boolean) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const terms = useMemo(() => searchTerms(query), [query]);
  const filteredPRs = useMemo(
    () => (terms.length ? prs.filter((p) => matchesSearch(p, terms)) : prs),
    [prs, terms],
  );

  useEffect(() => {
    if (otherModalOpen || open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (e.key === "/") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape" && query) {
        setQuery("");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [otherModalOpen, open, query]);

  return {
    query,
    setQuery,
    open,
    openSearch: useCallback(() => setOpen(true), []),
    closeSearch: useCallback(() => setOpen(false), []),
    clear: useCallback(() => setQuery(""), []),
    /** All PRs when the query is empty, otherwise the matching ones. */
    filteredPRs,
    isFiltering: terms.length > 0,
  };
}

export function SearchModal({
  open,
  onClose,
  query,
  onQueryChange,
  prs,
  experimental,
}: {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  prs: PR[];
  experimental: boolean;
}) {
  if (!open) return null;
  // Mounted fresh on every open, so the selection starts unset.
  return (
    <SearchPanel
      onClose={onClose}
      query={query}
      onQueryChange={onQueryChange}
      prs={prs}
      experimental={experimental}
    />
  );
}

function SearchPanel({
  onClose,
  query,
  onQueryChange,
  prs,
  experimental,
}: {
  onClose: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  prs: PR[];
  experimental: boolean;
}) {
  // -1 means no result is selected: Enter then just closes with the filter applied.
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => inputRef.current?.select(), []);

  const terms = useMemo(() => searchTerms(query), [query]);
  const results = useMemo(() => {
    const order = experimental ? EXPERIMENTAL_COLUMN_ORDER : COLUMN_ORDER;
    return prs
      .map((p) =>
        experimental ? { ...p, column: toExperimentalColumn(p) } : p,
      )
      .filter((p) => matchesSearch(p, terms))
      .sort(
        (a, b) =>
          order.indexOf(a.column) - order.indexOf(b.column) ||
          b.updatedAt.localeCompare(a.updatedAt),
      );
  }, [prs, terms, experimental]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pr = results[active];
      if (pr) window.open(pr.url, "_blank", "noopener,noreferrer");
      else onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 p-4 pt-[12vh]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Search pull requests"
        className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-neutral-200 px-3 dark:border-neutral-800">
          <SearchIcon className="h-4 w-4 shrink-0 text-neutral-400" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => {
              onQueryChange(e.target.value);
              setActive(-1);
            }}
            placeholder="Filter by title, #number, branch or person"
            aria-label="Search pull requests"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
          <kbd className="shrink-0 rounded border border-neutral-200 px-1.5 text-[10px] text-neutral-400 dark:border-neutral-700">
            esc
          </kbd>
        </div>
        {terms.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Type a name like <span className="font-medium">leslie</span> to find
            PRs they opened or are reviewing.
          </p>
        ) : results.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No pull requests match &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          <ul ref={listRef} className="overflow-y-auto py-1">
            {results.map((pr, i) => (
              <li key={pr.id} data-index={i}>
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseMove={() => setActive(i)}
                  className={clsx(
                    "block px-4 py-2",
                    i === active && "bg-neutral-100 dark:bg-neutral-800",
                  )}
                >
                  <ResultRow pr={pr} terms={terms} />
                </a>
              </li>
            ))}
          </ul>
        )}
        {results.length > 0 && (
          <div className="border-t border-neutral-200 px-4 py-1.5 text-[11px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            {results.length} {results.length === 1 ? "match" : "matches"} ·{" "}
            {active === -1
              ? "enter to filter the board · ↓ to pick a PR"
              : "enter to open this PR · ↑ back to the filter"}
          </div>
        )}
      </div>
    </div>
  );
}

/** Floating reminder that the board is filtered, with a way back into the search. */
export function FilterPill({
  query,
  count,
  onEdit,
  onClear,
}: {
  query: string;
  count: number;
  onEdit: () => void;
  onClear: () => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-neutral-200 bg-white py-1 pl-3 pr-1 text-xs shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
      >
        <SearchIcon className="h-3.5 w-3.5" />
        <span>
          {count} {count === 1 ? "PR matches" : "PRs match"}{" "}
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            &ldquo;{query.trim()}&rdquo;
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear filter"
        title="Clear filter (esc)"
        className="flex h-6 items-center gap-1 rounded-full px-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      >
        <kbd className="text-[10px]">esc</kbd>
        <span aria-hidden>×</span>
      </button>
    </div>
  );
}

function ResultRow({ pr, terms }: { pr: PR; terms: string[] }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 break-words text-sm font-medium leading-snug text-neutral-900 dark:text-neutral-100">
          <Highlight text={pr.title} terms={terms} />
        </span>
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
          {COLUMN_LABEL[pr.column]}
        </span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
        <span>
          <Highlight text={pr.repo} terms={terms} />
        </span>
        <span className="text-neutral-300 dark:text-neutral-600">·</span>
        <span className="font-mono">
          <Highlight text={`#${pr.number}`} terms={terms} />
        </span>
        <span className="text-neutral-300 dark:text-neutral-600">·</span>
        <span className="break-all font-mono">
          <Highlight text={pr.headRefName} terms={terms} />
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
        {pr.author && (
          <span>
            by{" "}
            <span className="text-neutral-700 dark:text-neutral-200">
              <Highlight text={`@${pr.author.login}`} terms={terms} />
            </span>
          </span>
        )}
        {pr.requestedReviewers.length > 0 && (
          <span>
            waiting on{" "}
            <span className="text-neutral-700 dark:text-neutral-200">
              <Highlight
                text={pr.requestedReviewers.join(", ")}
                terms={terms}
              />
            </span>
          </span>
        )}
        <ReviewBadge decision={pr.reviewDecision} />
        <ChecksDot state={pr.checksState} />
      </div>
    </div>
  );
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {highlightSegments(text, terms).map((s, i) =>
        s.match ? (
          <mark
            key={i}
            className="rounded-sm bg-amber-200/70 text-inherit dark:bg-amber-500/30"
          >
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.5 13.5 3 3" />
    </svg>
  );
}
