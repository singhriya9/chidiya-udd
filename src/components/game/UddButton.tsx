'use client';

import { motion } from 'framer-motion';
import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface UddButtonProps {
  onUdd: () => void;
  disabled?: boolean;
  timerMs?: number;
  round?: number;
  isActive?: boolean;
}

export function UddButton({
  onUdd,
  disabled = false,
  timerMs = 3000,
  round = 0,
  isActive = false,
}: UddButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLockedRef = useRef(false);

  const handlePress = useCallback(() => {
    if (disabled || isLockedRef.current) return;

    isLockedRef.current = true;
    setIsPressed(true);

    // Haptic feedback
    navigator.vibrate?.([50]);

    onUdd();

    // Debounce — prevent spam
    debounceRef.current = setTimeout(() => {
      isLockedRef.current = false;
      setIsPressed(false);
    }, 650);
  }, [disabled, onUdd]);

  const showTimer = isActive && !disabled;

  return (
    <motion.div
      className="w-full max-w-sm mx-auto"
      whileTap={disabled || isPressed ? {} : { scale: 0.93 }}
      whileHover={disabled || isPressed ? {} : { scale: 1.02 }}
    >
      <Button
        id="udd-button"
        aria-label="UDD! — tap if the item flies"
        className="udd-button relative isolate w-full h-24 overflow-hidden rounded-2xl font-black text-white text-4xl tracking-widest p-0 border-0 shadow-xl"
        onPointerDown={handlePress}
        disabled={disabled || isPressed}
      >
        <motion.div
          key={`${round}-${timerMs}-overlay`}
          className="absolute inset-y-0 right-0 z-0 bg-black/45"
          initial={{ width: '0%' }}
          animate={{ width: showTimer ? '100%' : '0%' }}
          transition={{
            duration: showTimer ? timerMs / 1000 : 0,
            ease: 'linear',
          }}
        />
        <motion.div
          key={`${round}-${timerMs}-pulse`}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0.22 }}
          animate={{ opacity: showTimer ? [0.16, 0.3, 0.16] : 0.16 }}
          transition={{ duration: 1.1, repeat: showTimer ? Infinity : 0 }}
          style={{
            background:
              'linear-gradient(120deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 52%, rgba(0,0,0,0.16) 100%)',
          }}
        />
        <div className="absolute inset-0 z-0 rounded-2xl border border-white/15" />
        <motion.span
          className="relative z-10 inline-flex items-center gap-2"
          animate={isPressed ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          UDD!
          <Image
            src="/logo.svg"
            alt="Chidiya Udd logo"
            width={42}
            height={42}
          />
        </motion.span>
      </Button>
    </motion.div>
  );
}
