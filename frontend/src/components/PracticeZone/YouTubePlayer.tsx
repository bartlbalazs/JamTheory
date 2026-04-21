import { useState } from 'react';
import YouTube from 'react-youtube';

/**
 * YouTubePlayer — a thin wrapper around `react-youtube`.
 * Responsive iframe, 16:9. Per the spec, we do NOT sync the player state
 * with any diagrams.
 */
export function YouTubePlayer({
  videoId,
}: {
  videoId: string | null;
}): JSX.Element {
  const [error, setError] = useState<string | null>(null);

  if (!videoId) {
    return (
      <div className="aspect-video w-full rounded-xl bg-[rgb(var(--bg-surface))] border border-[color:var(--border-subtle)] flex items-center justify-center text-[rgb(var(--text-muted))] text-sm">
        Paste a YouTube URL to begin.
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-[color:var(--border-subtle)] shadow-lg">
      <YouTube
        videoId={videoId}
        opts={{
          width: '100%',
          height: '100%',
          playerVars: { rel: 0, modestbranding: 1 },
        }}
        onError={() => setError('Failed to load video.')}
        iframeClassName="w-full h-full"
      />
      {error ? (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      ) : null}
    </div>
  );
}
