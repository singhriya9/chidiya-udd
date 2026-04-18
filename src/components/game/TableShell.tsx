'use client';

import { motion } from 'framer-motion';
import { ReactNode, useEffect, useRef } from 'react';
import { TableSurfaceSVG } from './TableSurfaceSVG';

type PatternVariant = 'wood' | 'felt' | 'flat';
type ShadowVariant = 'none' | 'soft' | 'strong';

interface TableShellProps {
  shape: 'circle' | 'rectangle';
  shakeTrigger: number;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  rotateAsset?: boolean;
  cornerRadius?: number;
  patternVariant?: PatternVariant;
  shadowVariant?: ShadowVariant;
  textureOpacity?: number;
}

export function TableShell({
  shape,
  shakeTrigger,
  children,
  className = '',
  style,
  rotateAsset = false,
  cornerRadius,
  patternVariant = 'wood',
  shadowVariant = 'soft',
  textureOpacity = 0.22,
}: TableShellProps) {
  const prevTriggerRef = useRef(shakeTrigger);
  const shouldAnimate = shakeTrigger !== prevTriggerRef.current;

  useEffect(() => {
    prevTriggerRef.current = shakeTrigger;
  }, [shakeTrigger]);

  const shapeClass =
    shape === 'circle' ? 'rounded-full aspect-square' : 'rounded-3xl';

  return (
    <motion.div
      className={`relative flex items-center justify-center ${shapeClass} ${className}`}
      style={style}
      key={shakeTrigger}
      animate={
        shouldAnimate ? { x: [-8, 8, -7, 7, -5, 5, -3, 3, -1, 1, 0] } : {}
      }
      transition={{ duration: 0.45, ease: 'easeInOut' }}
    >
      <TableSurfaceSVG
        shape={shape}
        rotate={rotateAsset}
        cornerRadius={cornerRadius}
        patternVariant={patternVariant}
        shadowVariant={shadowVariant}
        textureOpacity={textureOpacity}
      />
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {children}
      </div>
    </motion.div>
  );
}
