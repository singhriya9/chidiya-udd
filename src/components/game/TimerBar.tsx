'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface TimerBarProps {
  timerMs: number;
  round: number;
  isActive: boolean;
}

export function TimerBar({ timerMs, round, isActive }: TimerBarProps) {
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = performance.now();
    }
  }, [isActive, round]);

  return (
    <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            key={round}
            className="h-full rounded-full relative overflow-hidden"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: timerMs / 1000, ease: 'linear' }}
            style={{
              background: 'linear-gradient(90deg, #22c55e 0%, #eab308 50%, #ef4444 100%)',
              backgroundSize: '300% 100%',
            }}
          >
            {/* Animated shimmer */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
