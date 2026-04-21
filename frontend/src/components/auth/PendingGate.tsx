/**
 * PendingGate — shown when a signed-in user has status === 'pending'.
 *
 * The spec requires an admin to activate a user manually in the Firebase
 * console (flipping `users/{uid}.status` to 'active'). This screen makes
 * that waiting state explicit.
 */

import { useAuth } from './AuthProvider';
import { signOut } from '../../firebase/auth';

export function PendingGate(): JSX.Element {
  const { userDoc, refreshUserDoc } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary))] relative overflow-hidden font-sans">
      {/* Background Ornaments */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[rgb(var(--brand-accent))] rounded-full mix-blend-screen filter blur-[200px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md p-8 sm:p-12 surface-card border-[color:var(--border-strong)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 mx-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[rgb(var(--bg-surface-elevated))] border border-[color:var(--border-strong)] shadow-inner flex items-center justify-center mb-6 text-3xl text-[rgb(var(--brand-accent))] animate-pulse-subtle">
          ⏳
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4 text-white drop-shadow-md">
          You're on the list
        </h1>
        
        <p className="text-[15px] text-[rgb(var(--text-secondary))] leading-relaxed mb-6">
          Thanks for signing in{userDoc?.displayName ? `, ${userDoc.displayName.split(' ')[0]}` : ''}.
          Your account is currently <span className="font-bold text-[rgb(var(--brand-accent))] px-2 py-0.5 rounded bg-[rgba(var(--brand-accent),0.1)] border border-[rgba(var(--brand-accent),0.2)]">pending</span> approval.
        </p>
        
        <div className="p-4 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[color:var(--border-subtle)] mb-8 shadow-inner">
          <p className="text-sm text-[rgb(var(--text-muted))] leading-relaxed">
            An admin will activate your account shortly.
            Check back soon or hit the button below to see if you're in.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={refreshUserDoc}
            className="flex-1 btn-primary group overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="transform transition-transform group-hover:rotate-180 duration-500">↻</span>
              Check Status
            </span>
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex-1 btn-secondary"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
