import { ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { FallbackGradient } from './FallbackGradient';
import { useGradientConfig } from './hooks/use-gradient-config';
import type { GradientProps } from './presets/types';
import './styles.css';

// ✅ Lazy load the WebGL component (reduces initial bundle by ~500KB)
// Only loads when component actually renders in browser
const AnimatedGradientClient = lazy(() =>
  import('./AnimatedGradientBackground').then((m) => ({
    default: m.AnimatedGradientBackground,
  }))
);

/**
 * Main export - SSR-safe animated gradient background
 *
 * How it works in TanStack Start:
 * 1. Server (SSR): Renders FallbackGradient (CSS-only)
 * 2. Client (Hydration): Shows FallbackGradient until WebGL loads
 * 3. Client (Loaded): Switches to animated WebGL gradient
 *
 * This pattern ensures:
 * - No SSR crashes (ClientOnly wrapper)
 * - No hydration mismatches (consistent initial render)
 * - No FOUC (fallback visible immediately)
 * - Optimal bundle size (lazy loading)
 */
export function AnimatedGradientBackground(props: GradientProps) {
  const { preset = 'default', config, className, disabled = false } = props;

  // ✅ SSR-safe: Use useGradientConfig to prepare config
  // (This hook is pure data transformation, no browser APIs)
  const baseConfig = useGradientConfig(preset, config);

  // Fallback component (SSR-safe, pure CSS)
  const fallback = (
    <FallbackGradient className={className} config={baseConfig} />
  );

  // Skip WebGL if explicitly disabled
  if (disabled) {
    return fallback;
  }

  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <AnimatedGradientClient {...props} />
      </Suspense>
    </ClientOnly>
  );
}
