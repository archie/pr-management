"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Board } from "@/components/Board";
import { Header } from "@/components/Header";
import { SettingsModal } from "@/components/SettingsModal";
import { ThemeApplier } from "@/components/ThemeApplier";
import { useSettings } from "@/hooks/useSettings";
import type { BoardData } from "@/lib/types";

export default function Page() {
  const { status } = useSession();
  const { settings, update, hydrated } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  if (status === "loading") {
    return <CenteredMessage>Loading…</CenteredMessage>;
  }

  if (status === "unauthenticated") {
    return null; // middleware will redirect to /signin
  }

  return (
    <div className="flex h-screen flex-col">
      <ThemeApplier theme={settings.theme} />
      <Header
        fetchedAt={query.data?.fetchedAt}
        isFetching={query.isFetching}
        onRefresh={() => query.refetch()}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <main className="flex-1 overflow-auto p-3">
        {query.isError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            Failed to load PRs: {(query.error as Error).message}
          </div>
        ) : query.data ? (
          <Board
            data={query.data}
            hiddenColumns={settings.showDone ? [] : ["done"]}
            showWaitingFor={settings.showWaitingFor}
            experimental={settings.experimentalBoard}
          />
        ) : (
          <CenteredMessage>Loading pull requests…</CenteredMessage>
        )}
      </main>
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
