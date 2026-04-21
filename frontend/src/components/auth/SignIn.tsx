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
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary))] relative overflow-hidden font-sans">
      {/* Background Ornaments */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[rgb(var(--brand-primary))] rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[rgb(var(--brand-accent))] rounded-full mix-blend-screen filter blur-[150px] opacity-10"></div>
      
      <div className="w-full max-w-md p-8 sm:p-12 surface-card border-[color:var(--border-strong)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 mx-4">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))] shadow-[0_0_30px_rgba(var(--brand-primary),0.5)] flex items-center justify-center mb-6 text-3xl font-bold tracking-tighter text-white">
            JT
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Jam<span className="text-[rgb(var(--brand-primary))]">Theory</span>
          </h1>
          <p className="text-base text-[rgb(var(--text-secondary))] font-medium tracking-wide">
            The Silent Supervisor — your data-driven AI guitar coach.
          </p>
        </div>
        
        <button
          type="button"
          onClick={handleSignIn}
          disabled={busy}
          className="w-full relative inline-flex items-center justify-center px-6 py-3.5 text-base font-bold text-white transition-all duration-300 rounded-xl bg-white/10 hover:bg-white/20 border border-[color:var(--border-strong)] shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 group overflow-hidden"
        >
          {busy ? (
            <span className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-[rgb(var(--brand-primary))]" xmlns="http://www.w3.org/0000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            <span className="flex items-center gap-3 relative z-10">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.01 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000"></div>
        </button>

        {error ? (
          <div className="mt-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center animate-in slide-in-from-bottom-2">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
