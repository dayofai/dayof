import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { AnimatedGradient } from './AnimatedGradient';
import { GradientErrorBoundary } from './ErrorBoundary';
import { FallbackGradient } from './FallbackGradient';
import { useGradientConfig } from './hooks/use-gradient-config';
import { useWebGLDetection } from './hooks/use-webgl-detection';
import { useWindowSize } from './hooks/use-window-size';
import type { GradientProps } from './presets/types';

/**
 * Internal WebGL implementation - CLIENT-ONLY
 *
 * This component is guaranteed to only run in the browser because:
 * 1. Parent wraps in ClientOnly
 * 2. Lazy loaded (not in server bundle)
 *
 * Safe to use browser APIs: window, navigator, Canvas, etc.
 */
export function AnimatedGradientBackground({
  preset = 'default',
  config,
  className,
  fadeIn = true,
}: GradientProps) {
  // ✅ Safe: These hooks only run in browser
  const { hasWebGL, prefersReducedMotion } = useWebGLDetection();
  const baseConfig = useGradientConfig(preset, config);
  const { width, height } = useWindowSize();
  const [isAnimated, setIsAnimated] = useState(false);

  const aspectRatio = useMemo<[number, number]>(
    () => [width / height, 1],
    [width, height]
  );

  // Trigger fade-in animation after mount (Luma pattern)
  useEffect(() => {
    if (fadeIn) {
      const timer = setTimeout(() => setIsAnimated(true), 50);
      return () => clearTimeout(timer);
    }
    setIsAnimated(true);
  }, [fadeIn]);

  // Determine if mobile for performance settings
  const isMobile = width < 768;

  // Keep SSR parity & accessibility: render CSS fallback on the client if WebGL is missing
  // or the user prefers reduced motion.
  if (!hasWebGL || prefersReducedMotion) {
    return <FallbackGradient className={className} config={baseConfig} />;
  }

  const gradientContent = (
    <GradientErrorBoundary
      fallback={<FallbackGradient className={className} config={baseConfig} />}
    >
      <div
        className={cn('gradient-bg', isAnimated && 'animate', className)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 1], near: 0.1, far: 10 }}
          dpr={isMobile ? [0.35, 0.5] : [0.75, 1.5]}
          flat
          frameloop={prefersReducedMotion ? 'never' : 'always'}
          gl={{
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: 'high-performance',
            premultipliedAlpha: true,
          }}
          performance={{ min: 0.5, max: 1, debounce: 200 }}
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <Suspense fallback={null}>
            <AnimatedGradient aspectRatio={aspectRatio} config={baseConfig} />
          </Suspense>
        </Canvas>
      </div>
    </GradientErrorBoundary>
  );

  // Use portal to render at document.body level, bypassing any parent constraints
  return createPortal(gradientContent, document.body);
}
