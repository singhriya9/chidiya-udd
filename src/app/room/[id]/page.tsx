'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PartySocket from 'partysocket';
import confetti from 'canvas-confetti';
import { usePlayerStore } from '@/store/usePlayerStore';
import {
  initAudio,
  isMuted,
  loadAudioPack,
  playSound,
  setMuted,
  stopAllSounds,
} from '@/lib/audio';
import { saveScore } from '@/app/actions/saveScore';
import { RoomLobby } from '@/components/lobby/RoomLobby';
import { GameTable, WinnerScreen } from '@/components/game/GameTable';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Player {
  id: string;
  name: string;
  avatar: string;
  lives: number;
  active: boolean;
  score: number;
}

interface GameItem {
  id: string;
  english: string;
  hindi: string;
  flies: boolean;
}

interface SpectatorReaction {
  id: string;
  playerId: string;
  emoji: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const { id: roomId } = use(params);
  const router = useRouter();
  const {
    name,
    avatarSeed,
    email,
    isLoggedIn,
    playerKey,
    hasHydrated,
    ensurePlayerKey,
  } = usePlayerStore();

  const [myId, setMyId] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const [audioPackId, setAudioPackId] = useState<string | null>(null);

  const [currentItem, setCurrentItem] = useState<GameItem | null>(null);
  const [timerMs, setTimerMs] = useState(3000);
  const [round, setRound] = useState(0);
  const [roundActive, setRoundActive] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [clickingPlayers, setClickingPlayers] = useState<Set<string>>(
    new Set(),
  );
  const [spectatorReactions, setSpectatorReactions] = useState<
    SpectatorReaction[]
  >([]);

  const [winner, setWinner] = useState<{
    name: string;
    avatar: string | null;
  } | null>(null);
  const [myFinalScore, setMyFinalScore] = useState<number | null>(null);
  const [totalUddItems, setTotalUddItems] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'open' | 'reconnecting' | 'closed'
  >('connecting');

  const reactionThrottleRef = useRef<Map<string, number>>(new Map());
  const audioPackIdRef = useRef<string | null>(null);
  const isActiveRef = useRef(true);
  const timeoutRefs = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const socketRef = useRef<PartySocket | null>(null);
  const myIdRef = useRef('');
  const emailRef = useRef(email);
  const identityRef = useRef({ name, avatarSeed, email, playerKey });

