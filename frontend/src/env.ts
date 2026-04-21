/**
 * App-level configuration.
 *
 * In production the `deploy.sh --hosting` script generates
 * `src/environments/environment.prod.ts`, which is loaded instead of this
 * file via Vite's mode-based resolution.
 *
 * At dev time we default to the local FastAPI server and the Firebase
 * Emulator Suite. When `VITE_USE_EMULATORS=false`, `src/firebase/client.ts`
 * will connect to real Firebase using the values from `VITE_FIREBASE_*`.
 */

export interface AppEnvironment {
  production: boolean;
  useEmulators: boolean;
  generateMasterclassUrl: string;
  regenerateLicksUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

const useEmulators = import.meta.env.VITE_USE_EMULATORS !== 'false';

export const environment: AppEnvironment = {
  production: false,
  useEmulators,
  generateMasterclassUrl:
    import.meta.env.VITE_GENERATE_MASTERCLASS_URL ?? 'http://localhost:8000/generate-masterclass',
  regenerateLicksUrl:
    import.meta.env.VITE_REGENERATE_LICKS_URL ?? 'http://localhost:8000/regenerate-licks',
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-api-key',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'demo-jamtheory.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-jamtheory',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'demo-jamtheory.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '0',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:0:web:demo',
  },
};
