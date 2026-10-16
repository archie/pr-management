"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import clsx from "clsx";
import { Board } from "@/components/Board";
import { BoardCorner, Header, type HeaderProps } from "@/components/Header";
import { HelpModal } from "@/components/HelpModal";
import { FilterPill, SearchModal, useBoardSearch } from "@/components/SearchModal";
import { Toast, useToast } from "@/components/Toast";
import { useHotkeys } from "@/hooks/useHotkeys";
import { SettingsModal } from "@/components/SettingsModal";
import { ThemeApplier } from "@/components/ThemeApplier";
import { useSettings } from "@/hooks/useSettings";
import type { BoardData } from "@/lib/types";

export default function Page() {
  const { status } = useSession();
  const { settings, update, hydrated } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const orgs = settings.orgs.join(",");

  const query = useQuery<BoardData>({
    queryKey: ["board", orgs],
    queryFn: async () => {
      const res = await fetch(`/api/prs?orgs=${encodeURIComponent(orgs)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      return res.json();
    },
    enabled: hydrated && status === "authenticated",
    refetchInterval: 60_000,
  });

  const search = useBoardSearch(query.data?.prs ?? [], helpOpen || settingsOpen);

  const toast = useToast();
  const anyModalOpen = helpOpen || settingsOpen || search.open;
  useHotkeys(
    {
      r: () => {
        void query.refetch();
      },
      "?": () => setHelpOpen(true),
      d: () => {
        const showDone = !settings.showDone;
        update({ ...settings, showDone });
        toast.show(showDone ? "Showing Done" : "Hiding Done");
      },
    },
    !anyModalOpen,
  );

  const headerProps: HeaderProps = {
    fetchedAt: query.data?.fetchedAt,
    isFetching: query.isFetching,
    onRefresh: () => query.refetch(),
    onOpenSearch: search.openSearch,
    filterLabel: search.isFiltering ? search.label : undefined,
    onOpenHelp: () => setHelpOpen(true),
    onOpenSettings: () => setSettingsOpen(true),
  };

  const showBoard = !query.isError && !!query.data;

  if (status === "loading") {
    return <CenteredMessage>Loading…</CenteredMessage>;
  }

  if (status === "unauthenticated") {
    return null; // middleware will redirect to /signin
  }

  return (
    <div className="flex h-screen flex-col">
      <ThemeApplier theme={settings.theme} />
      {/* Once the board renders, the title and controls live in its header row instead. */}
      {!showBoard && <Header {...headerProps} />}
      <main
        className={clsx(
          "board-scroll flex-1 overflow-auto px-3 pb-3",
          !showBoard && "pt-3",
        )}
      >
        {query.isError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            Failed to load PRs: {(query.error as Error).message}
          </div>
        ) : query.data ? (
          <Board
            data={{ ...query.data, prs: search.filteredPRs }}
            emptyMessage={
              search.isFiltering
                ? `No pull requests match ${search.label}.`
                : undefined
            }
            hiddenColumns={settings.showDone ? [] : ["done"]}
            showWaitingFor={settings.showWaitingFor}
            shortcutsEnabled={!anyModalOpen}
            onNotify={toast.show}
            experimental={!settings.classicBoard}
            corner={<BoardCorner {...headerProps} />}
          />
        ) : (
          <CenteredMessage>Loading pull requests…</CenteredMessage>
        )}
      </main>
      <SearchModal
        open={search.open}
        onClose={search.closeSearch}
        query={search.query}
        onQueryChange={search.setQuery}
        prs={search.scopedPRs}
        experimental={!settings.classicBoard}
      />
      {search.isFiltering && !search.open && (
        <FilterPill
          query={search.query}
          reviewOnly={search.reviewOnly}
          count={search.filteredPRs.length}
          onEdit={search.openSearch}
          onClear={search.clear}
        />
      )}
      <Toast message={toast.message} />
      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        experimental={!settings.classicBoard}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={update}
      />
    </div>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-neutral-500">
      {children}
    </div>
  );
}
