/// <reference types="vite/client" />

// React Three Fiber JSX type augmentation
import type { ThreeElements } from '@react-three/fiber';

declare module 'react/jsx-runtime' {
  // biome-ignore lint: Required for React JSX module augmentation
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

declare module 'react/jsx-dev-runtime' {
  // biome-ignore lint: Required for React JSX module augmentation
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
