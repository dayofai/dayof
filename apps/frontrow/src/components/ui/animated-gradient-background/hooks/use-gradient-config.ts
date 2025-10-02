import { useMemo } from 'react';
import {
  defaultConfig,
  energeticConfig,
  lavenderConfig,
  professionalConfig,
  subtleConfig,
} from '../presets/default';
import type { GradientConfig, GradientPreset } from '../presets/types';

/**
 * Hook to resolve gradient configuration from preset
 *
 * SSR-SAFE because:
 * - Pure data transformation
 * - No browser APIs
 * - Just merges objects
 */
export function useGradientConfig(
  preset: GradientPreset = 'default',
  overrides?: Partial<GradientConfig>
): GradientConfig {
  return useMemo(() => {
    const presets: Record<GradientPreset, GradientConfig> = {
      default: defaultConfig,
      lavender: lavenderConfig,
      professional: professionalConfig,
      energetic: energeticConfig,
      subtle: subtleConfig,
    };

    const baseConfig = presets[preset] || defaultConfig;

    if (!overrides) {
      return baseConfig;
    }

    return {
      ...baseConfig,
      ...overrides,
      colors: {
        ...baseConfig.colors,
        ...overrides.colors,
      },
    };
  }, [preset, overrides]);
}
