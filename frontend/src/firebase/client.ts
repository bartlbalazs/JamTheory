/**
 * Firebase SDK initialisation — modular SDK v10+ only.
 *
 * This module is the single source of truth for the Firebase app, Auth and
 * Firestore instances used by the rest of the app. Never import from
 * `firebase/*` directly outside of `src/firebase/*` and `src/services/*`.
 *
 * When `environment.useEmulators === true` we connect Auth to localhost:9099
 * and Firestore to localhost:8081 (matches `firebase.json`).
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';
import { environment } from '../environments/environment';

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = initializeApp(environment.firebase);
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
    if (environment.useEmulators) {
      // `disableWarnings: true` silences the red banner in dev.
      connectAuthEmulator(_auth, 'http://localhost:9099', {
        disableWarnings: true,
      });
    }
  }
  return _auth;
}

export function getFirebaseFirestore(): Firestore {
  if (!_db) {
    _db = getFirestore(getFirebaseApp());
    if (environment.useEmulators) {
      connectFirestoreEmulator(_db, 'localhost', 8081);
    }
  }
  return _db;
}
