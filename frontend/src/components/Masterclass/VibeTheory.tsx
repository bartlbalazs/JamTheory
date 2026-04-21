import type { TrackInfo } from '../../types/masterclass';

/**
 * VibeTheory — top-of-masterclass summary: key, genre, theory context.
 */
export function VibeTheory({ info }: { info: TrackInfo }): JSX.Element {
  return (
    <section className="rounded-lg bg-neutral-900 border border-neutral-800 p-4 space-y-2">
      <h2 className="text-lg font-semibold">Vibe &amp; Theory</h2>
      <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
        <dt className="text-neutral-400">Key</dt>
        <dd>{info.key}</dd>
        <dt className="text-neutral-400">Genre</dt>
        <dd>{info.genre}</dd>
      </dl>
      <p className="text-sm text-neutral-300 leading-relaxed">
        {info.theorySummary}
      </p>
    </section>
  );
}
