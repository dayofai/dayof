# Luma Background Gradient Analysis

## Shader Technique Overview

The Luma background effect uses **animated Perlin noise** to create flowing gradient distortions. Both shader examples (ltl9cvae and tm15enb1) are identical.

## Core Algorithm

1. **Base Gradient**: Horizontal color gradient from `uColor1` to `uColor2`
2. **Noise Distortion**: 3D Perlin noise adds organic movement
3. **Third Color Blend**: `uColor3` is mixed in based on noise intensity
4. **Animation**: Time-based noise evolution creates flowing effect

## Key Parameters

| Parameter        | Purpose              | Typical Range             |
| ---------------- | -------------------- | ------------------------- |
| `uSpeed`         | Animation speed      | 0.1 - 1.0                 |
| `uNoiseDensity`  | Pattern tightness    | 1.0 - 5.0                 |
| `uNoiseStrength` | Distortion intensity | 0.0 - 1.0                 |
| `uBrightness`    | Overall brightness   | 1.0 (dark) / 1.25 (light) |
| `uColor1`        | Left gradient color  | RGB vec3                  |
| `uColor2`        | Right gradient color | RGB vec3                  |
| `uColor3`        | Noise blend color    | RGB vec3                  |

## Generalizable Implementations

### 1. WebGL/Three.js (Highest Quality - Same as Luma)

**Pros:**

- Identical to Luma's implementation
- 60fps performance
- GPU-accelerated
- Smooth animations

**Cons:**

- Requires WebGL setup
- Larger bundle size
- More complex implementation

**Code Structure:**

```typescript
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uNoiseDensity;
  uniform float uNoiseStrength;
  uniform float uBrightness;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec2 uAspectRatio;
  
  varying vec2 vUv;
  
  // Perlin noise function here (from background-source.c)
  
  void main() {
    vec2 uv = vUv;
    uv -= vec2(0.5);
    uv *= uAspectRatio;
    uv += vec2(0.5);
    uv = (uv * 5.0 - 2.5);
    
    float t = uTime * uSpeed;
    float distortion = 0.75 * cnoise(0.43 * vec3(uv, 0.0) * uNoiseDensity + t);
    
    vec3 color = mix(uColor1, uColor2, smoothstep(-3.0, 3.0, uv.x));
    color = mix(color, uColor3, distortion * uNoiseStrength);
    color *= uBrightness * 0.8;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uSpeed: { value: 0.5 },
    uNoiseDensity: { value: 2.0 },
    uNoiseStrength: { value: 0.5 },
    uBrightness: { value: 1.0 },
    uColor1: { value: new THREE.Vector3(0.2, 0.3, 0.8) },
    uColor2: { value: new THREE.Vector3(0.8, 0.2, 0.6) },
    uColor3: { value: new THREE.Vector3(0.5, 0.8, 0.3) },
    uAspectRatio: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader,
  fragmentShader,
});
```

### 2. Canvas 2D API (Simpler Alternative)

**Pros:**

- No WebGL dependency
- Simpler implementation
- Good browser support

**Cons:**

- CPU-based (slower)
- May have performance issues on mobile
- Less smooth than WebGL

**Code Structure:**

```typescript
class CanvasGradient {
  private ctx: CanvasRenderingContext2D;
  private time = 0;

  render(config: {
    speed: number;
    noiseDensity: number;
    noiseStrength: number;
    colors: [string, string, string];
  }) {
    const { width, height } = this.ctx.canvas;
    const imageData = this.ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Calculate UV coordinates
        const u = x / width;
        const v = y / height;

        // Apply noise and gradient logic
        // (simplified version of shader logic)
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }
}
```

### 3. CSS-Based Approximation (Lightweight)

**Pros:**

- Zero JavaScript runtime
- Tiny implementation
- Great performance
- Easy to integrate

**Cons:**

- Can't replicate exact noise pattern
- Limited animation capabilities
- Less organic feel

**Code Structure:**

```css
@keyframes gradientFlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.luma-gradient {
  background: linear-gradient(
    90deg,
    var(--color-1),
    var(--color-2),
    var(--color-3),
    var(--color-2),
    var(--color-1)
  );
  background-size: 200% 200%;
  animation: gradientFlow 15s ease infinite;
}
```

### 4. React Three Fiber (Modern React)

**Pros:**

- React-friendly
- Declarative API
- WebGL performance
- Good ecosystem

**Cons:**

- React dependency
- Learning curve
- Bundle size

**Code Structure:**

```tsx
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

function AnimatedGradient() {
  const materialRef = useRef<THREE.ShaderMaterial>();

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          uTime: { value: 0 },
          uSpeed: { value: 0.5 },
          // ... other uniforms
        }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}
```

## Recommended Approach

For a production website similar to Luma:

1. **Primary**: Use **WebGL with Three.js** or **React Three Fiber**

   - Same quality as Luma
   - Best performance
   - Most control

2. **Fallback**: Use **CSS gradient animation**

   - For older browsers
   - For reduced motion preference
   - For accessibility

3. **Progressive Enhancement**:
   ```typescript
   const useGradient = () => {
     if (supportsWebGL()) {
       return <WebGLGradient />;
     }
     return <CSSGradient />;
   };
   ```

## Implementation Checklist

- [ ] Extract Perlin noise function from shader
- [ ] Set up WebGL context (Three.js recommended)
- [ ] Create shader material with uniforms
- [ ] Implement animation loop
- [ ] Add aspect ratio responsiveness
- [ ] Configure color palette
- [ ] Test performance on mobile
- [ ] Add fallback for non-WebGL browsers
- [ ] Consider prefers-reduced-motion

## Performance Considerations

- **Resolution**: Render at lower resolution and scale up (CSS `transform: scale()`)
- **FPS**: Cap at 30fps for mobile devices
- **Complexity**: Reduce noise density on lower-end devices
- **Memory**: Use single global instance, don't create multiple canvases

## Example Configuration (Luma-style)

```typescript
const lumaConfig = {
  speed: 0.3,
  noiseDensity: 2.5,
  noiseStrength: 0.6,
  brightness: 1.0, // or 1.25 for light mode
  colors: {
    color1: [0.15, 0.25, 0.85], // Blue
    color2: [0.85, 0.2, 0.6], // Purple/Pink
    color3: [0.4, 0.75, 0.9], // Light Blue
  },
};
```

## Next Steps

1. Choose implementation approach based on project requirements
2. Set up WebGL/Canvas boilerplate
3. Port Perlin noise function to chosen platform
4. Implement gradient blending logic
5. Add animation loop
6. Tune parameters to match desired aesthetic
7. Add responsive behavior
8. Test across devices and browsers
