'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ItemDisplayProps {
  english: string;
  hindi: string;
  itemId: string;
}

export function ItemDisplay({ english, hindi, itemId }: ItemDisplayProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={itemId}
        className="text-center select-none"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* English name */}
        <motion.h2
          className="text-5xl md:text-6xl font-black tracking-tight text-white leading-none"
          style={{ fontFamily: 'Outfit, sans-serif', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
        >
          {english}
        </motion.h2>

        {/* Hindi name */}
        <motion.p
          className="text-xl md:text-2xl font-semibold mt-2 opacity-70"
          style={{ color: '#fbbf24', letterSpacing: '0.02em' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.12 }}
        >
          {hindi}
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}
