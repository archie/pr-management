"use client";

import { useCallback, useEffect, useState } from "react";

/** A short-lived confirmation message, e.g. after copying a link. */
export function useToast() {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const show = useCallback(
    (message: string) => setToast({ id: Date.now(), message }),
    [],
  );

  return { message: toast?.message ?? null, show };
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-14 left-1/2 z-50 -translate-x-1/2 rounded-md bg-neutral-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900"
    >
      {message}
    </div>
  );
}
