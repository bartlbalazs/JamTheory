import type { RhythmSection as RhythmSectionData } from '../../types/masterclass';
import { ChordDiagram } from '../Fretboard/ChordDiagram';

/**
 * RhythmSection — chord progression as fretboard diagrams + strumming notes.
 */
export function RhythmSection({
  data,
}: {
  data: RhythmSectionData;
}): JSX.Element {
  return (
    <section className="rounded-lg bg-neutral-900 border border-neutral-800 p-4 space-y-3">
      <h2 className="text-lg font-semibold">Rhythm Section</h2>
      <div className="flex flex-wrap gap-4">
        {data.chords.map((c, i) => (
          <ChordDiagram key={`${c.name}-${i}`} chord={c} />
        ))}
      </div>
      <p className="text-sm text-neutral-300 leading-relaxed">
        {data.strummingAdvice}
      </p>
    </section>
  );
}
