// Support both hex strings and RGB arrays for colors
export type ColorValue = [number, number, number] | string;

export type GradientConfig = {
  name?: string; // Human-readable theme name ("Lavender", "Ocean")
  speed: number;
  noiseDensity: number;
  noiseStrength: number;
  brightness: number;
  colors: {
    color1: ColorValue; // "#6d00e6" or [0.427, 0, 0.902]
    color2: ColorValue; // "#830ed8" or [0.514, 0.055, 0.847]
    color3: ColorValue; // "#af00e6" or [0.686, 0, 0.902]
  };
  offset?: [number, number];
  alpha?: number;
};

export type GradientPreset =
  | 'default'
  | 'lavender'
  | 'professional'
  | 'energetic'
  | 'subtle';

export type GradientProps = {
  preset?: GradientPreset;
  config?: Partial<GradientConfig>;
  className?: string;
  disabled?: boolean;
  fadeIn?: boolean; // Enable 2s fade-in animation (Luma pattern)
};
