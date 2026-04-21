/**
 * Root component — orchestrates auth gating and the two-column dashboard.
 *
 * Gating flow:
 *   loading  → <AuthLoading />
 *   no user  → <SignIn />
 *   pending  → <PendingGate />
 *   active   → <Dashboard />
 *
 * Dashboard layout:
 *   Left column  (Practice Zone): YouTube player, track input, session logger
 *   Right column (Masterclass):   vibe+theory, rhythm, lead, vocabulary licks
 *
 * Cache-first data flow:
 *   1. On "Analyze track": parse videoId → read cache at
 *      backing_tracks/{videoId}/variants/{skillLevel}
 *   2. On cache miss: call backend generate-masterclass → write cache.
 *   3. On chord-fallback: show chord input, re-call with userChords.
 */

import { useMemo, useState } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { PendingGate } from './components/auth/PendingGate';
import { SignIn } from './components/auth/SignIn';
import { YouTubePlayer } from './components/PracticeZone/YouTubePlayer';
import { TrackInput } from './components/PracticeZone/TrackInput';
import { PracticeLogger } from './components/PracticeZone/PracticeLogger';
import { VibeTheory } from './components/Masterclass/VibeTheory';
import { RhythmSection } from './components/Masterclass/RhythmSection';
import { LeadSection } from './components/Masterclass/LeadSection';
import { VocabularyLicks } from './components/Masterclass/VocabularyLicks';
import {
  generateMasterclass,
  isMasterclass,
  needsChords,
  regenerateLicks,
} from './services/masterclassApi';
import {
  getCachedVariant,
  parseVideoId,
  saveGeneratedMasterclass,
} from './services/backingTrackService';
import { signOut } from './firebase/auth';
import type { Masterclass, SkillLevel } from './types/masterclass';

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

function Gate(): JSX.Element {
  const { firebaseUser, userDoc, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-400">
        Loading…
      </div>
    );
  }
  if (!firebaseUser) return <SignIn />;
  if (!userDoc || userDoc.status !== 'active') return <PendingGate />;
  return <Dashboard />;
}

function Dashboard(): JSX.Element {
  const { firebaseUser, userDoc } = useAuth();
  const uid = firebaseUser!.uid;

  const [url, setUrl] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(
    userDoc?.skillLevel ?? 'Intermediate',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [masterclass, setMasterclass] = useState<Masterclass | null>(null);
  const [askForChords, setAskForChords] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  const handleAnalyze = async (userChords?: string): Promise<void> => {
    setError(null);
    const videoId = parseVideoId(url);
    if (!videoId) {
      setError('Could not parse a YouTube video ID from that URL.');
      return;
    }

    setLoading(true);
    try {
      // 1. Cache lookup (skip if user is providing manual chords —
      //    that implies we already know the cache doesn't hold a variant).
      if (!userChords) {
        const cached = await getCachedVariant(videoId, skillLevel);
        if (cached) {
          setMasterclass(cached);
          setCurrentVideoId(videoId);
          setAskForChords(false);
          return;
        }
      }

      // 2. Backend call.
      const resp = await generateMasterclass({
        youtubeVideoId: videoId,
        skillLevel,
        ...(userChords ? { userChords } : {}),
      });
      if (needsChords(resp)) {
        setAskForChords(true);
        setMasterclass(null);
        setCurrentVideoId(videoId);
        return;
      }
      if (!isMasterclass(resp)) {
        throw new Error('Unexpected response from backend.');
      }
      // Split off the YouTube metadata echoed back by the backend. It is
      // only used for the cache-write and must NOT leak into the
      // masterclass held in component state (the cached document shape
      // is strictly { trackInfo, rhythmSection, leadSection }).
      const { title, description, ...masterclassOnly } = resp;
      setMasterclass(masterclassOnly);
      setAskForChords(false);
      setCurrentVideoId(videoId);

      // 3. Cache write (best-effort; ignore errors so UX isn't blocked).
      try {
        await saveGeneratedMasterclass({
          videoId,
          youtubeUrl: url,
          title,
          description,
          skillLevel,
          masterclass: masterclassOnly,
          uid,
        });
      } catch (cacheErr) {
        // eslint-disable-next-line no-console
        console.warn('Cache write failed:', cacheErr);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateLicks = async (): Promise<void> => {
    if (!currentVideoId || !masterclass) return;
    const newLicks = await regenerateLicks({
      key: masterclass.trackInfo.key,
      genre: masterclass.trackInfo.genre,
      skillLevel,
    });
    setMasterclass({
      ...masterclass,
      leadSection: {
        ...masterclass.leadSection,
        vocabularyLicks: newLicks,
      },
    });
  };

  const videoIdForPlayer = useMemo(() => parseVideoId(url), [url]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-800">
        <h1 className="text-lg font-semibold">
          JamTheory <span className="text-neutral-500">— Silent Supervisor</span>
        </h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-neutral-400">
            {userDoc?.displayName ?? firebaseUser?.email}
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="py-1 px-3 rounded bg-neutral-800 hover:bg-neutral-700"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1400px] mx-auto">
        {/* LEFT: Practice Zone */}
        <div className="space-y-4">
          <YouTubePlayer videoId={videoIdForPlayer} />
          <TrackInput
            url={url}
            onUrlChange={setUrl}
            skillLevel={skillLevel}
            onSkillLevelChange={setSkillLevel}
            onSubmit={() => handleAnalyze()}
            onSubmitWithChords={(chords) => handleAnalyze(chords)}
            needsChords={askForChords}
            loading={loading}
            error={error}
          />
          <PracticeLogger uid={uid} videoId={currentVideoId} />
        </div>

        {/* RIGHT: Masterclass */}
        <div className="space-y-4">
          {!masterclass ? (
            <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-6 text-center text-neutral-500 text-sm">
              Your masterclass will appear here after you analyze a track.
            </div>
          ) : (
            <>
              <VibeTheory info={masterclass.trackInfo} />
              <RhythmSection data={masterclass.rhythmSection} />
              <LeadSection data={masterclass.leadSection} />
              <VocabularyLicks
                licks={masterclass.leadSection.vocabularyLicks}
                onRegenerate={handleRegenerateLicks}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
