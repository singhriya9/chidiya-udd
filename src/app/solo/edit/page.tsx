'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowLeft, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { ItemDisplay } from '@/components/game/ItemDisplay';
import { UddButton } from '@/components/game/UddButton';
import { LivesDisplay } from '@/components/game/LivesDisplay';
import { TableShell } from '@/components/game/TableShell';
import { FingerIndicator } from '@/components/game/FingerIndicator';
import { CreditLinks } from '@/components/shared/SiteFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StateSwitcher } from '@/components/game-preview/StateSwitcher';
import { soloPreviewStates } from '@/components/game-preview/fixtures';
import { usePlayerStore } from '@/store/usePlayerStore';
import { getAvatarDataUri } from '@/lib/avatar';

export default function SoloEditPage() {
  const [activeStateId, setActiveStateId] = useState(
    soloPreviewStates[0]?.id ?? '',
  );
  const avatarSeed = usePlayerStore((state) => state.avatarSeed);
  const [gateSoundOn, setGateSoundOn] = useState(true);
  const [gateDismissed, setGateDismissed] = useState(false);

  const selectedState = useMemo(
    () =>
      soloPreviewStates.find((state) => state.id === activeStateId) ??
      soloPreviewStates[0],
    [activeStateId],
  );

  if (!selectedState) {
    return null;
  }

  useEffect(() => {
    setGateSoundOn(selectedState.startWithSound);
    setGateDismissed(false);
  }, [selectedState.id, selectedState.startWithSound]);

  const showAudioGate = selectedState.showAudioGate && !gateDismissed;
  const previewAudioEnabled = showAudioGate
    ? gateSoundOn
    : selectedState.audioEnabled;
  const meAvatarSeed = avatarSeed || 'preview-me';

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e1a] overflow-hidden">
      <div className="px-4 pt-4 sm:px-6">
        <StateSwitcher
          title="Solo Edit States"
          options={soloPreviewStates.map((state) => ({
            id: state.id,
            label: state.label,
          }))}
          activeId={selectedState.id}
          onChange={setActiveStateId}
        />
      </div>

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
                    onClick={() => setGateSoundOn((value) => !value)}
                    className="mx-auto mb-4 h-20! w-20! rounded-full border border-white/15 hover:bg-white/10 [&_svg]:size-12!"
                    title={gateSoundOn ? 'Disable audio' : 'Allow audio'}
                  >
                    {gateSoundOn ? (
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
                    {gateSoundOn ? 'Audio Enabled' : 'Audio Disabled'}
                  </h2>
                  <p className="text-slate-400 text-sm mb-2">
                    Click {gateSoundOn ? 'Disable Audio' : 'Allow Audio'} if
                    needed, then tap play.
                  </p>
                  <p className="text-slate-500 text-xs mb-6">
                    Solo edit preview. No game logic or network calls are
                    active.
                  </p>
                  {selectedState.audioGateError ? (
                    <p className="text-red-400 text-sm mb-4">
                      {selectedState.audioGateError}
                    </p>
                  ) : null}
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Button
                      size="lg"
                      className="w-full h-16 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xl transition-all shadow-lg shadow-amber-500/20"
                      onClick={() => setGateDismissed(true)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Image
                          src="/logo.svg"
                          alt="Chidiya Udd logo"
                          width={30}
                          height={30}
                        />
                        Tap to Play!
                      </span>
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedState.gameOver && (
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
                        {selectedState.score}
                      </div>
                      <div className="text-slate-400 text-xs uppercase tracking-widest">
                        Score
                      </div>
                    </div>
                    <div className="mx-auto my-3 h-px w-full max-w-[180px] bg-white/10" />
                    <div className="text-center">
                      <div className="text-3xl font-black text-white">
                        {selectedState.round}
                      </div>
                      <div className="text-slate-400 text-xs uppercase tracking-widest">
                        Total UDD Items
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button
                        size="lg"
                        className="w-full h-14 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-lg transition-all shadow-lg shadow-amber-500/20"
                      >
                        <RotateCcw size={18} className="mr-2" />
                        Play Again
                      </Button>
                    </motion.div>
                    <Button
                      variant="ghost"
                      className="w-full h-12 text-slate-400 hover:text-white text-sm hover:bg-white/5"
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

      <div className="flex items-center justify-between px-4 pt-4 z-10">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl h-12! w-12! [&_svg]:size-7!"
            title="Preview back button"
          >
            <ArrowLeft className="size-7!" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl h-12! w-12! [&_svg]:size-7!"
            title={selectedState.muted ? 'Unmute' : 'Mute'}
          >
            {selectedState.muted ? (
              <VolumeX className="size-7!" />
            ) : (
              <Volume2 className="size-7!" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-6">
          {selectedState.activePackId ? (
            <div className="text-center">
              <div className="text-xs text-slate-500 uppercase tracking-widest">
                Pack
              </div>
              <div className="text-sm font-black text-slate-200">
                {selectedState.activePackId.toUpperCase()}
              </div>
            </div>
          ) : null}
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-widest">
              Score
            </div>
            <div className="text-2xl font-black" style={{ color: '#f59e0b' }}>
              {selectedState.score}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-3 pb-3 pt-2 sm:px-5 sm:pt-4">
        <div className="relative w-full max-w-[540px]">
          <div className="absolute left-1/2 top-0 z-20 flex items-center gap-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-sm font-bold tracking-wide text-slate-100 backdrop-blur">
            <Image
              src={getAvatarDataUri(meAvatarSeed)}
              alt="Your avatar"
              width={50}
              height={50}
              className="rounded-full border border-white/20"
              unoptimized
            />
            YOU
          </div>
          <div className="absolute right-3 top-3 z-20 rounded-xl border border-white/15 bg-black/45 px-2.5 py-1.5 backdrop-blur">
            <LivesDisplay
              lives={selectedState.lives}
              maxLives={selectedState.maxLives}
            />
          </div>
          <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2">
            <FingerIndicator isClicking={selectedState.isFingerUp} size={126} />
          </div>

          <TableShell
            shape="circle"
            shakeTrigger={selectedState.shakeTrigger}
            className="mx-auto w-[94vw] max-w-[520px] min-w-[280px]"
          >
            <div className="flex h-full w-full items-center justify-center px-7 py-10 sm:px-10">
              {selectedState.currentItem ? (
                <ItemDisplay
                  english={selectedState.currentItem.english}
                  hindi={selectedState.currentItem.hindi}
                  itemId={selectedState.currentItem.id}
                />
              ) : (
                <div className="text-center text-slate-500">
                  <p className="text-xl font-bold">
                    {previewAudioEnabled ? 'Get Ready...' : ''}
                  </p>
                </div>
              )}
            </div>
          </TableShell>
        </div>
      </div>

      <div className="px-4 pb-5 pt-2 sm:px-6 sm:pb-8 sm:pt-4">
        <UddButton
          onUdd={() => {}}
          disabled={!selectedState.roundActive || selectedState.gameOver}
          timerMs={selectedState.timerMs}
          round={selectedState.round}
          isActive={selectedState.roundActive}
        />
      </div>
    </div>
  );
}
