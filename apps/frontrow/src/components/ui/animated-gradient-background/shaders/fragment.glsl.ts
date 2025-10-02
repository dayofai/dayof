import { perlinNoise } from './noise-functions.glsl';

export const fragmentShader = `
uniform float uTime;
uniform float uSpeed;
uniform float uNoiseDensity;
uniform float uNoiseStrength;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec2 uAspectRatio;
uniform vec2 uOffset;
uniform float uAlpha;

varying vec2 vUv;

${perlinNoise}

void main() {
  vec2 uv = vUv;

  // Aspect ratio correction
  uv -= vec2(0.5);
  uv *= uAspectRatio;
  uv += vec2(0.5);

  // Scale UV coordinates
  uv = (uv * 5.0 - 2.5);
  uv += uOffset;

  // Animated noise
  float t = uTime * uSpeed;
  float distortion = 0.75 * cnoise(0.43 * vec3(uv, 0.0) * uNoiseDensity + t);

  // Gradient blending
  vec3 color = mix(uColor1, uColor2, smoothstep(-3.0, 3.0, uv.x));
  color = mix(color, uColor3, distortion * uNoiseStrength);

  // Brightness adjustment
  color *= uBrightness * 0.8;

  gl_FragColor = vec4(color, uAlpha);
}
`;
