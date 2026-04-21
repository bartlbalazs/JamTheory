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
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
      <div className="max-w-md w-full p-8 rounded-lg bg-neutral-900 border border-neutral-800 shadow-xl space-y-4">
        <h1 className="text-2xl font-semibold">You're on the list</h1>
        <p className="text-neutral-400">
          Thanks for signing in{userDoc?.displayName ? `, ${userDoc.displayName}` : ''}.
          Your account is pending approval.
        </p>
        <p className="text-sm text-neutral-500">
          An admin will flip your status to <code>active</code> shortly.
          Once they do, hit <em>Check again</em> below.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refreshUserDoc}
            className="py-2 px-4 rounded bg-indigo-600 hover:bg-indigo-500 font-medium"
          >
            Check again
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="py-2 px-4 rounded bg-neutral-800 hover:bg-neutral-700 font-medium"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
