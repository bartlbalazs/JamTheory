/**
 * Auth service — thin wrapper around Firebase Auth.
 *
 * Responsibilities:
 *   - Google Sign-In via popup
 *   - Firestore user-doc creation on first sign-in (status: 'pending')
 *   - Loading the current Firestore user document (for status gating)
 *
 * The Firestore user doc shape:
 *   users/{uid} = {
 *     email, displayName, status: 'pending'|'active',
 *     skillLevel: 'Beginner'|'Intermediate'|'Advanced',
 *     createdAt, lastActive
 *   }
 *
 * Only an admin can flip status from 'pending' to 'active' — the Firestore
 * security rules prevent the user from doing so themselves.
 */

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from './client';

export type UserStatus = 'pending' | 'active';
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface UserDoc {
  email: string;
  displayName: string;
  status: UserStatus;
  skillLevel: SkillLevel;
  createdAt?: unknown;
  lastActive?: unknown;
}

export function onAuthStateChange(
  cb: (user: FirebaseUser | null) => void,
): () => void {
  return onAuthStateChanged(getFirebaseAuth(), cb);
}

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(getFirebaseAuth(), provider);
  await ensureUserDoc(cred.user);
  return cred.user;
}

export async function signOut(): Promise<void> {
  await fbSignOut(getFirebaseAuth());
}

export async function getIdToken(): Promise<string | null> {
  const u = getFirebaseAuth().currentUser;
  return u ? u.getIdToken() : null;
}

export async function loadUserDoc(uid: string): Promise<UserDoc | null> {
  const ref = doc(getFirebaseFirestore(), 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function updateSkillLevel(
  uid: string,
  skillLevel: SkillLevel,
): Promise<void> {
  const ref = doc(getFirebaseFirestore(), 'users', uid);
  await updateDoc(ref, {
    skillLevel,
    lastActive: serverTimestamp(),
  });
}

/**
 * Create a user document on first sign-in. Idempotent: if the document
 * already exists, this is a no-op.
 *
 * New users default to skillLevel = 'Intermediate' and status = 'pending'.
 * The admin flips status to 'active' manually in the Firebase console.
 */
async function ensureUserDoc(u: FirebaseUser): Promise<void> {
  const ref = doc(getFirebaseFirestore(), 'users', u.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  const newDoc: UserDoc = {
    email: u.email ?? '',
    displayName: u.displayName ?? u.email ?? '',
    status: 'pending',
    skillLevel: 'Intermediate',
  };
  await setDoc(ref, {
    ...newDoc,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
  });
}
