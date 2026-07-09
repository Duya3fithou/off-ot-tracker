import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface LoadingApi {
  /** True while any tracked async work is in flight. */
  isLoading: boolean;
  /** Run a promise under the global overlay (counter-based, safe to nest). */
  withLoading: <T>(work: Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingApi | null>(null);

/** Global loading overlay + `useLoading()` API. Wrap the app once in `main.tsx`. */
export function LoadingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const withLoading = useCallback(<T,>(work: Promise<T>): Promise<T> => {
    setCount((c) => c + 1);
    return work.finally(() => setCount((c) => Math.max(0, c - 1)));
  }, []);

  const value = useMemo<LoadingApi>(
    () => ({ isLoading: count > 0, withLoading }),
    [count, withLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <Backdrop open={count > 0} sx={{ color: '#fff', zIndex: (t) => t.zIndex.modal + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingApi {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within <LoadingProvider>');
  return ctx;
}
