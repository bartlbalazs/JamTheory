/**
 * Practice-log service — writes to `users/{uid}/practice_logs/{auto}`.
 *
 * Each log records one practice session (the "Log Session" button on the
 * dashboard). Shape is minimal and append-only; the spec explicitly
 * promises that these logs are never inspected by the AI (iteration 1
 * — see docs/ROADMAP.md for future use).
 */

import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  getFirebaseFirestore,
} from '../firebase/firestore';

export interface PracticeLogInput {
  youtubeVideoId: string;
  /** ISO date, e.g. "2026-04-21". */
  date: string;
  /** Non-negative integer. */
  minutesPlayed: number;
  /** Optional free-form user note. */
  notes?: string;
}

export interface PracticeLogDoc extends PracticeLogInput {
  createdAt?: unknown;
}

export async function logPracticeSession(
  uid: string,
  input: PracticeLogInput,
): Promise<string> {
  if (!Number.isInteger(input.minutesPlayed) || input.minutesPlayed < 0) {
    throw new Error('minutesPlayed must be a non-negative integer.');
  }
  const col = collection(
    getFirebaseFirestore(),
    'users',
    uid,
    'practice_logs',
  );
  const ref = await addDoc(col, {
    ...input,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listPracticeLogs(uid: string): Promise<PracticeLogDoc[]> {
  const col = collection(
    getFirebaseFirestore(),
    'users',
    uid,
    'practice_logs',
  );
  const snap = await getDocs(query(col, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => d.data() as PracticeLogDoc);
}
