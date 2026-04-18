'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Copy, Check, Loader2, Volume2, Heart } from 'lucide-react';
import Image from 'next/image';
import { getAvatarDataUri } from '@/lib/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SiteFooter } from '@/components/shared/SiteFooter';

interface Player {
  id: string;
  name: string;
  avatar: string;
  lives: number;
  active: boolean;
  score: number;
}

interface RoomLobbyProps {
  roomId: string;
  players: Player[];
  myId: string;
  onStartGame: () => void;
  onEnableAudio: () => void;
  audioEnabled: boolean;
}

export function RoomLobby({
  roomId,
  players,
  myId,
  onStartGame,
  onEnableAudio,
  audioEnabled,
}: RoomLobbyProps) {
  const [copied, setCopied] = useState(false);
  const [roomUrl, setRoomUrl] = useState('');

  const isHost = players.length > 0 && players[0]?.id === myId;
  const canStart = players.length >= 2;

  useEffect(() => {
    setRoomUrl(`${window.location.origin}/room/${roomId.toUpperCase()}`);
  }, [roomId]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(
      roomUrl || `${window.location.origin}/room/${roomId.toUpperCase()}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 pt-16 sm:pt-20">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Room code card */}
        <Card className="glass-strong border-white/10 mb-6 text-center bg-transparent sm:bg-card/50 overflow-hidden shadow-xl">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-sm tracking-widest mb-2 font-medium">ROOM CODE</p>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span
                className="text-4xl font-black tracking-widest text-white font-mono bg-black/20 px-4 py-2 rounded-xl border border-white/5"
                style={{ letterSpacing: '0.2em', color: '#f59e0b' }}
              >
                {roomId.toUpperCase()}
              </span>
              <Button
                id="copy-link-btn"
                variant="ghost"
                size="icon"
                onClick={copyLink}
                className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check size={20} className="text-green-400" />
                    </motion.div>
                  ) : (
                    <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Copy size={20} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
            <p className="text-slate-500 text-xs">Share this code or URL with friends</p>
            {roomUrl ? (
              <p className="mt-2 break-all text-[11px] text-slate-400">{roomUrl}</p>
            ) : null}
          </CardContent>
        </Card>

        {/* Players list */}
        <Card className="glass-strong border-white/10 mb-6 bg-transparent sm:bg-card/50 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4 px-1">
              <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
                Players
              </p>
              <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                {players.length} / 8
              </Badge>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {players.map((player, i) => (
                  <motion.div
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-black/20"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Image
                      src={getAvatarDataUri(player.avatar)}
                      alt={player.name}
                      width={40}
                      height={40}
                      className="rounded-full border border-white/10"
                      unoptimized
                    />
                    <span className="text-white font-semibold flex-1 text-lg">{player.name}</span>
                    <div className="flex gap-2">
                      {i === 0 && (
                        <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0">
                          Host
                        </Badge>
                      )}
                      {player.id === myId && (
                        <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-0">
                          You
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {players.length === 0 && (
                <div className="text-center py-6 text-slate-500">
                  <Loader2 size={24} className="animate-spin mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Connecting to room...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audio enable */}
        {!audioEnabled && (
          <motion.div whileTap={{ scale: 0.97 }} className="mb-4">
            <Button
              id="enable-audio-lobby-btn"
              variant="outline"
              size="lg"
              className="w-full h-14 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl bg-transparent hover:bg-white/5"
              onClick={onEnableAudio}
            >
              <Volume2 size={18} className="mr-2" />
              <span className="font-bold">Enable Audio</span>
            </Button>
          </motion.div>
        )}

        {/* Start / Wait */}
        <div className="mt-2">
          {isHost ? (
            <motion.div
              whileTap={canStart ? { scale: 0.97 } : undefined}
              whileHover={canStart ? { scale: 1.01 } : undefined}
            >
              <Button
                id="start-game-btn"
                size="lg"
                disabled={!canStart}
                className={`w-full h-16 rounded-2xl font-black text-xl transition-all shadow-lg ${
                  canStart
                    ? 'bg-linear-to-br from-amber-400 to-amber-600 text-black hover:from-amber-300 hover:to-amber-500 shadow-amber-500/30 border-0'
                    : 'bg-white/5 text-slate-500 border border-white/10 shadow-none'
                }`}
                onClick={onStartGame}
              >
                {canStart ? '🎮 Start Game' : `Need ${2 - players.length} more player${2 - players.length !== 1 ? 's' : ''}...`}
              </Button>
            </motion.div>
          ) : (
            <div className="w-full h-16 flex items-center justify-center rounded-2xl font-bold text-slate-400 border border-white/10 glass-strong shadow-lg">
              <Loader2 size={20} className="animate-spin mr-3 opacity-70" />
              Waiting for host...
            </div>
          )}
        </div>
      </motion.div>

      <SiteFooter className="fixed bottom-0 left-0 right-0 px-4 pb-2" />
    </div>
  );
}

// Compact player card for GameTable
export function PlayerCard({
  player,
  isMe,
  onReaction,
}: {
  player: Player;
  isMe: boolean;
  onReaction?: (emoji: string) => void;
}) {
  const isEliminated = !player.active;
  const isDanger = player.lives === 1 && player.active;

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      animate={isEliminated ? { filter: 'grayscale(100%)' } : { filter: 'grayscale(0%)' }}
      transition={{ duration: 0.6 }}
    >
      <div
        className={`relative rounded-full p-1 ${isDanger ? 'animate-pulse-danger' : ''}`}
        style={{
          border: isMe ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.1)',
        }}
      >
        <Image
          src={getAvatarDataUri(player.avatar)}
          alt={player.name}
          width={54}
          height={54}
          className="rounded-full"
          unoptimized
        />
        {isEliminated && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-xs">
            ☠️
          </div>
        )}
      </div>

      <span className="text-sm font-semibold text-white truncate max-w-24 text-center">
        {player.name}
      </span>

      <div className="flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Heart
            key={i}
            size={12}
            className={i < player.lives ? 'heart-full' : 'heart-empty'}
            fill={i < player.lives ? '#ef4444' : 'transparent'}
          />
        ))}
      </div>

      {/* Spectator reactions */}
      {isEliminated && onReaction && (
        <div className="flex gap-1 mt-1">
          {['😂', '😮', '👏', '😱'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReaction(emoji)}
              className="text-base hover:scale-125 transition-transform select-none"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
