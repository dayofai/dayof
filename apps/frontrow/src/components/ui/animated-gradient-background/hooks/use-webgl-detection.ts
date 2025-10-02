import { useEffect, useState } from 'react';

/**
 * Detect WebGL support and user preferences
 *
 * CLIENT-ONLY because:
 * - Uses document.createElement
 * - Uses window.matchMedia
 */
export function useWebGLDetection() {
  const [detection, setDetection] = useState({
    hasWebGL: false,
    prefersReducedMotion: false,
  });

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const hasWebGL = !!(
      canvas.getContext('webgl2') || canvas.getContext('webgl')
    );

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    setDetection({ hasWebGL, prefersReducedMotion });
  }, []);

  return detection;
}
