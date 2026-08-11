"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { api } from "@/lib/api/client";

interface NotificationsState {
  /** Unread badge count — header bell + sidebar. */
  unread: number;
  /** Local truth after a read/read-all (or a full feed load); wins over in-flight polls. */
  setUnread: (n: number) => void;
  /** GET /notifications/unread-count. Never throws — a badge must not break the shell. */
  refresh: () => Promise<void>;
}

/**
 * A poll that started before a local read/read-all would otherwise land after it
 * and resurrect the old count. Anything older than the last local mutation is
 * discarded.
 */
let lastMutationAt = 0;

export const useNotifications = create<NotificationsState>((set) => ({
  unread: 0,
  setUnread: (n) => {
    lastMutationAt = Date.now();
    set({ unread: n });
  },
  refresh: async () => {
    const startedAt = Date.now();
    try {
      const count = await api.getUnreadCount();
      if (startedAt >= lastMutationAt) set({ unread: count });
    } catch {
      // Offline / expired session — keep the last known count. The 401 bounce
      // to /login is handled inside the api client.
    }
  },
}));

/** §8 — "cheap endpoint, polled". A new booking lands on the bell within a minute. */
const POLL_MS = 60_000;

/**
 * Drives the badge for the whole dashboard shell. Call once (the dashboard
 * layout) — the header and sidebar just read `unread`. Polling pauses on a
 * hidden tab and catches up the moment it becomes visible again.
 */
export function useUnreadCountPolling(): void {
  useEffect(() => {
    const { refresh } = useNotifications.getState();
    refresh();

    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, POLL_MS);

    function onVisibilityChange() {
      if (!document.hidden) refresh();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
}
