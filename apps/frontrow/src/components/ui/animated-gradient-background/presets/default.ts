import type { GradientConfig } from './types';

// Default preset - balanced, professional
export const defaultConfig: GradientConfig = {
  name: 'Default',
  speed: 0.3, // Standard animation (validated range: 0.2-0.6)
  noiseDensity: 2.5, // Standard complexity (validated range: 1.5-4.0)
  noiseStrength: 0.6, // Moderate distortion (validated range: 0.4-0.8)
  brightness: 1.0, // Dark mode baseline (validated range: 1.0-1.25)
  colors: {
    color1: [0.15, 0.25, 0.85], // Deep blue
    color2: [0.85, 0.2, 0.6], // Magenta
    color3: [0.4, 0.75, 0.9], // Sky blue
  },
  offset: [0, 0],
  alpha: 1.0,
};

// Lavender preset (ltl9cvae - from HTML source analysis)
export const lavenderConfig: GradientConfig = {
  name: 'Lavender',
  speed: 0.3,
  noiseDensity: 2.5,
  noiseStrength: 0.6,
  brightness: 1.0, // Dark mode
  colors: {
    color1: '#6d00e6', // ✅ Actual ltl9cvae value (deep purple)
    color2: '#830ed8', // ✅ Actual ltl9cvae value (medium purple)
    color3: '#af00e6', // ✅ Actual ltl9cvae value (light purple)
  },
  offset: [0, 0],
  alpha: 1.0,
};

// Professional event preset (like tm15enb1)
export const professionalConfig: GradientConfig = {
  name: 'Professional',
  speed: 0.3,
  noiseDensity: 2.5,
  noiseStrength: 0.6,
  brightness: 1.25, // Light, welcoming
  colors: {
    color1: [0.95, 0.85, 0.75], // ✅ From tm15enb1 analysis
    color2: [0.85, 0.7, 0.85], // ✅ From tm15enb1 analysis
    color3: [0.9, 0.8, 0.7], // ✅ From tm15enb1 analysis
  },
  offset: [0, 0],
  alpha: 1.0,
};

// Energetic/Concert preset
export const energeticConfig: GradientConfig = {
  name: 'Energetic',
  speed: 0.5, // Faster animation (within validated range)
  noiseDensity: 3.0, // More complex pattern
  noiseStrength: 0.75, // Strong distortion
  brightness: 1.0,
  colors: {
    color1: [0.9, 0.2, 0.3], // Vibrant red
    color2: [0.3, 0.1, 0.9], // Deep purple
    color3: [0.95, 0.6, 0.1], // Orange
  },
  offset: [0, 0],
  alpha: 1.0,
};

// Subtle/Minimal preset
export const subtleConfig: GradientConfig = {
  name: 'Subtle',
  speed: 0.2, // Slow, calm (validated minimum)
  noiseDensity: 2.0, // Less complex
  noiseStrength: 0.4, // Minimal distortion (validated minimum)
  brightness: 1.1,
  colors: {
    color1: [0.85, 0.87, 0.9], // Light gray-blue
    color2: [0.9, 0.88, 0.92], // Light purple-gray
    color3: [0.88, 0.9, 0.91], // Light blue-gray
  },
  offset: [0, 0],
  alpha: 1.0,
};
