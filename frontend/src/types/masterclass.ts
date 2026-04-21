/**
 * TypeScript types for the masterclass payload.
 *
 * MUST stay in sync with:
 *   - shared/schemas/masterclass.schema.json
 *   - backend/models/masterclass.py
 *   - docs/DATA_MODEL.md
 */

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface TrackInfo {
  key: string;
  genre: string;
  theorySummary: string;
}

export interface Chord {
  name: string;
  /** Low-to-high 6-character fret string. 'x' = muted. Example: 'x02210'. */
  frets: string;
}

export interface RhythmSection {
  chords: Chord[];
  strummingAdvice: string;
}

export interface PrimaryScale {
  name: string;
  rootFret: number;
}

export interface TargetNote {
  chord: string;
  note: string;
  advice: string;
}

export interface Lick {
  difficulty: Difficulty;
  description: string;
  /** Strict AlphaTex — no ASCII tabs. */
  alphatex: string;
}

export interface LeadSection {
  primaryScale: PrimaryScale;
  targetNotes: TargetNote[];
  /** Always exactly 3 entries: Easy, Medium, Hard. */
  vocabularyLicks: Lick[];
}

export interface Masterclass {
  trackInfo: TrackInfo;
  rhythmSection: RhythmSection;
  leadSection: LeadSection;
}

/** Masterclass payload plus YouTube metadata echoed back by the backend.
 *  The frontend uses `title`/`description` for the cache-write to
 *  `backing_tracks/{videoId}`. They are present only on the response of
 *  /generate-masterclass — the cached masterclass document itself does
 *  NOT include them. */
export interface GeneratedMasterclass extends Masterclass {
  title: string;
  description: string;
}

/** Backend response when the description has no chords and none were supplied. */
export interface NeedsChordsResponse {
  needsChords: true;
}

export type GenerateMasterclassResponse = GeneratedMasterclass | NeedsChordsResponse;

export interface RegenerateLicksResponse {
  licks: Lick[];
}
