import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  apiErrorMessage,
  fetchMe,
  loadStoredToken,
  loginWithGoogle,
  setStoredToken,
} from '../api/client';
import {
  GoogleCancelledError,
  googleSignOut,
  signInGetIdToken,
} from '../services/googleAuth';
import { loginOneSignal, logoutOneSignal } from '../services/onesignal';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean; // initial session restore
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await loadStoredToken();
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const me = await fetchMe();
        if (!cancelled) {
          setUser(me);
          loginOneSignal(me.id, me.email);
        }
      } catch {
        await setStoredToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    setSigningIn(true);
    try {
      const idToken = await signInGetIdToken();
      const { token, user: u } = await loginWithGoogle(idToken);
      await setStoredToken(token);
      setUser(u);
      loginOneSignal(u.id, u.email);
    } catch (err) {
      if (err instanceof GoogleCancelledError) return; // silent
      setError(apiErrorMessage(err, 'Sign in failed'));
      await setStoredToken(null);
      setUser(null);
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await googleSignOut();
    logoutOneSignal();
    await setStoredToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signingIn, error, signIn, signOut }),
    [user, loading, signingIn, error, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
