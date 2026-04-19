'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { getAvatarDataUri } from '@/lib/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Player {
  id: string;
  name: string;
  email: string;
  avatar: string;
  totalCorrect: number | null;
  gamesPlayed: number | null;
  rankScore: number | null;
}

interface LeaderboardTableProps {
  players: Player[];
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardTable({ players }: LeaderboardTableProps) {
  if (players.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="mb-4 flex justify-center">
          <Image
            src="/logo.svg"
            alt="Chidiya Udd logo"
            width={40}
            height={40}
          />
        </div>
        <p className="text-slate-400 font-medium">No players yet.</p>
        <p className="text-slate-600 text-sm mt-1">
          Play a game to appear here!
        </p>
      </div>
    );
  }

  return (
    <Card className="glass-strong border-white/10 bg-transparent sm:bg-card/50 shadow-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/10 hover:bg-transparent">
            <TableHead className="w-16 text-center text-xs tracking-widest text-slate-500">
              #
            </TableHead>
            <TableHead className="text-xs uppercase tracking-widest text-slate-500">
              Player
            </TableHead>
            <TableHead className="text-center text-xs uppercase tracking-widest text-slate-500">
              Rating
            </TableHead>
            <TableHead className="text-center text-xs uppercase tracking-widest text-slate-500">
              Games
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child]:border-0">
          {players.map((player, i) => {
            const rating = player.rankScore
              ? Number(player.rankScore).toFixed(1)
              : '0.0';

            return (
              <motion.tr
                key={player.id}
                className="border-b border-white/4 transition-colors hover:bg-black/20"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.04,
                  type: 'spring',
                  stiffness: 260,
                  damping: 24,
                }}
              >
                {/* Rank */}
                <TableCell className="text-center">
                  {i < 3 ? (
                    <span className="text-xl">{MEDALS[i]}</span>
                  ) : (
                    <span className="text-slate-500 font-mono font-medium">
                      {i + 1}
                    </span>
                  )}
                </TableCell>

                {/* Player info */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Image
                      src={getAvatarDataUri(player.avatar)}
                      alt={player.name}
                      width={44}
                      height={44}
                      className="rounded-full shadow-md border border-white/5"
                      unoptimized
                    />
                    <div className="min-w-0">
                      <p className="text-white font-bold text-lg leading-tight truncate">
                        {player.name}
                      </p>
                      <p className="text-slate-500 text-xs truncate font-medium">
                        {player.totalCorrect ?? 0} total correct guesses
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Rating */}
                <TableCell className="text-center align-middle">
                  <span
                    className="text-xl font-black drop-shadow-md"
                    style={{ color: i === 0 ? '#f59e0b' : '#f1f5f9' }}
                  >
                    {rating}
                  </span>
                </TableCell>

                {/* Games */}
                <TableCell className="text-center align-middle">
                  <span className="text-slate-400 font-bold">
                    {player.gamesPlayed ?? 0}
                  </span>
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