  useEffect(() => {
    audioPackIdRef.current = audioPackId;
  }, [audioPackId]);

  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);

  useEffect(() => {
    emailRef.current = email;
  }, [email]);

  useEffect(() => {
    identityRef.current = { name, avatarSeed, email, playerKey };
  }, [name, avatarSeed, email, playerKey]);

  useEffect(() => {
    if (hasHydrated) {
      ensurePlayerKey();
    }
  }, [hasHydrated, ensurePlayerKey]);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      for (const timeoutId of timeoutRefs.current) {
        clearTimeout(timeoutId);
      }
      timeoutRefs.current.clear();
      stopAllSounds();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const enableAudio = useCallback(async () => {
    await initAudio();
    setMuted(false);
    setMutedState(false);
    setAudioEnabled(true);
  }, []);

  const toggleMute = useCallback(async () => {
    const nextMuted = !muted;
    if (!nextMuted && !audioEnabled) {
      await initAudio();
      if (audioPackId) {
        await loadAudioPack(audioPackId);
      }
      setAudioEnabled(true);
    }
    setMuted(nextMuted);
    setMutedState(nextMuted);
  }, [muted, audioEnabled, audioPackId]);

  useEffect(() => {
    if (!hasHydrated || !isLoggedIn) return;

    setConnectionStatus('connecting');
    const socket = new PartySocket({
      host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999',
      room: roomId,
    });
    socketRef.current = socket;

    const onOpen = () => {
      setConnectionStatus('open');
      const identity = identityRef.current;
      socket.send(
        JSON.stringify({
          type: 'JOIN',
          playerKey: identity.playerKey || ensurePlayerKey(),
          name: identity.name || 'Player',
          avatar: identity.avatarSeed || 'default',
        }),
      );
    };

    const onClose = () => {
      if (!isActiveRef.current) return;
      setConnectionStatus('reconnecting');
    };

    const onError = () => {
      if (!isActiveRef.current) return;
      setConnectionStatus('reconnecting');
    };

    const onMessage = (event: MessageEvent) => {
      if (!isActiveRef.current) return;

      let msg: any;
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }

      switch (msg.type) {
        case 'CONNECTED':
          setMyId(msg.id);
          break;

        case 'LOBBY_UPDATE':
        case 'PLAYER_JOINED':
          setPlayers(msg.players);
          break;

        case 'ROOM_SNAPSHOT':
          setPlayers(Array.isArray(msg.players) ? msg.players : []);
          if (typeof msg.myId === 'string' && msg.myId.length > 0) {
            setMyId(msg.myId);
          }
          setRound(typeof msg.round === 'number' ? msg.round : 0);
          setTimerMs(typeof msg.timerMs === 'number' ? msg.timerMs : 3000);
          setAudioPackId(typeof msg.packId === 'string' ? msg.packId : null);
          setCurrentItem(msg.item ?? null);
          setRoundActive(Boolean(msg.gameActive && msg.item));
          setGameStarted(Boolean(msg.gameActive));
          if (msg.packId) {
            void loadAudioPack(msg.packId);
          }
          break;

        case 'GAME_STARTED':
          setGameStarted(true);
          setWinner(null);
          if (msg.packId) {
            setAudioPackId(msg.packId);
            void loadAudioPack(msg.packId);
          }
          break;

        case 'NEW_ITEM':
          if (msg.packId && msg.packId !== audioPackIdRef.current) {
            setAudioPackId(msg.packId);
            audioPackIdRef.current = msg.packId;
            void loadAudioPack(msg.packId);
          }
          setCurrentItem(msg.item);
          setTimerMs(msg.timerMs);
          setRound(msg.round);
          setRoundActive(true);
          playSound(msg.item.id);
          break;

        case 'PLAYER_ACTION': {
          const clickerId = msg.playerId;
          setClickingPlayers((prev) => {
            const next = new Set(prev);
            next.add(clickerId);
            return next;
          });
          if (clickerId !== myIdRef.current) {
            playSound('tap_soft');
          }
          const clickTimeout = setTimeout(() => {
            setClickingPlayers((prev) => {
              const next = new Set(prev);
              next.delete(clickerId);
              return next;
            });
            timeoutRefs.current.delete(clickTimeout);
          }, 400);
          timeoutRefs.current.add(clickTimeout);
          break;
        }

        case 'LIVES_UPDATE':
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === msg.playerId ? { ...p, lives: msg.lives } : p,
            ),
          );
          if (msg.playerId === myIdRef.current) {
            setShakeTrigger((t) => t + 1);
          }
          break;

        case 'PLAYER_OUT':
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === msg.playerId ? { ...p, active: false } : p,
            ),
          );
          break;

        case 'GAME_OVER': {
          setRoundActive(false);
          setGameStarted(false);
          setWinner({ name: msg.winnerName, avatar: msg.winnerAvatar });
          stopAllSounds();

          const myScoreRecord = msg.scores?.find(
            (s: any) => s.id === myIdRef.current,
          );
          const myScore = myScoreRecord ? myScoreRecord.score : 0;
          setMyFinalScore(myScore);
          setTotalUddItems(typeof msg.round === 'number' ? msg.round : round);
          if (emailRef.current) {
            saveScore(emailRef.current, myScore).catch(console.error);
          }

          confetti({
            particleCount: 150,
            spread: 120,
            origin: { y: 0.5 },
            colors: ['#f59e0b', '#ef4444', '#3b82f6', '#22c55e', '#a855f7'],
          });
          break;
        }

        case 'ROOM_RESET':
          setGameStarted(false);
          setCurrentItem(null);
          setRound(0);
          setRoundActive(false);
          setWinner(null);
          setMyFinalScore(null);
          setTotalUddItems(null);
          break;

        case 'SPECTATOR_REACTION': {
          const reactionId = `${msg.playerId}-${Date.now()}`;
          setSpectatorReactions((prev) => [
            ...prev,
            { id: reactionId, playerId: msg.playerId, emoji: msg.reaction },
          ]);
          const reactionTimeout = setTimeout(() => {
            setSpectatorReactions((prev) =>
              prev.filter((r) => r.id !== reactionId),
            );
            timeoutRefs.current.delete(reactionTimeout);
          }, 900);
          timeoutRefs.current.add(reactionTimeout);
          break;
        }
      }
    };

    socket.addEventListener('open', onOpen);
    socket.addEventListener('close', onClose);
    socket.addEventListener('error', onError);
    socket.addEventListener('message', onMessage);

    return () => {
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('close', onClose);
      socket.removeEventListener('error', onError);
      socket.removeEventListener('message', onMessage);
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [roomId, hasHydrated, isLoggedIn, ensurePlayerKey]);

  const sendMessage = useCallback((payload: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
  }, []);

  const handleUdd = useCallback(() => {
    if (!roundActive) return;
    setRoundActive(false); // prevent double-click from client
    sendMessage({ type: 'UDD_CLICKED', timestamp: Date.now() });
  }, [sendMessage, roundActive]);

  const handleStartGame = useCallback(() => {
    sendMessage({ type: 'START_GAME' });
  }, [sendMessage]);

  const handlePlayAgain = useCallback(() => {
    sendMessage({ type: 'PLAY_AGAIN' });
  }, [sendMessage]);

  const handleSpectatorReaction = useCallback(
    (emoji: string) => {
      // Throttle per player: max 1 reaction per 2s
      const last = reactionThrottleRef.current.get(myId) ?? 0;
      if (Date.now() - last < 2000) return;
      reactionThrottleRef.current.set(myId, Date.now());

      sendMessage({ type: 'SPECTATOR_REACTION', reaction: emoji });
    },
    [sendMessage, myId],
  );

  // Redirect if not logged in
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) {
      router.replace(`/?redirect=${encodeURIComponent(`/room/${roomId}`)}`);
    }
  }, [hasHydrated, isLoggedIn, roomId, router]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a] text-slate-400">
        Reconnecting room...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e1a]">
      {/* Back button */}
      <div className="absolute left-0 top-0 z-10 flex items-center gap-1 px-4 pt-4">
        <Button
          id="room-back-btn"
          variant="ghost"
          size="icon"
          onClick={() => router.push('/')}
          className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl h-12! w-12! [&_svg]:size-7!"
        >
          <ArrowLeft className="size-7!" />
        </Button>
        <Button
          id="room-mute-toggle-btn"
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
        <span className="ml-1 rounded-lg border border-white/10 bg-white/3 px-2 py-1 text-xs font-semibold font-mono tracking-widest text-slate-400">
          {roomId.toUpperCase()}
        </span>
      </div>

      {connectionStatus !== 'open' && (
        <div
          className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-200"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {connectionStatus === 'connecting'
            ? 'Connecting...'
            : 'Reconnecting...'}
        </div>
      )}

      {/* Winner overlay */}
      {winner && (
        <WinnerScreen
          winnerName={winner.name}
          winnerAvatar={winner.avatar}
          myScore={myFinalScore ?? undefined}
          totalUddItems={totalUddItems ?? undefined}
          onPlayAgain={handlePlayAgain}
          onLeaderboard={() => router.push('/leaderboard')}
        />
      )}

      {/* Main content */}
      {!gameStarted ? (
        <RoomLobby
          roomId={roomId}
          players={players}
          myId={myId}
          onStartGame={handleStartGame}
          onEnableAudio={enableAudio}
          audioEnabled={audioEnabled}
        />
      ) : (
        <div className="flex-1">
          <GameTable
            players={players}
            myId={myId}
            currentItem={currentItem}
            timerMs={timerMs}
            round={round}
            roundActive={roundActive}
            shakeTrigger={shakeTrigger}
            clickingPlayers={clickingPlayers}
            spectatorReactions={spectatorReactions}
            onUdd={handleUdd}
            onSpectatorReaction={handleSpectatorReaction}
          />
        </div>
      )}
    </div>
  );
}
