import { useState } from 'react';
import type { Lick } from '../../types/masterclass';
import { AlphaTabRenderer } from './AlphaTabRenderer';

/**
 * VocabularyLicks — always exactly 3 licks (Easy / Medium / Hard).
 * The "Show me new licks" button is wired up in App.tsx via `onRegenerate`.
 */
interface Props {
  licks: Lick[];
  onRegenerate: () => Promise<void>;
}

export function VocabularyLicks({ licks, onRegenerate }: Props): JSX.Element {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await onRegenerate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regeneration failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg bg-neutral-900 border border-neutral-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Vocabulary Licks</h2>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={busy}
          className="text-xs py-1 px-3 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? 'Generating…' : 'Show me new licks'}
        </button>
      </div>
      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : null}
      <div className="space-y-4">
        {licks.map((lick, i) => (
          <div
            key={`${lick.difficulty}-${i}`}
            className="rounded border border-neutral-800 p-3 space-y-2"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-xs uppercase tracking-wide text-indigo-300">
                {lick.difficulty}
              </span>
              <span className="text-sm text-neutral-300">{lick.description}</span>
            </div>
            <AlphaTabRenderer alphatex={lick.alphatex} />
          </div>
        ))}
      </div>
    </section>
  );
}
