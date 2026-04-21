import type { RhythmSection as RhythmSectionData } from '../../types/masterclass';
import { ChordDiagram } from '../Fretboard/ChordDiagram';

export function RhythmSection({
  data,
}: {
  data: RhythmSectionData;
}): JSX.Element {
  return (
    <section className="surface-card p-6 shadow-xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-5 relative z-10">
        <h2 className="text-xl font-bold tracking-wide text-white drop-shadow-md flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[rgb(var(--brand-primary))] to-indigo-800 shadow-lg flex items-center justify-center text-sm">
            🥁
          </span>
          Rhythm Section
        </h2>
      </div>

      <div className="relative z-10 bg-[rgba(0,0,0,0.2)] rounded-xl p-5 border border-[color:var(--border-subtle)] shadow-inner mb-6">
        <p className="text-[rgb(var(--text-primary))] text-base leading-relaxed tracking-wide">
          {data.strummingAdvice}
        </p>
      </div>

      <div className="relative z-10">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--text-muted))] mb-4 border-b border-[color:var(--border-subtle)] pb-2">
          Chord Progression
        </h3>
        <div className="flex flex-wrap gap-4 md:gap-6 lg:gap-8 items-start">
          {data.chords.map((c, i) => (
            <div key={`${c.name}-${i}`} className="group/chord flex flex-col items-center">
              <div className="bg-[rgb(var(--bg-base))] p-3 rounded-xl border border-[color:var(--border-strong)] shadow-md transition-all duration-300 group-hover/chord:shadow-[0_0_20px_rgba(var(--brand-primary),0.2)] group-hover/chord:border-[rgb(var(--brand-primary))] relative">
                {/* Visual "connector" to the next chord, except for the last one */}
                {i < data.chords.length - 1 && (
                  <div className="hidden sm:block absolute top-1/2 -right-6 lg:-right-8 w-4 lg:w-6 h-[2px] bg-gradient-to-r from-[rgba(var(--brand-primary),0.5)] to-transparent opacity-50 z-[-1]"></div>
                )}
                <ChordDiagram chord={c} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -top-20 -left-20 w-60 h-60 bg-[rgb(var(--brand-primary))] rounded-full blur-[100px] opacity-[0.05] group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"></div>
    </section>
  );
}
