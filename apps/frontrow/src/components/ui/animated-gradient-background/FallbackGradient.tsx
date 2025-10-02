import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { GradientConfig } from './presets/types';
import { normalizeColor } from './presets/utils';

interface FallbackGradientProps {
  config: GradientConfig;
  className?: string;
}

/**
 * Pure CSS gradient fallback
 *
 * SSR-safe because:
 * - No browser APIs
 * - Pure CSS rendering
 * - Works without JavaScript
 *
 * Used for:
 * 1. Server-side rendering (initial HTML)
 * 2. Non-WebGL browsers
 * 3. Reduced motion preference
 * 4. Loading state during WebGL initialization
 */
export function FallbackGradient({ config, className }: FallbackGradientProps) {
  const style = useMemo(() => {
    const c1 = normalizeColor(config.colors.color1);
    const c2 = normalizeColor(config.colors.color2);
    const c3 = normalizeColor(config.colors.color3);

    // Convert RGB arrays to CSS rgb() format
    const rgb1 = `rgb(${c1.map((v) => Math.round(v * 255)).join(',')})`;
    const rgb2 = `rgb(${c2.map((v) => Math.round(v * 255)).join(',')})`;
    const rgb3 = `rgb(${c3.map((v) => Math.round(v * 255)).join(',')})`;

    return {
      background: `linear-gradient(135deg, ${rgb1} 0%, ${rgb2} 50%, ${rgb3} 100%)`,
      width: '100vw',
      height: '100lvh',
      position: 'fixed' as const,
      top: 0,
      left: 0,
      // Clamp opacity to 1.0 max (CSS opacity range is 0-1)
      opacity: Math.min(1, config.brightness ?? 1.0),
    };
  }, [config]);

  return (
    <div
      aria-hidden="true"
      className={cn('gradient-fallback', className)}
      style={style}
    />
  );
}
