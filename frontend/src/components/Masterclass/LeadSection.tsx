import type { LeadSection as LeadSectionData } from '../../types/masterclass';
import { ScaleDiagram } from '../Fretboard/ScaleDiagram';

/**
 * LeadSection — primary scale box + per-chord target notes.
 * Vocabulary licks live in a sibling component.
 */
export function LeadSection({
  data,
}: {
  data: LeadSectionData;
}): JSX.Element {
  return (
    <section className="rounded-lg bg-neutral-900 border border-neutral-800 p-4 space-y-3">
      <h2 className="text-lg font-semibold">Lead Section</h2>
      <div>
        <p className="text-sm text-neutral-400 mb-1">
          Primary scale: {data.primaryScale.name} (root fret{' '}
          {data.primaryScale.rootFret})
        </p>
        <ScaleDiagram
          rootFret={data.primaryScale.rootFret}
          scaleName={data.primaryScale.name}
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-neutral-300 mb-1">
          Target notes by chord
        </h3>
        <ul className="space-y-1 text-sm">
          {data.targetNotes.map((t, i) => (
            <li key={`${t.chord}-${i}`}>
              <span className="font-mono text-indigo-300">{t.chord}</span>
              {' → '}
              <span className="font-medium">{t.note}</span>
              <span className="text-neutral-400"> — {t.advice}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
