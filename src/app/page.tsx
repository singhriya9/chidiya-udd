'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { customAlphabet } from 'nanoid';
import {
  Play,
  Plus,
  Users,
  Trophy,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { IdentityGate } from '@/components/lobby/IdentityGate';
import { getAvatarDataUri } from '@/lib/avatar';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SiteFooter } from '@/components/shared/SiteFooter';

export default function HomePage() {
  const ROOM_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const createRoomCode = customAlphabet(ROOM_CODE_ALPHABET, 6);

  const { isLoggedIn, name, email, avatarSeed, clearPlayer } = usePlayerStore();
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn || typeof window === 'undefined') return;
    const redirectPath = new URLSearchParams(window.location.search).get(
      'redirect',
    );
    if (!redirectPath || !redirectPath.startsWith('/room/')) return;
    router.replace(redirectPath);
  }, [isLoggedIn, router]);

  const handleCreateRoom = useCallback(() => {
    const code = createRoomCode();
    router.push(`/room/${code}`);
  }, [router, createRoomCode]);

  const handleJoinRoom = useCallback(() => {
    const sanitized = joinCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (sanitized.length >= 4) {
      router.push(`/room/${sanitized}`);
    }
  }, [joinCode, router]);

  if (!isLoggedIn) {
    return <IdentityGate />;
  }

  const buttonVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        type: 'spring',
        stiffness: 260,
        damping: 20,
      },
    }),
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse, #f59e0b 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(ellipse, #3b82f6 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Player badge top-right */}
      <motion.div
        className="fixed top-4 right-4 flex items-center gap-2 glass rounded-full px-3 py-2 z-10"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Image
          src={getAvatarDataUri(avatarSeed)}
          alt={name}
          width={28}
          height={28}
          className="rounded-full"
          unoptimized
        />
        <span className="text-sm font-semibold text-white">{name}</span>
        <button
          onClick={() => clearPlayer()}
          className="text-slate-400 hover:text-red-400 transition-colors ml-1"
          title="Sign out"
        >
          <LogOut size={14} />
        </button>
      </motion.div>

      {/* Game Logo */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-4 flex justify-center"
        >
          <div className="rounded-full bg-yellow-200/85 p-3 shadow-[0_0_36px_rgba(255,255,255,0.35)] backdrop-blur-sm">
            <Image
              src="/logo.svg"
              alt="Chidiya Udd logo"
              width={96}
              height={96}
              priority
            />
          </div>
        </motion.div>
        <h1
          className="text-6xl md:text-7xl font-black tracking-tight text-glow-amber"
          style={{ color: '#f59e0b' }}
        >
          चिड़िया उड़
        </h1>
        <p className="text-slate-300 mt-3 text-lg font-medium">
          Welcome back, <span style={{ color: '#fbbf24' }}>{name}</span>!
        </p>
        <p className="text-slate-500 text-sm mt-1">{email}</p>
      </motion.div>

      {/* Action buttons */}
      <div className="w-full max-w-sm space-y-4">
        {/* Play Solo */}
        <motion.div
          custom={0}
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            id="play-solo-btn"
            size="lg"
            className="w-full h-16 flex items-center justify-between px-6 rounded-2xl shadow-[0_8px_32px_rgba(245,158,11,0.35)]"
            onClick={() => router.push('/solo')}
          >
            <div className="flex items-center gap-3 text-lg font-bold">
              <Play size={20} fill="currentColor" />
              <span>Play Solo</span>
            </div>
            <ChevronRight size={20} />
          </Button>
        </motion.div>

        {/* Create Room */}
        <motion.div
          custom={1}
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            id="create-room-btn"
            variant="secondary"
            size="lg"
            className="w-full h-16 flex items-center justify-between px-6 rounded-2xl border border-white/10 glass-strong text-white hover:bg-white/10"
            onClick={handleCreateRoom}
          >
            <div className="flex items-center gap-3 text-lg font-bold">
              <Plus size={20} />
              <span>Create Room</span>
            </div>
            <ChevronRight size={20} />
          </Button>
        </motion.div>

        {/* Join Room */}
        <motion.div
          custom={2}
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          className="w-full"
        >
          <AnimatePresence mode="wait">
            {!showJoinInput ? (
              <motion.div
                key="join-btn"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Button
                  id="join-room-btn"
                  variant="secondary"
                  size="lg"
                  className="w-full h-16 flex items-center justify-between px-6 rounded-2xl border border-white/10 glass-strong text-white hover:bg-white/10"
                  onClick={() => setShowJoinInput(true)}
                >
                  <div className="flex items-center gap-3 text-lg font-bold">
                    <Users size={20} />
                    <span>Join Room</span>
                  </div>
                  <ChevronRight size={20} />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="join-input"
                className="glass-strong rounded-2xl p-4 flex gap-3 shadow-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Input
                  id="room-code-input"
                  type="text"
                  placeholder="Room code"
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                    )
                  }
                  maxLength={8}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  className="flex-1 h-12 bg-black/20 border-white/10 text-white placeholder:text-slate-500 font-mono text-center tracking-widest uppercase focus-visible:ring-amber-500 rounded-xl"
                  autoFocus
                />
                <Button
                  id="join-room-submit-btn"
                  onClick={handleJoinRoom}
                  className="h-12 px-6 rounded-xl font-bold bg-amber-500 text-black hover:bg-amber-400"
                >
                  Join
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowJoinInput(false);
                    setJoinCode('');
                  }}
                  className="h-12 w-12 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X size={20} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          custom={3}
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            id="leaderboard-btn"
            variant="outline"
            size="lg"
            className="w-full h-16 flex items-center justify-between px-6 rounded-2xl border border-white/5 bg-transparent hover:bg-white/5 hover:text-white text-slate-300"
            onClick={() => router.push('/leaderboard')}
          >
            <div className="flex items-center gap-3 text-lg font-bold">
              <Trophy size={20} style={{ color: '#f59e0b' }} />
              <span>Leaderboard</span>
            </div>
            <ChevronRight size={20} />
          </Button>
        </motion.div>
      </div>

      <SiteFooter className="fixed bottom-0 left-0 right-0 px-4 pb-2" />
    </div>
  );
}
