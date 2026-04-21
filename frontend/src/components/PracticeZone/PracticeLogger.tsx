import { useState } from 'react';
import { logPracticeSession } from '../../services/practiceLogService';

interface Props {
  uid: string;
  videoId: string | null;
}

/**
 * PracticeLogger — "Log Session" form. Writes to
 * `users/{uid}/practice_logs/{auto}`. Iteration 1 keeps the form minimal:
 * minutes played + optional note. Date defaults to today.
 */
export function PracticeLogger({ uid, videoId }: Props): JSX.Element {
  const [minutes, setMinutes] = useState<number>(15);
  const [notes, setNotes] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!videoId && !busy && Number.isInteger(minutes) && minutes >= 0;

  const handleSubmit = async (): Promise<void> => {
    if (!videoId) return;
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      await logPracticeSession(uid, {
        youtubeVideoId: videoId,
        date: new Date().toISOString().slice(0, 10),
        minutesPlayed: minutes,
        notes: notes.trim() || undefined,
      });
      setFeedback('Session logged.');
      setNotes('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to log session.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-4 space-y-3">
      <h2 className="text-lg font-semibold">Log Session</h2>
      {!videoId ? (
        <p className="text-sm text-neutral-500">
          Start a track first to log a practice session.
        </p>
      ) : null}
      <label className="block text-sm">
        <span className="text-neutral-400">Minutes practiced</span>
        <input
          type="number"
          min={0}
          step={1}
          value={minutes}
          onChange={(e) => setMinutes(parseInt(e.target.value || '0', 10))}
          className="mt-1 w-full rounded bg-neutral-950 border border-neutral-800 px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
        />
      </label>
      <label className="block text-sm">
        <span className="text-neutral-400">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded bg-neutral-950 border border-neutral-800 px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
        />
      </label>
      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-medium text-sm"
      >
        {busy ? 'Saving…' : 'Log session'}
      </button>
      {feedback ? (
        <p className="text-sm text-emerald-400">{feedback}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
