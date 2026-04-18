'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface LivesDisplayProps {
  lives: number;
  maxLives: number;
}

export function LivesDisplay({ lives, maxLives }: LivesDisplayProps) {
  const [showFlash, setShowFlash] = useState(false);
  const prevLivesRef = useRef(lives);

  useEffect(() => {
    if (lives < prevLivesRef.current) {
      // Life was lost
      setShowFlash(true);
      navigator.vibrate?.([100, 50, 100]);
      setTimeout(() => setShowFlash(false), 600);
    }
    prevLivesRef.current = lives;
  }, [lives]);

  return (
    <>
      {/* Full-screen red flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0, transition: { duration: 0.45 } }}
            transition={{ duration: 0.15 }}
            style={{ background: 'radial-gradient(ellipse at center, #ef4444 0%, #dc2626 100%)' }}
          />
        )}
      </AnimatePresence>

      {/* Heart row */}
      <div
        className="flex items-center gap-2"
        aria-label={`${lives} lives remaining`}
        role="status"
      >
        {Array.from({ length: maxLives }).map((_, i) => {
          const alive = i < lives;
          return (
            <motion.div
              key={i}
              animate={alive ? { scale: 1 } : { scale: 0.75 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Heart
                size={24}
                className={alive ? 'heart-full' : 'heart-empty'}
                fill={alive ? '#ef4444' : 'transparent'}
              />
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
