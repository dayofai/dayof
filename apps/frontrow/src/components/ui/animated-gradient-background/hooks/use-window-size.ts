import { useEffect, useState } from 'react';

/**
 * Hook to get window dimensions
 *
 * CLIENT-ONLY because:
 * - Uses window.innerWidth/innerHeight
 * - Server doesn't have window object
 */
export function useWindowSize() {
  const [size, setSize] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
