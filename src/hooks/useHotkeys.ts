"use client";

import { useEffect, useRef } from "react";

/** True when a key press belongs to a text field rather than the board. */
export function isTyping(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.isContentEditable ||
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT"
  );
}

/**
 * Single-key board shortcuts, keyed by `KeyboardEvent.key` ("j", "?", "Escape").
 * Ignored while typing in a field and when Cmd/Ctrl/Alt is held, so browser
 * shortcuts keep working. A handler that returns `false` leaves the event alone
 * (no preventDefault), for keys it decided not to act on.
 */
export function useHotkeys(
  handlers: Record<string, (e: KeyboardEvent) => void | false>,
  enabled = true,
) {
  // Read handlers through a ref so callers can pass a fresh object each render
  // without re-subscribing the listener.
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const handler = ref.current[e.key];
      if (handler && handler(e) !== false) e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enabled]);
}
