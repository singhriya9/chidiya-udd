'use client';

import { useId } from 'react';

type PatternVariant = 'wood' | 'felt' | 'flat';
type ShadowVariant = 'none' | 'soft' | 'strong';

interface TableSurfaceSVGProps {
  shape: 'circle' | 'rectangle';
  rotate?: boolean;
  cornerRadius?: number;
  patternVariant?: PatternVariant;
  shadowVariant?: ShadowVariant;
  textureOpacity?: number;
  className?: string;
}

export function TableSurfaceSVG({
  shape,
  rotate = false,
  cornerRadius = 56,
  patternVariant = 'wood',
  shadowVariant = 'soft',
  textureOpacity = 0.25, // Slightly bumped default for the new texture
  className = '',
}: TableSurfaceSVGProps) {
  const rawId = useId();
  const id = rawId.replace(/:/g, '-');

  const isCircle = shape === 'circle';
  const isVertical = shape === 'rectangle' && rotate;

  // ViewBox dynamically updates for native vertical layout
  const viewBox = isCircle
    ? '0 0 1000 1000'
    : isVertical
      ? '0 0 760 1400'
      : '0 0 1400 760';

  const ringOpacity = patternVariant === 'flat' ? 0.12 : 0.2;

  const shadowFilterId = `${id}-shadow`;
  const textureFilterId = `${id}-texture`;
  const surfaceGradientId = `${id}-surface-gradient`;
  const rimGradientId = `${id}-rim-gradient`;
  const innerGlowId = `${id}-inner-glow`;
  const clipId = `${id}-clip`;

  const shadowStrength =
    shadowVariant === 'strong'
      ? { dy: 14, stdDeviation: 12, opacity: 0.42 }
      : { dy: 8, stdDeviation: 8, opacity: 0.3 };

  const woodPalette =
    patternVariant === 'felt'
      ? { top: '#0f3d2d', mid: '#124832', low: '#0a2a1f', rim: '#072117' }
      : patternVariant === 'flat'
        ? { top: '#4b5563', mid: '#374151', low: '#1f2937', rim: '#111827' }
        : { top: '#c88b4f', mid: '#a76a35', low: '#7a4a22', rim: '#5f3719' };

  const safeTextureOpacity = Math.min(Math.max(textureOpacity, 0), 1);

  // Geometry variables
  const rectBase = isVertical
    ? { x: 90, y: 110, w: 580, h: 1180 }
    : { x: 110, y: 90, w: 1180, h: 580 };

  const textureBase = isCircle ? { x: 70, y: 70, w: 860, h: 860 } : rectBase;

  // Wood Grain settings based on rotation (grain follows the long edge)
  const grainFreq = isVertical ? '0.15 0.005' : '0.005 0.15';
  const warpScale = isVertical ? '25' : '45';

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={isVertical ? 'xMidYMid slice' : 'xMidYMid meet'}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <linearGradient
          id={surfaceGradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={woodPalette.top} />
          <stop offset="50%" stopColor={woodPalette.mid} />
          <stop offset="100%" stopColor={woodPalette.low} />
        </linearGradient>

        <linearGradient id={rimGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="35%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor={woodPalette.rim} />
        </linearGradient>

        <radialGradient id={innerGlowId} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="62%" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.24)" />
        </radialGradient>

        {shadowVariant !== 'none' ? (
          <filter
            id={shadowFilterId}
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
          >
            <feDropShadow
              dx="0"
              dy={shadowStrength.dy}
              stdDeviation={shadowStrength.stdDeviation}
              floodColor="#000000"
              floodOpacity={shadowStrength.opacity}
            />
          </filter>
        ) : null}

        <filter id={textureFilterId} x="-5%" y="-5%" width="110%" height="110%">
          {patternVariant === 'wood' ? (
            <>
              {/* Layer 1: Base stretched grain */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency={grainFreq}
                numOctaves="3"
                seed="42"
                result="grain"
              />
              {/* Layer 2: Large cloudy noise to create knots and waves */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.015"
                numOctaves="2"
                seed="12"
                result="warp"
              />
              {/* Layer 3: Mathematically bend the grain using the warp layer */}
              <feDisplacementMap
                in="grain"
                in2="warp"
                scale={warpScale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="wavyGrain"
              />
              {/* Layer 4: Turn the noise into a high-contrast dark overlay */}
              <feColorMatrix
                in="wavyGrain"
                type="matrix"
                values="
                  0 0 0 0 0.1
                  0 0 0 0 0.05
                  0 0 0 0 0
                  1 0 0 0 -0.4
                "
              />
            </>
          ) : patternVariant === 'felt' ? (
            <>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.85"
                numOctaves="3"
                seed="17"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.4 0"
              />
            </>
          ) : (
            <>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.5"
                numOctaves="2"
                seed="17"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0"
              />
            </>
          )}
        </filter>

        <clipPath id={clipId}>
          {isCircle ? (
            <circle cx="500" cy="500" r="430" />
          ) : (
            <rect
              x={rectBase.x}
              y={rectBase.y}
              width={rectBase.w}
              height={rectBase.h}
              rx={Math.min(cornerRadius, 290)}
              ry={Math.min(cornerRadius, 290)}
            />
          )}
        </clipPath>
      </defs>

      <g
        filter={
          shadowVariant === 'none' ? undefined : `url(#${shadowFilterId})`
        }
      >
        {isCircle ? (
          <>
            <circle
              cx="500"
              cy="500"
              r="430"
              fill={`url(#${surfaceGradientId})`}
            />
            <circle cx="500" cy="500" r="430" fill={`url(#${innerGlowId})`} />
            <circle
              cx="500"
              cy="500"
              r="430"
              fill="none"
              stroke={`url(#${rimGradientId})`}
              strokeWidth="20"
              opacity={ringOpacity}
            />
          </>
        ) : (
          <>
            <rect
              x={rectBase.x}
              y={rectBase.y}
              width={rectBase.w}
              height={rectBase.h}
              rx={Math.min(cornerRadius, 290)}
              ry={Math.min(cornerRadius, 290)}
              fill={`url(#${surfaceGradientId})`}
            />
            <rect
              x={rectBase.x}
              y={rectBase.y}
              width={rectBase.w}
              height={rectBase.h}
              rx={Math.min(cornerRadius, 290)}
              ry={Math.min(cornerRadius, 290)}
              fill={`url(#${innerGlowId})`}
            />
            <rect
              x={rectBase.x}
              y={rectBase.y}
              width={rectBase.w}
              height={rectBase.h}
              rx={Math.min(cornerRadius, 290)}
              ry={Math.min(cornerRadius, 290)}
              fill="none"
              stroke={`url(#${rimGradientId})`}
              strokeWidth="20"
              opacity={ringOpacity}
            />
          </>
        )}
      </g>

      <g clipPath={`url(#${clipId})`} opacity={safeTextureOpacity}>
        <rect
          x={textureBase.x}
          y={textureBase.y}
          width={textureBase.w}
          height={textureBase.h}
          fill="#ffffff"
          filter={`url(#${textureFilterId})`}
        />
      </g>
    </svg>
  );
}
