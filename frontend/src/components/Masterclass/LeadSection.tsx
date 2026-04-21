import type { LeadSection as LeadSectionData } from '../../types/masterclass';
import { ScaleDiagram } from '../Fretboard/ScaleDiagram';

export function LeadSection({
  data,
}: {
  data: LeadSectionData;
}): JSX.Element {
  return (
    <section className="surface-card p-6 shadow-xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-xl font-bold tracking-wide text-white drop-shadow-md flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 shadow-lg flex items-center justify-center text-sm">
            🎸
          </span>
          Lead Section
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {/* Scale Focus */}
        <div className="flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--text-muted))] mb-4 border-b border-[color:var(--border-subtle)] pb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
            Primary Scale Focus
          </h3>
          <div className="bg-[rgb(var(--bg-base))] border border-[color:var(--border-strong)] rounded-xl p-4 shadow-inner flex flex-col items-center justify-center flex-grow group/scale transition-all duration-300 hover:border-orange-500/50">
            <ScaleDiagram
              rootFret={data.primaryScale.rootFret}
              scaleName={data.primaryScale.name}
            />
            <p className="mt-3 text-sm font-medium text-orange-200 bg-orange-900/30 px-3 py-1 rounded-full border border-orange-500/20">
              {data.primaryScale.name} @ {data.primaryScale.rootFret}fr
            </p>
          </div>
        </div>

        {/* Target Notes */}
        <div className="flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--text-muted))] mb-4 border-b border-[color:var(--border-subtle)] pb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            Voice Leading Targets
          </h3>
          <ul className="space-y-3 flex-grow">
            {data.targetNotes.map((t, i) => (
              <li 
                key={`${t.chord}-${i}`} 
                className="bg-[rgba(0,0,0,0.2)] border border-[color:var(--border-strong)] rounded-lg p-3 flex flex-col gap-2 transition-all duration-300 hover:bg-white/5 hover:border-white/20 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-orange-400 bg-orange-950/50 px-2 py-0.5 rounded border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                    {t.chord}
                  </span>
                  <span className="text-[rgb(var(--text-muted))]">→</span>
                  <span className="font-bold text-red-400 text-lg drop-shadow-md">
                    {t.note}
                  </span>
                </div>
                <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
                  {t.advice}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600 rounded-full blur-[120px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none"></div>
    </section>
  );
}
