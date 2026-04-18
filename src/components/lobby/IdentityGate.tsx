'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useState } from 'react';
import { Mail, User, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { lookupPlayerByEmail, registerPlayer } from '@/app/actions/player';
import { getAvatarDataUri } from '@/lib/avatar';
import Image from 'next/image';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SiteFooter } from '@/components/shared/SiteFooter';

type Step = 'email' | 'register';

interface IdentityGateProps {
  onComplete?: () => void;
}

export function IdentityGate({ onComplete }: IdentityGateProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(() =>
    Math.random().toString(36).slice(2),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setPlayer } = usePlayerStore();

  const regenerateAvatar = () => {
    setAvatarSeed(Math.random().toString(36).slice(2));
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const existing = await lookupPlayerByEmail(email.toLowerCase().trim());
      if (existing) {
        setPlayer({
          name: existing.name,
          email: existing.email,
          avatarSeed: existing.avatar,
        });
        onComplete?.();
      } else {
        setStep('register');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const player = await registerPlayer({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        avatar: avatarSeed,
      });
      setPlayer({
        name: player.name,
        email: player.email,
        avatarSeed: player.avatar,
      });
      onComplete?.();
    } catch {
      setError('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 32, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', damping: 22, stiffness: 280 },
    },
    exit: { opacity: 0, y: -24, scale: 0.96, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{
            background:
              'radial-gradient(ellipse, rgba(245,158,11,0.08) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-3 flex justify-center">
            <div className="rounded-full bg-white/85 p-2 shadow-[0_0_28px_rgba(255,255,255,0.35)] backdrop-blur-sm">
              <Image
                src="/logo.svg"
                alt="Chidiya Udd logo"
                width={60}
                height={60}
              />
            </div>
          </div>
          <h1
            className="text-5xl font-black text-glow-amber"
            style={{ color: '#f59e0b' }}
          >
            चिड़िया उड़
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium tracking-wide uppercase">
            Chidiya Udd — Real-time Reaction Game
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="email-step"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="glass-strong border-white/10 shadow-xl overflow-hidden bg-transparent sm:bg-card/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-white">
                    Welcome
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-base">
                    Enter your email to continue — no password needed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEmailSubmit} className="space-y-5">
                    <div className="relative group">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors"
                        size={18}
                      />
                      <Input
                        id="email-input"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 pl-12 bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 rounded-xl"
                        autoComplete="email"
                        required
                      />
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-red-400 text-sm font-medium"
                      >
                        {error}
                      </motion.p>
                    )}

                    <Button
                      id="email-submit-btn"
                      type="submit"
                      disabled={loading}
                      size="lg"
                      className="w-full h-14 rounded-xl text-base font-bold bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                    >
                      {loading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          Continue <ArrowRight size={18} className="ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="register-step"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="glass-strong border-white/10 shadow-xl overflow-hidden bg-transparent sm:bg-card/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-white">
                    Create Your Profile
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-base">
                    You're new here! Pick a name and avatar.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Avatar preview */}
                  <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="relative">
                      <Image
                        src={getAvatarDataUri(avatarSeed)}
                        alt="Your avatar"
                        width={64}
                        height={64}
                        className="rounded-full border-2 border-amber-400 bg-amber-950/30"
                        unoptimized
                      />
                      <Button
                        type="button"
                        id="regenerate-avatar-btn"
                        size="icon"
                        variant="secondary"
                        onClick={regenerateAvatar}
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-amber-500 text-black hover:bg-amber-400 shadow-md p-0"
                        title="New avatar"
                      >
                        <motion.div
                          whileTap={{ rotate: 180 }}
                          transition={{ duration: 0.3 }}
                        >
                          <RefreshCw size={14} />
                        </motion.div>
                      </Button>
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg leading-tight">
                        {name || 'Your Name'}
                      </p>
                      <p className="text-slate-400 text-sm">{email}</p>
                    </div>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="relative group">
                      <User
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors"
                        size={18}
                      />
                      <Input
                        id="name-input"
                        type="text"
                        placeholder="Display name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-14 pl-12 bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 rounded-xl"
                        maxLength={24}
                        required
                      />
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-red-400 text-sm font-medium"
                      >
                        {error}
                      </motion.p>
                    )}

                    <Button
                      id="register-submit-btn"
                      type="submit"
                      disabled={loading}
                      size="lg"
                      className="w-full h-14 rounded-xl text-base font-bold bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                    >
                      {loading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>Let's Play! 🎮</>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setStep('email');
                        setError('');
                      }}
                      className="w-full text-slate-400 hover:text-white mt-2 rounded-xl"
                    >
                      ← Use different email
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SiteFooter className="fixed bottom-0 left-0 right-0 px-4 pb-2" />
    </div>
  );
}
