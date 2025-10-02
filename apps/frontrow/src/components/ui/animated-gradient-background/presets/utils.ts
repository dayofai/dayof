import type { ColorValue } from './types';

// Convert hex color to RGB vec3 for shader uniforms
export function hexToRgb(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

// Normalize color value to RGB array
export function normalizeColor(color: ColorValue): [number, number, number] {
  if (typeof color === 'string') {
    return hexToRgb(color);
  }
  return color;
}
