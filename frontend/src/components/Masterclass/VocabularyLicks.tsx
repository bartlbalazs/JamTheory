import { useState } from 'react';
import type { Lick } from '../../types/masterclass';
import { AlphaTabRenderer } from './AlphaTabRenderer';

interface Props {
  licks: Lick[];
  onRegenerate: () => Promise<void>;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: 'from-emerald-600 to-emerald-800 text-emerald-100 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
  Medium: 'from-amber-600 to-amber-800 text-amber-100 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
  Hard: 'from-rose-600 to-rose-800 text-rose-100 border-rose-500/30 shadow-[0_0_15px_rgba(225,29,72,0.3)]',
};

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
    <section className="surface-card p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-l from-pink-500 to-purple-600"></div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 relative z-10 gap-4">
        <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-lg flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-700 shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center justify-center text-xl">
            🔥
          </span>
          Vocabulary Licks
        </h2>
        
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={busy}
          className="relative inline-flex items-center justify-center px-5 py-2 text-sm font-bold text-white transition-all duration-300 rounded-full bg-[rgb(var(--bg-surface-elevated))] hover:bg-white/10 border border-pink-500/30 hover:border-pink-500/80 shadow-[0_0_15px_rgba(236,72,153,0.1)] hover:shadow-[0_0_25px_rgba(236,72,153,0.4)] disabled:opacity-50 group/btn overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            {busy ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/0000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span className="transform transition-transform group-hover/btn:rotate-180 duration-500">↻</span>
            )}
            {busy ? 'Generating...' : 'Get Fresh Licks'}
          </span>
        </button>
      </div>

      {error ? (
        <div className="p-3 mb-6 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-in fade-in relative z-10 font-medium">
          {error}
        </div>
      ) : null}

      <div className="space-y-8 relative z-10">
        {licks.map((lick, i) => {
          const style = DIFFICULTY_STYLES[lick.difficulty] || DIFFICULTY_STYLES.Medium;
          return (
            <div
              key={`${lick.difficulty}-${i}`}
              className="flex flex-col bg-[rgb(var(--bg-base))] rounded-2xl border border-[color:var(--border-strong)] shadow-inner overflow-hidden transition-all duration-500 hover:border-white/20 hover:shadow-2xl"
            >
              {/* Header Bar */}
              <div className="px-5 py-4 border-b border-[color:var(--border-subtle)] bg-[rgba(255,255,255,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-gradient-to-r ${style} border flex items-center gap-2 max-w-max shrink-0`}>
                  {lick.difficulty === 'Easy' && '🏆'}
                  {lick.difficulty === 'Medium' && '⚡'}
                  {lick.difficulty === 'Hard' && '💀'}
                  {lick.difficulty}
                </div>
                <p className="text-[15px] font-medium text-[rgb(var(--text-primary))] leading-snug drop-shadow-sm flex-grow">
                  "{lick.description}"
                </p>
              </div>
              
              {/* Tab Area */}
              <div className="p-2 sm:p-6 relative bg-[#09090b]">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none"></div>
                <div className="relative z-10 w-full overflow-x-auto custom-scrollbar pb-2">
                  <div className="min-w-[600px] alphatab-container">
                    <AlphaTabRenderer alphatex={lick.alphatex} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-80 h-80 bg-pink-600 rounded-full blur-[150px] opacity-[0.04] pointer-events-none"></div>
    </section>
  );
}
