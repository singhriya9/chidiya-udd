'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ItemDisplay } from '@/components/game/ItemDisplay';
import { UddButton } from '@/components/game/UddButton';
import { TableShell } from '@/components/game/TableShell';
import { FingerIndicator } from '@/components/game/FingerIndicator';
import { getAvatarDataUri } from '@/lib/avatar';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, RotateCcw } from 'lucide-react';
import { CreditLinks } from '@/components/shared/SiteFooter';

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

interface GameTableProps {
  players: Player[];
  myId: string;
  currentItem: GameItem | null;
  timerMs: number;
  round: number;
  roundActive: boolean;
  shakeTrigger: number;
  clickingPlayers: Set<string>;
  spectatorReactions: SpectatorReaction[];
  onUdd: () => void;
  onSpectatorReaction: (emoji: string) => void;
}

interface SeatSlot {
  chipX: number;
  chipY: number;
  fingerOffsetX: number;
  fingerOffsetY: number;
  z?: number;
}

type SlotMap = Record<number, SeatSlot[]>;

const MOBILE_SLOT_MAP: SlotMap = {
  2: [
    { chipX: 70, chipY: 86, fingerOffsetX: 0, fingerOffsetY: -10, z: 30 },
    { chipX: 50, chipY: 16, fingerOffsetX: 0, fingerOffsetY: 10, z: 20 },
  ],
  3: [
    { chipX: 50, chipY: 86, fingerOffsetX: 0, fingerOffsetY: -10, z: 30 },
    { chipX: 24, chipY: 26, fingerOffsetX: 10, fingerOffsetY: 6, z: 20 },
    { chipX: 76, chipY: 26, fingerOffsetX: -10, fingerOffsetY: 6, z: 20 },
  ],
  4: [
    { chipX: 50, chipY: 87, fingerOffsetX: 0, fingerOffsetY: -10, z: 30 },
    { chipX: 24, chipY: 24, fingerOffsetX: 10, fingerOffsetY: 8, z: 20 },
    { chipX: 76, chipY: 24, fingerOffsetX: -10, fingerOffsetY: 8, z: 20 },
    { chipX: 50, chipY: 14, fingerOffsetX: 0, fingerOffsetY: 10, z: 20 },
  ],
  5: [
    { chipX: 50, chipY: 88, fingerOffsetX: 0, fingerOffsetY: -10, z: 30 },
    { chipX: 24, chipY: 27, fingerOffsetX: 10, fingerOffsetY: 8, z: 22 },
    { chipX: 76, chipY: 27, fingerOffsetX: -10, fingerOffsetY: 8, z: 22 },
    { chipX: 76, chipY: 62, fingerOffsetX: -10, fingerOffsetY: -6, z: 21 },
    { chipX: 24, chipY: 62, fingerOffsetX: 10, fingerOffsetY: -6, z: 21 },
  ],
  6: [
    { chipX: 50, chipY: 88, fingerOffsetX: 0, fingerOffsetY: -10, z: 30 },
    { chipX: 20, chipY: 31, fingerOffsetX: 11, fingerOffsetY: 8, z: 22 },
    { chipX: 36, chipY: 14, fingerOffsetX: 8, fingerOffsetY: 10, z: 22 },
    { chipX: 64, chipY: 14, fingerOffsetX: -8, fingerOffsetY: 10, z: 22 },
    { chipX: 80, chipY: 31, fingerOffsetX: -11, fingerOffsetY: 8, z: 22 },
    { chipX: 50, chipY: 64, fingerOffsetX: 0, fingerOffsetY: -8, z: 21 },
  ],
  7: [
    { chipX: 50, chipY: 88, fingerOffsetX: 0, fingerOffsetY: -10, z: 30 },
    { chipX: 20, chipY: 33, fingerOffsetX: 11, fingerOffsetY: 8, z: 22 },
    { chipX: 30, chipY: 16, fingerOffsetX: 10, fingerOffsetY: 10, z: 22 },
    { chipX: 50, chipY: 12, fingerOffsetX: 0, fingerOffsetY: 10, z: 22 },
    { chipX: 70, chipY: 16, fingerOffsetX: -10, fingerOffsetY: 10, z: 22 },
    { chipX: 80, chipY: 33, fingerOffsetX: -11, fingerOffsetY: 8, z: 22 },
    { chipX: 50, chipY: 64, fingerOffsetX: 0, fingerOffsetY: -8, z: 21 },
  ],
  8: [
    { chipX: 50, chipY: 88, fingerOffsetX: 0, fingerOffsetY: -10, z: 30 },
    { chipX: 18, chipY: 38, fingerOffsetX: 11, fingerOffsetY: 6, z: 22 },
    { chipX: 24, chipY: 18, fingerOffsetX: 10, fingerOffsetY: 10, z: 22 },
    { chipX: 42, chipY: 11, fingerOffsetX: 4, fingerOffsetY: 10, z: 22 },
    { chipX: 58, chipY: 11, fingerOffsetX: -4, fingerOffsetY: 10, z: 22 },
    { chipX: 76, chipY: 18, fingerOffsetX: -10, fingerOffsetY: 10, z: 22 },
    { chipX: 82, chipY: 38, fingerOffsetX: -11, fingerOffsetY: 6, z: 22 },
    { chipX: 50, chipY: 64, fingerOffsetX: 0, fingerOffsetY: -8, z: 21 },
  ],
};

