"use client";

import { useCallback, useEffect, useState } from "react";

interface AsyncState<T> {
  data?: T;
  loading: boolean;
  error?: unknown;
  reload: () => void;
  setData: (d: T) => void;
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();

  const run = useCallback(() => {
    setLoading(true);
    setError(undefined);
    fn()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);

  return { data, loading, error, reload: run, setData };
}
