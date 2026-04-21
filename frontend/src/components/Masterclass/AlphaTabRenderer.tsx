/**
 * AlphaTabRenderer — renders an AlphaTex string as tab/notation.
 *
 * CRITICAL: AlphaTab is lazy-loaded via a dynamic `import()` inside
 * `useEffect`. Never move this import to the top of the module — AlphaTab
 * is large and pulls in bokeh-style bundles that would balloon the initial
 * payload.
 *
 * The component owns its container <div> and re-renders on every
 * `alphatex` change.
 */

import { useEffect, useRef, useState } from 'react';

interface Props {
  alphatex: string;
  /** Optional extra classes on the outer wrapper. */
  className?: string;
}

export function AlphaTabRenderer({ alphatex, className }: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    const run = async (): Promise<void> => {
      if (!containerRef.current) return;
      try {
        // Lazy import — bundler will split this into its own chunk.
        const alphaTab = await import('@coderline/alphatab');
        if (disposed || !containerRef.current) return;

        // Dispose the previous API if we're re-rendering.
        const prev = apiRef.current as { destroy?: () => void } | null;
        prev?.destroy?.();

        // Construct with default settings; we feed the source via api.tex()
        // below. (AlphaTex auto-load via `core.tex: true` was a v0.x feature
        // and is no longer needed in v1.x.)
        const api = new alphaTab.AlphaTabApi(containerRef.current, {
          display: { scale: 1.0 },
        });
        apiRef.current = api;
        // The AlphaTex engine expects `\tempo` / `\title` etc. Wrap bare licks.
        const src = alphatex.trim().startsWith('\\')
          ? alphatex
          : `\\tempo 100 . ${alphatex}`;
        api.tex(src);
      } catch (e) {
        if (!disposed) {
          setError(e instanceof Error ? e.message : 'Failed to render tab.');
        }
      }
    };

    void run();

    return () => {
      disposed = true;
      const api = apiRef.current as { destroy?: () => void } | null;
      api?.destroy?.();
      apiRef.current = null;
    };
  }, [alphatex]);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="bg-white text-black rounded p-2 overflow-x-auto"
      />
      {error ? (
        <p className="mt-2 text-sm text-red-400">AlphaTab error: {error}</p>
      ) : null}
    </div>
  );
}