const DESKTOP_SLOT_MAP: SlotMap = {
  2: [
    { chipX: 50, chipY: 84, fingerOffsetX: 0, fingerOffsetY: -8, z: 30 },
    { chipX: 50, chipY: 16, fingerOffsetX: 0, fingerOffsetY: 8, z: 20 },
  ],
  3: [
    { chipX: 50, chipY: 84, fingerOffsetX: 0, fingerOffsetY: -8, z: 30 },
    { chipX: 20, chipY: 24, fingerOffsetX: 8, fingerOffsetY: 6, z: 20 },
    { chipX: 80, chipY: 24, fingerOffsetX: -8, fingerOffsetY: 6, z: 20 },
  ],
  4: [
    { chipX: 50, chipY: 84, fingerOffsetX: 0, fingerOffsetY: -8, z: 30 },
    { chipX: 18, chipY: 50, fingerOffsetX: 10, fingerOffsetY: 0, z: 20 },
    { chipX: 50, chipY: 16, fingerOffsetX: 0, fingerOffsetY: 8, z: 20 },
    { chipX: 82, chipY: 50, fingerOffsetX: -10, fingerOffsetY: 0, z: 20 },
  ],
  5: [
    { chipX: 50, chipY: 84, fingerOffsetX: 0, fingerOffsetY: -8, z: 30 },
    { chipX: 18, chipY: 54, fingerOffsetX: 10, fingerOffsetY: -2, z: 21 },
    { chipX: 24, chipY: 16, fingerOffsetX: 8, fingerOffsetY: 8, z: 21 },
    { chipX: 76, chipY: 16, fingerOffsetX: -8, fingerOffsetY: 8, z: 21 },
    { chipX: 82, chipY: 54, fingerOffsetX: -10, fingerOffsetY: -2, z: 21 },
  ],
  6: [
    { chipX: 50, chipY: 84, fingerOffsetX: 0, fingerOffsetY: -8, z: 30 },
    { chipX: 16, chipY: 58, fingerOffsetX: 10, fingerOffsetY: -2, z: 21 },
    { chipX: 16, chipY: 28, fingerOffsetX: 10, fingerOffsetY: 6, z: 21 },
    { chipX: 50, chipY: 14, fingerOffsetX: 0, fingerOffsetY: 8, z: 21 },
    { chipX: 84, chipY: 28, fingerOffsetX: -10, fingerOffsetY: 6, z: 21 },
    { chipX: 84, chipY: 58, fingerOffsetX: -10, fingerOffsetY: -2, z: 21 },
  ],
  7: [
    { chipX: 50, chipY: 84, fingerOffsetX: 0, fingerOffsetY: -8, z: 30 },
    { chipX: 14, chipY: 62, fingerOffsetX: 10, fingerOffsetY: -2, z: 21 },
    { chipX: 12, chipY: 34, fingerOffsetX: 10, fingerOffsetY: 4, z: 21 },
    { chipX: 30, chipY: 14, fingerOffsetX: 8, fingerOffsetY: 8, z: 21 },
    { chipX: 70, chipY: 14, fingerOffsetX: -8, fingerOffsetY: 8, z: 21 },
    { chipX: 88, chipY: 34, fingerOffsetX: -10, fingerOffsetY: 4, z: 21 },
    { chipX: 86, chipY: 62, fingerOffsetX: -10, fingerOffsetY: -2, z: 21 },
  ],
  8: [
    { chipX: 50, chipY: 84, fingerOffsetX: 0, fingerOffsetY: -8, z: 30 },
    { chipX: 12, chipY: 65, fingerOffsetX: 10, fingerOffsetY: -3, z: 21 },
    { chipX: 10, chipY: 44, fingerOffsetX: 10, fingerOffsetY: 0, z: 21 },
    { chipX: 18, chipY: 20, fingerOffsetX: 9, fingerOffsetY: 7, z: 21 },
    { chipX: 50, chipY: 12, fingerOffsetX: 0, fingerOffsetY: 8, z: 21 },
    { chipX: 82, chipY: 20, fingerOffsetX: -9, fingerOffsetY: 7, z: 21 },
    { chipX: 90, chipY: 44, fingerOffsetX: -10, fingerOffsetY: 0, z: 21 },
    { chipX: 88, chipY: 65, fingerOffsetX: -10, fingerOffsetY: -3, z: 21 },
  ],
};

