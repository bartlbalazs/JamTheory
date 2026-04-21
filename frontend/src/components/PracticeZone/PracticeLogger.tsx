import { useState } from 'react';
import { logPracticeSession } from '../../services/practiceLogService';

interface Props {
  uid: string;
  videoId: string | null;
}

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
      setFeedback('Practice session logged!');
      setNotes('');
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to log session.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="surface-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-wide">Log Session</h2>
        <div className="w-8 h-8 rounded-full bg-[rgb(var(--bg-surface-elevated))] flex items-center justify-center text-[rgb(var(--brand-accent))] shadow-inner">
           ✓
        </div>
      </div>
      
      {!videoId ? (
        <div className="text-sm text-[rgb(var(--text-muted))] bg-[rgba(0,0,0,0.2)] p-3 rounded-lg border border-[color:var(--border-subtle)] text-center">
          Start a track above to log your practice time.
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in">
          <label className="block text-sm">
            <span className="text-[rgb(var(--text-secondary))] font-medium mb-1.5 block">Minutes Practiced</span>
            <div className="flex items-center">
              <input
                type="number"
                min={0}
                step={1}
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value || '0', 10))}
                className="input-modern w-24 text-center font-mono font-bold text-lg"
              />
              <span className="ml-3 text-[rgb(var(--text-muted))]">mins</span>
            </div>
          </label>
          
          <label className="block text-sm">
            <span className="text-[rgb(var(--text-secondary))] font-medium mb-1.5 block">Notes <span className="text-[rgb(var(--text-muted))] font-normal">(Optional)</span></span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="What did you focus on? (e.g. nailing the tricky bend in the Medium lick)"
              className="input-modern resize-none custom-scrollbar"
            />
          </label>
          
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="w-full relative inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 rounded-lg bg-[rgb(var(--brand-accent))] hover:bg-emerald-400 shadow-[0_0_15px_rgba(var(--brand-accent),0.2)] hover:shadow-[0_0_25px_rgba(var(--brand-accent),0.4)] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {busy ? 'Saving...' : 'Log Practice Time'}
          </button>
          
          {feedback ? (
            <div className="p-2 text-center text-[rgb(var(--brand-accent))] text-sm font-medium bg-[rgba(var(--brand-accent),0.1)] rounded border border-[rgba(var(--brand-accent),0.2)] animate-in zoom-in-95">
              {feedback}
            </div>
          ) : null}
          {error ? (
            <div className="p-2 text-center text-red-400 text-sm bg-red-400/10 rounded border border-red-400/20">
              {error}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
