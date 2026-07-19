"use client";

import { create } from "zustand";

interface SearchState {
  query: string;
  setQuery: (q: string) => void;
}

/**
 * Backs the header search box. Page-scoped: the dashboard layout clears
 * `query` on every route change, so typing on /units never leaks into
 * /bookings (or any other page) after navigating away.
 */
export const useSearch = create<SearchState>((set) => ({
  query: "",
  setQuery: (q) => set({ query: q }),
}));
