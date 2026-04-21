import type { TrackInfo } from '../../types/masterclass';

export function VibeTheory({ info }: { info: TrackInfo }): JSX.Element {
  return (
    <section className="surface-card p-6 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))]"></div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h2 className="text-xl font-bold tracking-wide text-white drop-shadow-md">
          Vibe <span className="text-[rgb(var(--brand-primary))]">&amp;</span> Theory
        </h2>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[rgba(var(--brand-primary),0.1)] border border-[rgba(var(--brand-primary),0.2)] text-[rgb(var(--brand-primary))] text-xs font-bold uppercase tracking-wider shadow-inner backdrop-blur-sm">
            Key: {info.key}
          </span>
          <span className="px-3 py-1 rounded-full bg-[rgba(var(--brand-accent),0.1)] border border-[rgba(var(--brand-accent),0.2)] text-[rgb(var(--brand-accent))] text-xs font-bold uppercase tracking-wider shadow-inner backdrop-blur-sm">
            {info.genre}
          </span>
        </div>
      </div>
      
      <div className="relative z-10 bg-[rgba(0,0,0,0.2)] rounded-lg p-5 border border-[color:var(--border-subtle)] shadow-inner">
        <p className="text-[rgb(var(--text-primary))] text-base leading-relaxed font-medium tracking-wide">
          {info.theorySummary}
        </p>
      </div>

      {/* Decorative background element */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[rgb(var(--brand-primary))] rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"></div>
    </section>
  );
}
