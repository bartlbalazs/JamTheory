import { useState } from 'react';
import type { SkillLevel } from '../../types/masterclass';

interface Props {
  url: string;
  onUrlChange: (u: string) => void;
  skillLevel: SkillLevel;
  onSkillLevelChange: (s: SkillLevel) => void;
  onSubmit: () => void | Promise<void>;
  onSubmitWithChords?: (chords: string) => void | Promise<void>;
  needsChords: boolean;
  loading: boolean;
  error: string | null;
}

const SKILLS: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

/**
 * TrackInput — URL field, skill selector, Analyze button, and conditional
 * manual-chords fallback field (shown when backend returns needsChords).
 */
export function TrackInput(props: Props): JSX.Element {
  const [chords, setChords] = useState('');

  return (
    <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-4 space-y-3">
      <h2 className="text-lg font-semibold">Track</h2>
      <label className="block text-sm">
        <span className="text-neutral-400">YouTube URL</span>
        <input
          type="url"
          value={props.url}
          onChange={(e) => props.onUrlChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          className="mt-1 w-full rounded bg-neutral-950 border border-neutral-800 px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
        />
      </label>
      <label className="block text-sm">
        <span className="text-neutral-400">Skill level</span>
        <select
          value={props.skillLevel}
          onChange={(e) => props.onSkillLevelChange(e.target.value as SkillLevel)}
          className="mt-1 w-full rounded bg-neutral-950 border border-neutral-800 px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
        >
          {SKILLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      {props.needsChords && props.onSubmitWithChords ? (
        <label className="block text-sm">
          <span className="text-neutral-400">
            We couldn't find chords in the description — please provide them:
          </span>
          <input
            type="text"
            value={chords}
            onChange={(e) => setChords(e.target.value)}
            placeholder="Am - Dm - E7 - Am"
            className="mt-1 w-full rounded bg-neutral-950 border border-neutral-800 px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
          />
        </label>
      ) : null}
      <button
        type="button"
        disabled={props.loading || !props.url.trim()}
        onClick={() => {
          if (props.needsChords && props.onSubmitWithChords) {
            void props.onSubmitWithChords(chords);
          } else {
            void props.onSubmit();
          }
        }}
        className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-medium text-sm"
      >
        {props.loading ? 'Analyzing…' : 'Analyze track'}
      </button>
      {props.error ? (
        <p className="text-sm text-red-400">{props.error}</p>
      ) : null}
    </div>
  );
}
