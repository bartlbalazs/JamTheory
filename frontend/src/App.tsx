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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[rgb(var(--brand-primary))] border-t-transparent rounded-full animate-spin"></div>
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
    setAskForChords(false);
    try {
      if (!userChords) {
        const cached = await getCachedVariant(videoId, skillLevel);
        if (cached) {
          setMasterclass(cached);
          setCurrentVideoId(videoId);
          return;
        }
      }

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
      
      const { title, description, ...masterclassOnly } = resp;
      setMasterclass(masterclassOnly);
      setCurrentVideoId(videoId);

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
    <div className="min-h-screen flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[rgb(var(--bg-surface))] border-b border-[color:var(--border-subtle)] shadow-sm backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))] shadow-lg flex items-center justify-center font-bold text-white tracking-tighter">
              JT
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
              Jam<span className="text-[rgb(var(--brand-primary))]">Theory</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-[rgb(var(--text-primary))] leading-tight">
                {userDoc?.displayName ?? firebaseUser?.email}
              </span>
              <span className="text-[10px] text-[rgb(var(--brand-primary))] uppercase tracking-wider font-bold">
                {userDoc?.skillLevel ?? 'Active'}
              </span>
            </div>
            <button
              onClick={() => void signOut()}
              className="text-xs font-semibold text-[rgb(var(--text-muted))] hover:text-white transition-colors"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        
        {/* Left Column (Sticky Player & Controls) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6 flex flex-col max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-2 pb-6">
          
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

          <div className="surface-card p-1 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
             <YouTubePlayer videoId={videoIdForPlayer} />
          </div>

          {currentVideoId ? (
             <PracticeLogger uid={uid} videoId={currentVideoId} />
          ) : (
            <div className="surface-card p-6 flex flex-col items-center justify-center text-center opacity-60">
              <div className="w-12 h-12 rounded-full bg-[rgb(var(--bg-surface-elevated))] flex items-center justify-center mb-3 text-[rgb(var(--text-muted))]">
                 🎵
              </div>
              <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Waiting for Track</p>
              <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Paste a YouTube URL above and hit Analyze to generate your masterclass.</p>
            </div>
          )}
        </div>

        {/* Right Column (Masterclass Content) */}
        <div className="lg:col-span-7 space-y-6 pb-20">
          {!masterclass && !loading && (
             <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-[color:var(--border-strong)] rounded-2xl p-12 text-center bg-gradient-to-b from-transparent to-[rgba(var(--brand-primary),0.02)]">
                 <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-tr from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))] shadow-[0_0_30px_rgba(var(--brand-primary),0.3)] flex items-center justify-center text-2xl">
                    🎸
                 </div>
                 <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">The Silent Supervisor</h2>
                 <p className="text-[rgb(var(--text-muted))] max-w-md">
                   Your data-driven AI guitar coach. Paste a backing track URL on the left to instantly generate a custom lesson plan tailored to your skill level.
                 </p>
             </div>
          )}

          {loading && (
            <div className="space-y-6">
              <div className="surface-card p-6 accent-glow-top animate-pulse-subtle">
                <div className="h-6 w-1/3 bg-[rgb(var(--bg-surface-elevated))] rounded mb-4"></div>
                <div className="h-4 w-full bg-[rgb(var(--bg-surface-elevated))] rounded mb-2"></div>
                <div className="h-4 w-2/3 bg-[rgb(var(--bg-surface-elevated))] rounded"></div>
              </div>
              <div className="surface-card p-6 animate-pulse-subtle">
                <div className="h-6 w-1/4 bg-[rgb(var(--bg-surface-elevated))] rounded mb-6"></div>
                <div className="flex gap-4 mb-4">
                  <div className="h-24 w-16 bg-[rgb(var(--bg-surface-elevated))] rounded"></div>
                  <div className="h-24 w-16 bg-[rgb(var(--bg-surface-elevated))] rounded"></div>
                  <div className="h-24 w-16 bg-[rgb(var(--bg-surface-elevated))] rounded"></div>
                </div>
                <div className="h-4 w-full bg-[rgb(var(--bg-surface-elevated))] rounded"></div>
              </div>
               <div className="surface-card p-6 animate-pulse-subtle">
                <div className="h-6 w-1/4 bg-[rgb(var(--bg-surface-elevated))] rounded mb-4"></div>
                <div className="h-32 w-full bg-[rgb(var(--bg-surface-elevated))] rounded"></div>
              </div>
            </div>
          )}

          {masterclass && !loading && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="pl-4 border-l-4 border-[rgb(var(--brand-accent))]">
                <VibeTheory info={masterclass.trackInfo} />
              </div>
              <div className="pl-4 border-l-4 border-[rgb(var(--brand-primary))]">
                <RhythmSection data={masterclass.rhythmSection} />
              </div>
              <div className="pl-4 border-l-4 border-orange-500">
                <LeadSection data={masterclass.leadSection} />
              </div>
              <div className="pl-4 border-l-4 border-pink-500">
                <VocabularyLicks
                  licks={masterclass.leadSection.vocabularyLicks}
                  onRegenerate={handleRegenerateLicks}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
