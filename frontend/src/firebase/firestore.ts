/**
 * Firestore utility re-exports.
 *
 * Components and services should import Firestore helpers from THIS module,
 * not from `firebase/firestore` directly. That way the isolation rule
 * (per AGENTS.md) is enforced by convention and any future swap of storage
 * backend stays confined to `src/firebase/*`.
 */

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

export { getFirebaseFirestore } from './client';
