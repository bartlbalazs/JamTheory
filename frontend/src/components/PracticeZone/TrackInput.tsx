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

export function TrackInput(props: Props): JSX.Element {
  const [chords, setChords] = useState('');

  return (
    <div className="surface-card p-5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-wide">Track Setup</h2>
        <div className="w-8 h-8 rounded-full bg-[rgb(var(--bg-surface-elevated))] flex items-center justify-center text-[rgb(var(--brand-primary))] shadow-inner">
           ▶
        </div>
      </div>
      
      <div className="space-y-4">
        <label className="block text-sm">
          <span className="text-[rgb(var(--text-secondary))] font-medium mb-1.5 block">YouTube URL</span>
          <input
            type="url"
            value={props.url}
            onChange={(e) => props.onUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            className="input-modern"
            disabled={props.loading}
          />
        </label>
        
        <label className="block text-sm">
          <span className="text-[rgb(var(--text-secondary))] font-medium mb-1.5 block">Target Skill Level</span>
          <select
            value={props.skillLevel}
            onChange={(e) => props.onSkillLevelChange(e.target.value as SkillLevel)}
            className="input-modern appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%23A3A3A3%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_0.5rem_center] bg-no-repeat pr-8"
            disabled={props.loading}
          >
            {SKILLS.map((s) => (
              <option key={s} value={s} className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">
                {s}
              </option>
            ))}
          </select>
        </label>

        {props.needsChords && props.onSubmitWithChords ? (
          <div className="p-4 rounded-lg bg-[rgba(var(--brand-accent),0.1)] border border-[rgba(var(--brand-accent),0.2)] animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-sm">
              <span className="text-[rgb(var(--brand-accent))] font-medium mb-1.5 block flex items-center gap-2">
                <span>⚠️</span> No chords found. Please provide them:
              </span>
              <input
                type="text"
                value={chords}
                onChange={(e) => setChords(e.target.value)}
                placeholder="e.g. Am - Dm - E7"
                className="input-modern border-[rgba(var(--brand-accent),0.3)] focus:border-[rgb(var(--brand-accent))] focus:ring-[rgb(var(--brand-accent))]"
                disabled={props.loading}
              />
            </label>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        disabled={props.loading || !props.url.trim() || (props.needsChords && !chords.trim())}
        onClick={() => {
          if (props.needsChords && props.onSubmitWithChords) {
            void props.onSubmitWithChords(chords);
          } else {
            void props.onSubmit();
          }
        }}
        className="btn-primary w-full mt-2 group"
      >
        {props.loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/0000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing Track...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Analyze Track 
            <span className="transform transition-transform group-hover:translate-x-1">→</span>
          </span>
        )}
      </button>

      {props.error ? (
        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in">
          {props.error}
        </div>
      ) : null}
    </div>
  );
}