function getSeatSlots(map: SlotMap, playerCount: number): SeatSlot[] {
  const clampedCount = Math.max(2, Math.min(8, playerCount));
  return map[clampedCount] ?? map[2];
}

export function GameTable({
  players,
  myId,
  currentItem,
  timerMs,
  round,
  roundActive,
  shakeTrigger,
  clickingPlayers,
  spectatorReactions,
  onUdd,
  onSpectatorReaction,
}: GameTableProps) {
  const mobileFingerLiftPx = -4;
  const me = players.find((p) => p.id === myId);
  const isEliminated = me ? !me.active : false;
  const myIndex = players.findIndex((p) => p.id === myId);
  const orderedPlayers =
    myIndex >= 0
      ? [...players.slice(myIndex), ...players.slice(0, myIndex)]
      : players;
  const mobileSlots = getSeatSlots(MOBILE_SLOT_MAP, orderedPlayers.length);
  const desktopSlots = getSeatSlots(DESKTOP_SLOT_MAP, orderedPlayers.length);

  const tableContent = (
    <div className="relative z-10 flex h-full w-full items-center justify-center px-8 py-8 sm:px-12 sm:py-8">
      {currentItem ? (
        <div className="sm:scale-115">
          <ItemDisplay
            english={currentItem.english}
            hindi={currentItem.hindi}
            itemId={currentItem.id}
          />
        </div>
      ) : (
        <p className="text-center text-sm font-semibold tracking-widest text-slate-500 uppercase sm:text-base">
          Waiting for round...
        </p>
      )}
    </div>
  );

  return (
    <div
      className="h-full w-full overflow-hidden px-0 pb-0 pt-0 sm:px-5 sm:pb-5 sm:pt-5"
      style={{
        background:
          "radial-gradient(ellipse 80% 55% at 50% 42%, rgba(5,46,22,0.18) 0%, transparent 100%)",
      }}
    >
      <div className="mx-auto flex w-full flex-col">
        <div className="mb-2 flex items-center justify-center gap-2 text-xs sm:text-sm">
          <div
            className="rounded-full border border-emerald-500/20 px-3 py-1 text-xs font-semibold tracking-wider"
            style={{ background: "rgba(5,46,22,0.55)", color: "rgba(134,239,172,0.85)" }}
          >
            {players.filter((p) => p.active).length} active / {players.length} players
          </div>
        </div>

        <div className="relative min-h-dvh w-full sm:min-h-[540px]">
          <div className="absolute inset-x-[8%] top-[5%] bottom-[16%] z-20 pointer-events-none sm:hidden">
            {orderedPlayers.map((player, index) => {
              const slot = mobileSlots[index % mobileSlots.length];
              const isPlayerMe = player.id === myId;
              const playerReactions = spectatorReactions.filter(
                (reaction) => reaction.playerId === player.id,
              );

              return (
                <motion.div
                  key={`mobile-seat-${player.id}`}
                  className="absolute"
                  style={{
                    top: `${slot.chipY}%`,
                    left: `${slot.chipX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: slot.z ?? 20,
                  }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 340, damping: 26 }}
                >
                  <div
                    className={`pointer-events-auto rounded-2xl border backdrop-blur-md transition-all duration-300 ${
                      isPlayerMe
                        ? "min-w-[128px] border-amber-400/50 px-3 py-2 shadow-lg ring-1 ring-inset ring-amber-300/10"
                        : player.active
                          ? "min-w-[100px] border-slate-600/35 px-2.5 py-1.5 shadow-md"
                          : "min-w-[100px] border-slate-700/20 px-2.5 py-1.5 opacity-35 grayscale"
                    }`}
                    style={
                      isPlayerMe
                        ? {
                            background:
                              "linear-gradient(135deg, rgba(120,53,15,0.9) 0%, rgba(10,10,18,0.97) 100%)",
                            boxShadow:
                              "0 4px 24px rgba(245,158,11,0.18), 0 1px 0 rgba(251,191,36,0.12) inset",
                          }
                        : player.active
                          ? {
                              background:
                                "linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(5,8,18,0.97) 100%)",
                              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                            }
                          : { background: "rgba(5,8,18,0.8)" }
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <Image
                        src={getAvatarDataUri(player.avatar)}
                        alt={player.name}
                        width={isPlayerMe ? 44 : 36}
                        height={isPlayerMe ? 44 : 36}
                        className={`rounded-full ${isPlayerMe ? "border border-amber-400/40" : "border border-white/15"}`}
                        unoptimized
                      />
                      <p
                        className={`truncate font-bold text-white ${
                          isPlayerMe ? 'max-w-20 text-sm' : 'max-w-16 text-xs'
                        }`}
                      >
                        {player.name}
                      </p>
                      {isPlayerMe ? (
                        <span
                          className="rounded-full border border-amber-400/50 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-amber-300"
                          style={{ background: "rgba(180,83,9,0.3)" }}
                        >
                          ME
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 3 }).map((_, heartIndex) => (
                          <Heart
                            key={`${player.id}-mobile-heart-${heartIndex}`}
                            size={10}
                            className={
                              heartIndex < player.lives
                                ? 'heart-full'
                                : 'heart-empty'
                            }
                            fill={
                              heartIndex < player.lives
                                ? '#ef4444'
                                : 'transparent'
                            }
                            style={
                              heartIndex < player.lives
                                ? { filter: "drop-shadow(0 0 3px rgba(239,68,68,0.55))" }
                                : undefined
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-amber-300/70">
                        {player.score}
                      </span>
                    </div>
                  </div>

                  <div
                    className="pointer-events-none absolute left-1/2"
                    style={{
                      bottom: 'calc(100% + 4px)',
                      transform: `translateX(calc(-50% + ${slot.fingerOffsetX}px)) translateY(${slot.fingerOffsetY + mobileFingerLiftPx}px)`,
                    }}
                  >
                    <FingerIndicator
                      isClicking={clickingPlayers.has(player.id)}
                      size={48}
                    />
                  </div>

                  <AnimatePresence>
                    {playerReactions.map((reaction) => (
                      <motion.div
                        key={reaction.id}
                        className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 text-2xl"
                        initial={{ y: 0, opacity: 1, scale: 1 }}
                        animate={{ y: -54, opacity: 0, scale: 1.25 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      >
                        {reaction.emoji}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <div className="absolute inset-x-[8%] top-[8%] bottom-[14%] z-20 hidden pointer-events-none sm:block">
            {orderedPlayers.map((player, index) => {
              const slot = desktopSlots[index % desktopSlots.length];
              const isPlayerMe = player.id === myId;
              const playerReactions = spectatorReactions.filter(
                (reaction) => reaction.playerId === player.id,
              );

              return (
                <motion.div
                  key={`desktop-seat-${player.id}`}
                  className="absolute"
                  style={{
                    top: `${slot.chipY}%`,
                    left: `${slot.chipX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: slot.z ?? 20,
                  }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 340, damping: 26 }}
                >
                  <div
                    className={`pointer-events-auto rounded-2xl border backdrop-blur-md transition-all duration-300 ${
                      isPlayerMe
                        ? "min-w-[114px] border-amber-400/50 px-3 py-2 shadow-lg ring-1 ring-inset ring-amber-300/10"
                        : player.active
                          ? "min-w-[92px] border-slate-600/35 px-2 py-1.5 shadow-md"
                          : "min-w-[92px] border-slate-700/20 px-2 py-1.5 opacity-35 grayscale"
                    }`}
                    style={
                      isPlayerMe
                        ? {
                            background:
                              "linear-gradient(135deg, rgba(120,53,15,0.9) 0%, rgba(10,10,18,0.97) 100%)",
                            boxShadow:
                              "0 4px 24px rgba(245,158,11,0.18), 0 1px 0 rgba(251,191,36,0.12) inset",
                          }
                        : player.active
                          ? {
                              background:
                                "linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(5,8,18,0.97) 100%)",
                              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                            }
                          : { background: "rgba(5,8,18,0.8)" }
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <Image
                        src={getAvatarDataUri(player.avatar)}
                        alt={player.name}
                        width={isPlayerMe ? 40 : 32}
                        height={isPlayerMe ? 40 : 32}
                        className={`rounded-full ${isPlayerMe ? "border border-amber-400/40" : "border border-white/15"}`}
                        unoptimized
                      />
                      <p
                        className={`truncate font-bold text-white ${
                          isPlayerMe
                            ? 'max-w-20 text-xs sm:text-sm'
                            : 'max-w-16 text-[10px] sm:text-xs'
                        }`}
                      >
                        {player.name}
                      </p>
                      {isPlayerMe ? (
                        <span
                          className="rounded-full border border-amber-400/50 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-amber-300"
                          style={{ background: "rgba(180,83,9,0.3)" }}
                        >
                          ME
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 3 }).map((_, heartIndex) => (
                          <Heart
                            key={`${player.id}-desktop-heart-${heartIndex}`}
                            size={10}
                            className={
                              heartIndex < player.lives
                                ? 'heart-full'
                                : 'heart-empty'
                            }
                            fill={
                              heartIndex < player.lives
                                ? '#ef4444'
                                : 'transparent'
                            }
                            style={
                              heartIndex < player.lives
                                ? { filter: "drop-shadow(0 0 3px rgba(239,68,68,0.55))" }
                                : undefined
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-amber-300/70">
                        {player.score}
                      </span>
                    </div>
                  </div>

                  <div
                    className="pointer-events-none absolute left-1/2"
                    style={{
                      bottom: 'calc(100% + 6px)',
                      transform: `translateX(calc(-50% + ${slot.fingerOffsetX}px)) translateY(${slot.fingerOffsetY}px)`,
                    }}
                  >
                    <FingerIndicator
                      isClicking={clickingPlayers.has(player.id)}
                      size={52}
                    />
                  </div>

                  <AnimatePresence>
                    {playerReactions.map((reaction) => (
                      <motion.div
                        key={reaction.id}
                        className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 text-2xl"
                        initial={{ y: 0, opacity: 1, scale: 1 }}
                        animate={{ y: -54, opacity: 0, scale: 1.25 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      >
                        {reaction.emoji}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <div className="absolute inset-0 flex items-center justify-center sm:hidden">
            <TableShell
              shape="rectangle"
              shakeTrigger={shakeTrigger}
              rotateAsset
              className="h-dvh w-screen max-h-dvh max-w-none min-h-dvh min-w-screen"
            >
              {tableContent}
            </TableShell>
          </div>

          <div className="absolute inset-0 hidden items-center justify-center sm:flex">
            <TableShell
              shape="rectangle"
              shakeTrigger={shakeTrigger}
              className="h-[45vw] w-[80vw] max-h-[520px] max-w-[1100px] min-h-[290px] min-w-[560px]"
            >
              {tableContent}
            </TableShell>
          </div>
        </div>

        {!isEliminated ? (
          <div className="mx-auto w-full max-w-sm">
            <UddButton
              onUdd={onUdd}
              disabled={!roundActive}
              timerMs={timerMs}
              round={round}
              isActive={roundActive}
            />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-sm rounded-2xl border border-white/8 bg-black/30 p-4 text-center backdrop-blur-md">
            <p className="text-sm text-slate-300">
              You&apos;re eliminated. Cheer from the sidelines.
            </p>
            <div className="mt-2 flex justify-center gap-2">
              {['😂', '😮', '👏', '😱'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSpectatorReaction(emoji)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-lg transition hover:scale-110 active:scale-95"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Winner overlay
export function WinnerScreen({
  winnerName,
  winnerAvatar,
  myScore,
  totalUddItems,
  onPlayAgain,
  onLeaderboard,
}: {
  winnerName: string;
  winnerAvatar: string | null;
  myScore?: number;
  totalUddItems?: number;
  onPlayAgain: () => void;
  onLeaderboard: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-full max-w-sm mx-4"
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 18 }}
      >
        <Card className="glass-strong border-white/10 shadow-2xl bg-transparent sm:bg-card/50">
          <CardContent className="p-10 text-center">
            {winnerAvatar && (
              <Image
                src={getAvatarDataUri(winnerAvatar)}
                alt={winnerName}
                width={100}
                height={100}
                className="rounded-full mx-auto mb-5 border-4 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                unoptimized
              />
            )}
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-3xl font-black text-white mb-1">
              {winnerName} Wins!
            </h2>
            <p className="text-slate-400 mb-8 text-sm">Last one standing</p>

            {typeof myScore === 'number' ||
            typeof totalUddItems === 'number' ? (
              <div className="mb-6 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-left">
                <div className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Winner
                  </p>
                  <p className="text-sm font-black text-amber-200">
                    {winnerName}
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Score
                  </p>
                  <p className="text-2xl font-black text-amber-300">
                    {myScore ?? 0}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Total UDD Items
                  </p>
                  <p className="text-xl font-black text-white">
                    {totalUddItems ?? 0}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  id="multiplayer-play-again-btn"
                  size="lg"
                  className="w-full h-14 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-lg transition-all shadow-lg shadow-amber-500/20"
                  onClick={onPlayAgain}
                >
                  <RotateCcw size={18} className="mr-2" />
                  Play Again
                </Button>
              </motion.div>
              <Button
                variant="ghost"
                className="w-full h-12 text-slate-400 hover:text-white text-sm hover:bg-white/5"
                onClick={onLeaderboard}
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
  );
}
