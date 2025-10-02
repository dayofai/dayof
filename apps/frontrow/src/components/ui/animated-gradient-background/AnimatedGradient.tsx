import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import type { GradientConfig } from './presets/types';
import { normalizeColor } from './presets/utils';
import { fragmentShader } from './shaders/fragment.glsl';
import { vertexShader } from './shaders/vertex.glsl';

type Props = {
  config: GradientConfig;
  aspectRatio: [number, number];
};

export function AnimatedGradient({ config, aspectRatio }: Props) {
  // Get Three.js scene directly
  const { scene } = useThree();

  // Create entire mesh as a Three.js object
  const mesh = useMemo(() => {
    const color1 = normalizeColor(config.colors.color1);
    const color2 = normalizeColor(config.colors.color2);
    const color3 = normalizeColor(config.colors.color3);

    const geometry = new PlaneGeometry(2, 2);
    const material = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: config.speed },
        uNoiseDensity: { value: config.noiseDensity },
        uNoiseStrength: { value: config.noiseStrength },
        uBrightness: { value: config.brightness },
        uColor1: { value: color1 },
        uColor2: { value: color2 },
        uColor3: { value: color3 },
        uAspectRatio: { value: aspectRatio },
        uOffset: { value: config.offset ?? [0, 0] },
        uAlpha: { value: config.alpha ?? 1.0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    return new Mesh(geometry, material);
  }, [config, aspectRatio]);

  // Manually add/remove mesh from scene (bypassing R3F completely)
  useEffect(() => {
    scene.add(mesh);

    return () => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof ShaderMaterial) {
        mesh.material.dispose();
      }
    };
  }, [scene, mesh]);

  // Animation loop - update material uniforms directly
  useFrame(({ clock }) => {
    if (mesh.material instanceof ShaderMaterial) {
      mesh.material.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  // Return null - we've manually added the mesh to the scene
  return null;
}
