/**
 * SignIn screen — Google sign-in button only.
 * Shown when `firebaseUser === null`.
 */

import { useState } from 'react';
import { signInWithGoogle } from '../../firebase/auth';

export function SignIn(): JSX.Element {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
      <div className="max-w-sm w-full p-8 rounded-lg bg-neutral-900 border border-neutral-800 shadow-xl">
        <h1 className="text-2xl font-semibold mb-2">JamTheory</h1>
        <p className="text-sm text-neutral-400 mb-6">
          The Silent Supervisor — your data-driven guitar coach.
        </p>
        <button
          type="button"
          onClick={handleSignIn}
          disabled={busy}
          className="w-full py-2 px-4 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-medium"
        >
          {busy ? 'Signing in…' : 'Sign in with Google'}
        </button>
        {error ? (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
