/**
 * Auth context — provides Firebase user + Firestore user doc to the app.
 *
 * Exposes:
 *   - `firebaseUser` — raw Firebase Auth user (null when logged out)
 *   - `userDoc`      — the Firestore users/{uid} document (status, skillLevel…)
 *   - `loading`      — true until the first `onAuthStateChanged` fires
 *   - `refreshUserDoc()` — re-read the Firestore user doc (e.g. after admin flips status)
 *
 * Gating is enforced in `App.tsx` and `PendingGate.tsx`, not here.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  loadUserDoc,
  onAuthStateChange,
  type UserDoc,
} from '../../firebase/auth';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  userDoc: UserDoc | null;
  loading: boolean;
  refreshUserDoc: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUserDoc = useCallback(async () => {
    if (!firebaseUser) {
      setUserDoc(null);
      return;
    }
    const d = await loadUserDoc(firebaseUser.uid);
    setUserDoc(d);
  }, [firebaseUser]);

  useEffect(() => {
    const unsub = onAuthStateChange(async (u) => {
      setFirebaseUser(u);
      if (u) {
        const d = await loadUserDoc(u.uid);
        setUserDoc(d);
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthState>(
    () => ({ firebaseUser, userDoc, loading, refreshUserDoc }),
    [firebaseUser, userDoc, loading, refreshUserDoc],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
