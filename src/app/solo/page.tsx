'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PartySocket from 'partysocket';
import confetti from 'canvas-confetti';
import Image from 'next/image';
import { useGameStore, GameItem } from '@/store/useGameStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import {
  clearAudioPack,
  initAudio,
  isMuted,
  loadAudioPack,
  playSound,
  setMuted,
  stopAllSounds,
} from '@/lib/audio';
import { saveScore } from '@/app/actions/saveScore';
import { ItemDisplay } from '@/components/game/ItemDisplay';
import { UddButton } from '@/components/game/UddButton';
import { LivesDisplay } from '@/components/game/LivesDisplay';
import { TableShell } from '@/components/game/TableShell';
import { FingerIndicator } from '@/components/game/FingerIndicator';
import { ArrowLeft, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditLinks } from '@/components/shared/SiteFooter';
import { getAvatarDataUri } from '@/lib/avatar';

const TIMERS = [3000, 2500, 2000, 1500, 1200, 1000];
const SOLO_PACK_ROOM = 'solo-pack-selector';
const SOLO_PACK_TIMEOUT_MS = 5000;

function getTimerMs(level: number): number {
  return TIMERS[Math.min(level - 1, TIMERS.length - 1)];
}

function getPartyHost(): string {
  return process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';
}

async function requestSoloPack(): Promise<{
  packId: string;
  items: GameItem[];
}> {
  return new Promise((resolve, reject) => {
    const socket = new PartySocket({
      host: getPartyHost(),
      room: SOLO_PACK_ROOM,
    });

    const timeout = window.setTimeout(() => {
      socket.close();
      reject(new Error('Timed out while requesting solo pack from PartyKit.'));
    }, SOLO_PACK_TIMEOUT_MS);

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ type: 'REQUEST_SOLO_PACK' }));
    });

    socket.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(String(event.data));
        if (
          msg.type !== 'SOLO_PACK' ||
          !msg.packId ||
          !Array.isArray(msg.items)
        ) {
          return;
        }

        clearTimeout(timeout);
        socket.close();
        resolve({ packId: msg.packId, items: msg.items as GameItem[] });
      } catch {
        // Ignore malformed events and keep waiting for valid SOLO_PACK.
      }
    });

    socket.addEventListener('error', () => {
      clearTimeout(timeout);
      socket.close();
      reject(
        new Error('Failed to connect to PartyKit for solo pack selection.'),
      );
    });
  });
}

