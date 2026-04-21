/**
 * Environment barrel.
 *
 * At build time, Vite evaluates `import.meta.env.PROD` as a literal boolean
 * and tree-shakes the unused branch. So:
 *   - `npm run dev`   → uses `../env` (Vite-env-driven defaults)
 *   - `npm run build` → uses `./environment.prod` (overwritten by deploy.sh)
 *
 * `environment.prod.ts` IS committed as a placeholder so TypeScript
 * type-checks and Vite production builds succeed in a fresh clone. The
 * real file is written in-place by `deploy.sh --hosting`; never commit
 * the post-deploy version with real project values.
 */

import { environment as devEnv } from '../env';
import { environment as prodEnv } from './environment.prod';

export type { AppEnvironment } from '../env';

export const environment = import.meta.env.PROD ? prodEnv : devEnv;
