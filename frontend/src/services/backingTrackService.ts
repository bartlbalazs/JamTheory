/**
 * Backing-track cache service — Firestore reads/writes for
 * `backing_tracks/{videoId}` and its `variants/{skillLevel}` subcollection.
 *
 * The app flow is:
 *   1. User pastes a YouTube URL.
 *   2. Frontend checks the cache for this (videoId, skillLevel) pair.
 *   3. On miss, the frontend calls the backend, then writes the result here
 *      so the next user gets an instant hit.
 *
 * Firestore security rules restrict writes to create-only, active users only,
 * and enforce the `vocabularyLicks.size() == 3` invariant server-side.
 */

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  getFirebaseFirestore,
} from '../firebase/firestore';
import type { Masterclass, SkillLevel } from '../types/masterclass';

export interface BackingTrackDoc {
  youtubeUrl: string;
  title: string;
  description: string;
  createdAt?: unknown;
  createdByUid: string;
}

export interface MasterclassVariantDoc extends Masterclass {
  skillLevel: SkillLevel;
  createdAt?: unknown;
  createdByUid: string;
}

/**
 * Parse a YouTube video ID from a URL.
 * Accepts `watch?v=…`, `youtu.be/…` and `/shorts/…` forms.
 * Returns `null` if no ID could be extracted.
 */
export function parseVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
  ];
  for (const rx of patterns) {
    const m = trimmed.match(rx);
    if (m) return m[1];
  }
  // If the user pasted the ID directly:
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

export async function getCachedVariant(
  videoId: string,
  skillLevel: SkillLevel,
): Promise<Masterclass | null> {
  const ref = doc(
    getFirebaseFirestore(),
    'backing_tracks',
    videoId,
    'variants',
    skillLevel,
  );
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  // Strip Firestore-only metadata so callers get a clean Masterclass shape
  // matching what the backend returns and what state holds.
  const data = snap.data() as MasterclassVariantDoc;
  return {
    trackInfo: data.trackInfo,
    rhythmSection: data.rhythmSection,
    leadSection: data.leadSection,
  };
}

/**
 * Write the backing-track doc (if missing) and its skill-level variant.
 * Both writes are create-only per Firestore rules; callers should only
 * invoke this on a cache miss.
 */
export async function saveGeneratedMasterclass(args: {
  videoId: string;
  youtubeUrl: string;
  title: string;
  description: string;
  skillLevel: SkillLevel;
  masterclass: Masterclass;
  uid: string;
}): Promise<void> {
  const db = getFirebaseFirestore();

  const trackRef = doc(db, 'backing_tracks', args.videoId);
  const trackSnap = await getDoc(trackRef);
  if (!trackSnap.exists()) {
    const trackDoc: BackingTrackDoc = {
      youtubeUrl: args.youtubeUrl,
      title: args.title,
      description: args.description,
      createdByUid: args.uid,
    };
    await setDoc(trackRef, {
      ...trackDoc,
      createdAt: serverTimestamp(),
    });
  }

  const variantRef = doc(
    db,
    'backing_tracks',
    args.videoId,
    'variants',
    args.skillLevel,
  );
  const variantDoc: MasterclassVariantDoc = {
    skillLevel: args.skillLevel,
    ...args.masterclass,
    createdByUid: args.uid,
  };
  await setDoc(variantRef, {
    ...variantDoc,
    createdAt: serverTimestamp(),
  });
}