export default function SoloPage() {
  const router = useRouter();
  const { email, avatarSeed } = usePlayerStore();
  const {
    lives,
    score,
    level,
    currentItem,
    isPlaying,
    gameOver,
    shakeTrigger,
    maxLives,
    loseLife,
    addScore,
    nextLevel,
    setItem,
    startGame,
    reset,
  } = useGameStore();

  const [audioEnabled, setAudioEnabled] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const [startWithSound, setStartWithSound] = useState(true);
  const [showAudioGate, setShowAudioGate] = useState(true);
  const [audioGateError, setAudioGateError] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [startStatus, setStartStatus] = useState('');
  const [isFingerUp, setIsFingerUp] = useState(false);
  const [round, setRound] = useState(0);
  const [roundActive, setRoundActive] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [activePackItems, setActivePackItems] = useState<GameItem[]>([]);

  // Refs for game loop — avoids stale closures
  const clickedRef = useRef(false);
  const roundActiveRef = useRef(false);
  const roundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const correctCountRef = useRef(0);
  const levelRef = useRef(1);
  const roundRef = useRef(0);
  const activePackItemsRef = useRef<GameItem[]>([]);
  const isActiveRef = useRef(true);
  const isStartingRef = useRef(false);
  const startAttemptRef = useRef(0);
  const roundGapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fingerResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const roundStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Sync level ref
  useEffect(() => {
    levelRef.current = level;
  }, [level]);
  useEffect(() => {
    activePackItemsRef.current = activePackItems;
  }, [activePackItems]);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
      if (roundGapTimeoutRef.current) clearTimeout(roundGapTimeoutRef.current);
      if (fingerResetTimeoutRef.current)
        clearTimeout(fingerResetTimeoutRef.current);
      if (roundStartTimeoutRef.current)
        clearTimeout(roundStartTimeoutRef.current);
      stopAllSounds();
    };
  }, []);

  const endRound = useCallback(() => {
    roundActiveRef.current = false;
    setRoundActive(false);
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
  }, []);

  const startNextRound = useCallback(() => {
    if (!isActiveRef.current) return;
    if (useGameStore.getState().gameOver) return;

    const state = useGameStore.getState();
    if (state.lives <= 0) return;

    const itemPool = activePackItemsRef.current;
    if (itemPool.length === 0) return;

    // Pick item — round 1 always first pack item
    let item: GameItem;
    if (roundRef.current === 0) {
      item = itemPool[0] as GameItem;
    } else {
      const poolWithoutFirst = itemPool.slice(1);
      const randomPool =
        poolWithoutFirst.length > 0 ? poolWithoutFirst : itemPool;
      item = randomPool[
        Math.floor(Math.random() * randomPool.length)
      ] as GameItem;
    }

    roundRef.current += 1;
    setRound(roundRef.current);
    setItem(item);
    clickedRef.current = false;
    roundActiveRef.current = true;
    setRoundActive(true);
    setIsFingerUp(false);

    // Play audio
    playSound(item.id);

    const timerMs = getTimerMs(levelRef.current);

    // Set timer for round evaluation
    roundTimerRef.current = setTimeout(() => {
      evaluateRound(item);
    }, timerMs);
  }, [setItem]);

  const evaluateRound = useCallback(
    (item: GameItem) => {
      if (!roundActiveRef.current) return;
      if (!isActiveRef.current) return;
      roundActiveRef.current = false;
      setRoundActive(false);

      const clicked = clickedRef.current;
      const flies = item.flies;

      if (flies && clicked) {
        // ✓ Correct guess: clicked on a flying item
        addScore();
        playSound('correct');
        correctCountRef.current += 1;
        if (correctCountRef.current % 5 === 0) {
          nextLevel();
        }
      } else if (!flies && !clicked) {
        // ✓ Correct guess: did not click on a non-flying item
        addScore();
        playSound('correct');
        correctCountRef.current += 1;
        if (correctCountRef.current % 5 === 0) {
          nextLevel();
        }
      } else {
        // ✗ Wrong
        loseLife();
        playSound('wrong');
      }

      // Check game over
      const newState = useGameStore.getState();
      if (newState.lives <= 0 || newState.gameOver) return;

      // 800ms pause between rounds
      if (roundGapTimeoutRef.current) clearTimeout(roundGapTimeoutRef.current);
      roundGapTimeoutRef.current = setTimeout(() => {
        startNextRound();
      }, 800);
    },
    [addScore, loseLife, nextLevel, startNextRound],
  );

  const handleUdd = useCallback(() => {
    if (!roundActiveRef.current) return;
    if (!isActiveRef.current) return;
    clickedRef.current = true;
    setIsFingerUp(true);
    if (fingerResetTimeoutRef.current)
      clearTimeout(fingerResetTimeoutRef.current);
    fingerResetTimeoutRef.current = setTimeout(() => setIsFingerUp(false), 400);

    // In solo mode, clicking UDD should immediately resolve the round.
    if (roundTimerRef.current) {
      clearTimeout(roundTimerRef.current);
      roundTimerRef.current = null;
    }

    const item = useGameStore.getState().currentItem;
    if (item) {
      evaluateRound(item);
    }
  }, [evaluateRound]);

  const startSolo = useCallback(
    async (withSound: boolean) => {
      if (isStartingRef.current) return;

      isStartingRef.current = true;
      const attemptId = startAttemptRef.current + 1;
      startAttemptRef.current = attemptId;
      setIsStarting(true);

      try {
        setAudioGateError('');
        setStartStatus('Getting your pack...');
        clearAudioPack();

        const { packId, items: packItems } = await requestSoloPack();
        if (!isActiveRef.current || startAttemptRef.current !== attemptId) return;
        if (!packItems.length) {
          throw new Error('Selected pack has no items.');
        }

        if (withSound) {
          setStartStatus('Loading sounds...');
          await initAudio();
          if (!isActiveRef.current || startAttemptRef.current !== attemptId) return;
          await loadAudioPack(packId);
          if (!isActiveRef.current || startAttemptRef.current !== attemptId) return;
          setMuted(false);
          setMutedState(false);
        } else {
          setMuted(true);
          setMutedState(true);
        }
        setStartStatus('Starting game...');
        setActivePackId(packId);
        setActivePackItems(packItems);
        setAudioEnabled(withSound);
        setShowAudioGate(false);
        startGame(5);
        correctCountRef.current = 0;
        roundRef.current = 0;
        levelRef.current = 1;
        if (roundStartTimeoutRef.current)
          clearTimeout(roundStartTimeoutRef.current);
        roundStartTimeoutRef.current = setTimeout(() => startNextRound(), 500);
      } catch (error) {
        console.error(error);
        setAudioGateError(
          'Could not start solo pack from PartyKit. Please try again.',
        );
      } finally {
        if (startAttemptRef.current === attemptId) {
          isStartingRef.current = false;
          if (isActiveRef.current) {
            setIsStarting(false);
            setStartStatus('');
          }
        }
      }
    },
    [startGame, startNextRound],
  );

  const enableAudioAndStart = useCallback(async () => {
    await startSolo(startWithSound);
  }, [startSolo, startWithSound]);

  const handlePlayAgain = useCallback(() => {
    if (activePackItemsRef.current.length === 0) {
      setShowAudioGate(true);
      return;
    }
    endRound();
    reset(5);
    setScoreSaved(false);
    correctCountRef.current = 0;
    roundRef.current = 0;
    levelRef.current = 1;
    setRound(0);
    if (roundStartTimeoutRef.current)
      clearTimeout(roundStartTimeoutRef.current);
    roundStartTimeoutRef.current = setTimeout(() => startNextRound(), 500);
  }, [endRound, reset, startNextRound]);

  const toggleMute = useCallback(async () => {
    const nextMuted = !muted;
    if (!nextMuted && !audioEnabled) {
      await initAudio();
      if (activePackId) {
        await loadAudioPack(activePackId);
      }
      setAudioEnabled(true);
    }
    setMuted(nextMuted);
    setMutedState(nextMuted);
  }, [muted, audioEnabled, activePackId]);

  // Save score when game over
  useEffect(() => {
    if (gameOver && !scoreSaved && email) {
      setScoreSaved(true);
      saveScore(email, score).catch(console.error);
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ef4444', '#3b82f6', '#22c55e'],
      });
    }
  }, [gameOver, scoreSaved, email]);

  const timerMs = getTimerMs(level);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e1a] overflow-hidden">
      {/* Audio Gate */}
      <AnimatePresence>
        {showAudioGate && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm mx-4"
            >
              <Card className="glass border-white/10 shadow-2xl bg-transparent sm:bg-card/50">
                <CardContent className="p-10 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setStartWithSound((v) => !v)}
                    disabled={isStarting}
                    className="mx-auto mb-4 h-20! w-20! rounded-full border border-white/15 hover:bg-white/10 [&_svg]:size-12!"
                    title={startWithSound ? 'Start with sound' : 'Start muted'}
                  >
                    {startWithSound ? (
                      <Volume2
                        className="size-12!"
                        style={{ color: '#f59e0b' }}
                      />
                    ) : (
                      <VolumeX
                        className="size-12!"
                        style={{ color: '#f59e0b' }}
                      />
                    )}
                  </Button>
                  <h2 className="text-2xl font-black text-white mb-2">
                    {startWithSound ? 'Audio Enabled' : 'Audio Disabled'}
                  </h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Tap the icon to choose sound on/off, then start.
                  </p>
                  {audioGateError ? (
                    <p className="text-red-400 text-sm mb-4">
                      {audioGateError}
                    </p>
                  ) : null}
                  {isStarting && startStatus ? (
                    <p className="text-amber-300 text-xs mb-4 uppercase tracking-widest">
                      {startStatus}
                    </p>
                  ) : null}
                  <motion.div
                    whileTap={isStarting ? undefined : { scale: 0.95 }}
                    whileHover={isStarting ? undefined : { scale: 1.02 }}
                  >
                    <Button
                      id="enable-audio-btn"
                      size="lg"
                      disabled={isStarting}
                      aria-busy={isStarting}
                      className="w-full h-16 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xl transition-all shadow-lg shadow-amber-500/20"
                      onClick={enableAudioAndStart}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Image
                          src="/logo.svg"
                          alt="Chidiya Udd logo"
                          width={30}
                          height={30}
                        />
                        {isStarting ? 'Getting Ready...' : 'Tap to Play!'}
                      </span>
                    </Button>
                  </motion.div>
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/')}
                    className="mt-4 w-full text-slate-400 hover:text-slate-300 text-sm hover:bg-transparent"
                  >
                    ← Back
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-end justify-center pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm mx-4"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            >
              <Card className="glass-strong border-white/10 shadow-2xl bg-transparent sm:bg-card/50">
                <CardContent className="p-8 text-center">
                  <div className="text-5xl mb-4">😵</div>
                  <h2 className="text-3xl font-black text-white mb-1">
                    Game Over!
                  </h2>
                  <p className="text-slate-400 mb-6">Better luck next time!</p>

                  <div className="mb-6 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                    <div className="text-center">
                      <div
                        className="text-3xl font-black"
                        style={{ color: '#f59e0b' }}
                      >
                        {score}
                      </div>
                      <div className="text-slate-400 text-xs uppercase tracking-widest">
                        Correct Guesses
                      </div>
                    </div>
                    <div className="mx-auto my-3 h-px w-full max-w-[180px] bg-white/10" />
                    <div className="text-center">
                      <div className="text-3xl font-black text-white">
                        {round}
                      </div>
                      <div className="text-slate-400 text-xs uppercase tracking-widest">
                        Rounds Played
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button
                        id="play-again-btn"
                        size="lg"
                        className="w-full h-14 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-lg transition-all shadow-lg shadow-amber-500/20"
                        onClick={handlePlayAgain}
                      >
                        <RotateCcw size={18} className="mr-2" />
                        Play Again
                      </Button>
                    </motion.div>
                    <Button
                      id="view-leaderboard-btn"
                      variant="ghost"
                      className="w-full h-12 text-slate-400 hover:text-white text-sm hover:bg-white/5"
                      onClick={() => router.push('/leaderboard')}
                    >
                      View Leaderboard →
                    </Button>
                  </div>

                  <p className="mt-5 text-xs text-slate-500">
                    Made with <span className="text-rose-400">❤️</span> by{' '}
                    <CreditLinks />
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD — Top */}
      <div className="flex items-center justify-between px-4 pt-4 z-10">
        <div className="flex items-center gap-2">
          <Button
            id="solo-back-btn"
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl h-12! w-12! [&_svg]:size-7!"
          >
            <ArrowLeft className="size-7!" />
          </Button>
          <Button
            id="solo-mute-toggle-btn"
            variant="ghost"
            size="icon"
            onClick={() => void toggleMute()}
            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl h-12! w-12! [&_svg]:size-7!"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <VolumeX className="size-7!" />
            ) : (
              <Volume2 className="size-7!" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-6">
          {activePackId ? (
            <div className="text-center">
              <div className="text-xs text-slate-500 uppercase tracking-widest">
                Pack
              </div>
              <div className="text-sm font-black text-slate-200">
                {activePackId.toUpperCase()}
              </div>
            </div>
          ) : null}
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-widest">
              Correct Guesses
            </div>
            <div className="text-2xl font-black" style={{ color: '#f59e0b' }}>
              {score}
            </div>
          </div>
        </div>
      </div>

      {/* Gameplay area */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 pb-3 pt-2 sm:px-5 sm:pt-4">
        <div className="relative w-full max-w-[540px]">
          <div className="absolute left-1/2 top-0 z-20 flex items-center gap-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-sm font-bold tracking-wide text-slate-100 backdrop-blur">
            <Image
              src={getAvatarDataUri(avatarSeed || 'solo-me')}
              alt="Your avatar"
              width={50}
              height={50}
              className="rounded-full border border-white/20"
              unoptimized
            />
            YOU
          </div>
          <div className="absolute right-3 top-3 z-20 rounded-xl border border-white/15 bg-black/45 px-2.5 py-1.5 backdrop-blur">
            <LivesDisplay lives={lives} maxLives={maxLives} />
          </div>
          <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2">
            <FingerIndicator isClicking={isFingerUp} size={126} />
          </div>

          <TableShell
            shape="circle"
            shakeTrigger={shakeTrigger}
            className="mx-auto w-[94vw] max-w-[520px] min-w-[280px]"
          >
            <div className="flex h-full w-full items-center justify-center px-7 py-10 sm:px-10">
              {currentItem ? (
                <ItemDisplay
                  english={currentItem.english}
                  hindi={currentItem.hindi}
                  itemId={currentItem.id}
                />
              ) : (
                <div className="text-center text-slate-500">
                  <p className="text-xl font-bold">
                    {audioEnabled ? 'Get Ready...' : ''}
                  </p>
                </div>
              )}
            </div>
          </TableShell>
        </div>
      </div>

      {/* UDD Button — Bottom */}
      <div className="px-4 pb-5 pt-2 sm:px-6 sm:pb-8 sm:pt-4">
        <UddButton
          onUdd={handleUdd}
          disabled={!roundActive || gameOver}
          timerMs={timerMs}
          round={round}
          isActive={roundActive}
        />
      </div>
    </div>
  );
}
