/**
 * Production environment — PLACEHOLDER.
 *
 * This file is a committed placeholder so TypeScript type-checks and Vite
 * production builds succeed in a fresh clone. It is OVERWRITTEN by
 * `deploy.sh --hosting` with the real API Gateway + Firebase config
 * derived from Terraform outputs. Do not edit by hand.
 */

import type { AppEnvironment } from '../env';

export const environment: AppEnvironment = {
  production: true,
  useEmulators: false,
  generateMasterclassUrl: 'https://PLACEHOLDER/generate-masterclass',
  regenerateLicksUrl: 'https://PLACEHOLDER/regenerate-licks',
  firebase: {
    apiKey: 'PLACEHOLDER',
    authDomain: 'PLACEHOLDER.firebaseapp.com',
    projectId: 'PLACEHOLDER',
    storageBucket: 'PLACEHOLDER.appspot.com',
    messagingSenderId: '0',
    appId: '1:0:web:placeholder',
  },
};
