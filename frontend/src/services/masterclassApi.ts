/**
 * Masterclass API — wraps the two Cloud Function endpoints using the
 * Firebase Callable wire protocol.
 *
 *   generate-masterclass  →  full track analysis + vocabulary licks
 *   regenerate-licks      →  3 new licks only (same trackInfo)
 *
 * Wire protocol details (must match the backend in `callable_helpers.py`):
 *   Request body : { "data": { ... } }
 *   Success      : { "result": { ... } }
 *   Error        : { "error": { "status": "...", "message": "..." } }
 *
 * The Firebase ID token is sent BOTH as `Authorization: Bearer` (for local
 * dev, no gateway) and inside `data.idToken` (for production, because the
 * API Gateway rewrites the Authorization header with its own service-account
 * JWT when proxying to Cloud Run).
 */

import { getIdToken } from '../firebase/auth';
import { environment } from '../environments/environment';
import type {
  GenerateMasterclassResponse,
  GeneratedMasterclass,
  Lick,
  RegenerateLicksResponse,
  SkillLevel,
} from '../types/masterclass';

export interface GenerateMasterclassInput {
  youtubeVideoId: string;
  skillLevel: SkillLevel;
  /** Optional chord progression (e.g. "Am - Dm - E7"). Required only when
   *  the first call returned `{ needsChords: true }`. */
  userChords?: string;
}

export interface RegenerateLicksInput {
  /** Musical key of the current track, e.g. "A Minor". */
  key: string;
  /** Genre or style of the current track, e.g. "Texas Blues". */
  genre: string;
  skillLevel: SkillLevel;
}

export class MasterclassApiError extends Error {
  constructor(
    public readonly status: string,
    message: string,
  ) {
    super(message);
    this.name = 'MasterclassApiError';
  }
}

export async function generateMasterclass(
  input: GenerateMasterclassInput,
): Promise<GenerateMasterclassResponse> {
  const result = await callCallable<GenerateMasterclassResponse>(
    environment.generateMasterclassUrl,
    input,
  );
  return result;
}

export async function regenerateLicks(
  input: RegenerateLicksInput,
): Promise<Lick[]> {
  const result = await callCallable<RegenerateLicksResponse>(
    environment.regenerateLicksUrl,
    input,
  );
  return result.licks;
}

/** Type guard for the chord-fallback response. */
export function needsChords(
  r: GenerateMasterclassResponse,
): r is { needsChords: true } {
  return (r as { needsChords?: boolean }).needsChords === true;
}

/** Type guard for a full masterclass response. */
export function isMasterclass(
  r: GenerateMasterclassResponse,
): r is GeneratedMasterclass {
  return (r as GeneratedMasterclass).trackInfo !== undefined;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

async function callCallable<T>(
  url: string,
  data: object,
): Promise<T> {
  const idToken = await getIdToken();
  if (!idToken) {
    throw new MasterclassApiError('UNAUTHENTICATED', 'User is not signed in.');
  }

  const payload = { data: { ...data, idToken } };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  const body = (await resp.json()) as {
    result?: T;
    error?: { status: string; message: string };
  };

  if (body.error) {
    throw new MasterclassApiError(body.error.status, body.error.message);
  }
  if (body.result === undefined) {
    throw new MasterclassApiError(
      'INTERNAL',
      'Malformed response (no result or error).',
    );
  }
  return body.result;
}
