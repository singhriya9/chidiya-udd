'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface FingerIndicatorProps {
  isClicking: boolean;
  size?: number;
}

export function FingerIndicator({ isClicking, size = 32 }: FingerIndicatorProps) {
  const arcRestDeg = 60;
  const arcTapDeg = 140;

  return (
    <div style={{ display: 'inline-flex', userSelect: 'none' }} className="relative">
      <motion.span
        className="pointer-events-none absolute left-1/2 top-0 rounded-full"
        style={{
          width: size * 0.72,
          height: size * 0.72,
          transform: 'translate(-50%, -10%)',
          background:
            'radial-gradient(circle, rgba(251,191,36,0.75) 0%, rgba(59,130,246,0.45) 45%, rgba(0,0,0,0) 80%)',
        }}
        animate={
          isClicking
            ? { opacity: [0, 0.75, 0], scale: [0.75, 1.45, 1.8] }
            : { opacity: 0, scale: 0.7 }
        }
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />
      <motion.div
        style={{
          width: size,
          height: size,
          transformOrigin: '50% 100%',
        }}
        animate={
          isClicking
            ? { rotate: [arcRestDeg, arcTapDeg, arcRestDeg] }
            : { rotate: arcRestDeg }
        }
        transition={
          isClicking
            ? { duration: 0.32, ease: 'easeInOut' }
            : { duration: 0.2, ease: 'easeOut' }
        }
      >
        <Image src="/finger.svg" alt="Finger indicator" width={size} height={size} />
      </motion.div>
    </div>
  );
}
