import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { AnimatedGradientBackground } from '@/components/ui/animated-gradient-background';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';

export const Route = createFileRoute('/test-gradient')({
  component: TestGradientPage,
  ssr: false, // Disable SSR - this is a WebGL canvas test, no need for server rendering
  head: () => ({
    // Inline style to prevent white flash during initial load
    styles: [
      {
        children:
          'body{background:linear-gradient(135deg,rgb(109,0,230) 0%,rgb(131,14,216) 50%,rgb(175,0,230) 100%)!important}',
      },
    ],
  }),
});

function TestGradientPage() {
  const [preset, setPreset] = useState<
    'lavender' | 'professional' | 'energetic' | 'subtle'
  >('lavender');

  return (
    <div className="relative min-h-screen">
      {/* Animated WebGL gradient background */}
      <AnimatedGradientBackground fadeIn={true} preset={preset} />

      {/* Content */}
      <div className="container relative z-10 mx-auto flex min-h-screen flex-col items-center justify-center gap-8 px-4">
        <Typography as="h1" spacing="normal" variant="h1">
          Gradient Background Test
        </Typography>

        <Typography
          as="p"
          className="max-w-2xl text-center"
          color="secondary"
          variant="subtitle"
        >
          Testing Luma-style animated gradient background with TanStack Start
          SSR
        </Typography>

        {/* Preset switcher */}
        <div className="mt-8 flex gap-3">
          <Button
            onClick={() => setPreset('lavender')}
            variant={preset === 'lavender' ? 'default' : 'outline'}
          >
            Lavender
          </Button>
          <Button
            onClick={() => setPreset('professional')}
            variant={preset === 'professional' ? 'default' : 'outline'}
          >
            Professional
          </Button>
          <Button
            onClick={() => setPreset('energetic')}
            variant={preset === 'energetic' ? 'default' : 'outline'}
          >
            Energetic
          </Button>
          <Button
            onClick={() => setPreset('subtle')}
            variant={preset === 'subtle' ? 'default' : 'outline'}
          >
            Subtle
          </Button>
        </div>

        {/* Info panel */}
        <div className="mt-8 max-w-2xl rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur-sm">
          <Typography as="h2" spacing="tight" variant="h3">
            Implementation Status
          </Typography>
          <ul className="mt-4 space-y-2">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-green-500" />
              <Typography color="secondary" variant="bodySmall">
                ✅ WebGL Shader - Running (animated gradient)
              </Typography>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-green-500" />
              <Typography color="secondary" variant="bodySmall">
                ✅ SSR-Safe - ClientOnly wrapper active
              </Typography>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-blue-500" />
              <Typography color="secondary" variant="bodySmall">
                📝 Current preset:{' '}
                {preset.charAt(0).toUpperCase() + preset.slice(1)}
              </Typography>
            </li>
          </ul>
        </div>

        {/* Color palette reference */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur-sm">
          <Typography as="h3" spacing="tight" variant="h4">
            Lavender Theme Colors
          </Typography>
          <div className="mt-4 flex gap-4">
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-12 w-12 rounded-lg border border-white/20"
                style={{ backgroundColor: 'rgb(109, 0, 230)' }}
              />
              <Typography color="muted" variant="bodyTiny">
                Color 1
              </Typography>
              <Typography
                className="font-mono"
                color="muted"
                variant="bodyTiny"
              >
                #6d00e6
              </Typography>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-12 w-12 rounded-lg border border-white/20"
                style={{ backgroundColor: 'rgb(131, 14, 216)' }}
              />
              <Typography color="muted" variant="bodyTiny">
                Color 2
              </Typography>
              <Typography
                className="font-mono"
                color="muted"
                variant="bodyTiny"
              >
                #830ed8
              </Typography>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-12 w-12 rounded-lg border border-white/20"
                style={{ backgroundColor: 'rgb(175, 0, 230)' }}
              />
              <Typography color="muted" variant="bodyTiny">
                Color 3
              </Typography>
              <Typography
                className="font-mono"
                color="muted"
                variant="bodyTiny"
              >
                #af00e6
              </Typography>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-4 max-w-2xl rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur-sm">
          <Typography as="h3" spacing="tight" variant="h4">
            Features
          </Typography>
          <ul className="mt-4 space-y-2">
            <li className="flex items-start gap-3">
              <Typography color="accent" variant="bodySmall">
                •
              </Typography>
              <Typography color="secondary" variant="bodySmall">
                WebGL shader with Perlin noise (Luma-validated code)
              </Typography>
            </li>
            <li className="flex items-start gap-3">
              <Typography color="accent" variant="bodySmall">
                •
              </Typography>
              <Typography color="secondary" variant="bodySmall">
                SSR-safe with ClientOnly wrapper + lazy loading
              </Typography>
            </li>
            <li className="flex items-start gap-3">
              <Typography color="accent" variant="bodySmall">
                •
              </Typography>
              <Typography color="secondary" variant="bodySmall">
                CSS fallback for non-WebGL browsers
              </Typography>
            </li>
            <li className="flex items-start gap-3">
              <Typography color="accent" variant="bodySmall">
                •
              </Typography>
              <Typography color="secondary" variant="bodySmall">
                2-second fade-in animation (Luma pattern)
              </Typography>
            </li>
            <li className="flex items-start gap-3">
              <Typography color="accent" variant="bodySmall">
                •
              </Typography>
              <Typography color="secondary" variant="bodySmall">
                Respects prefers-reduced-motion
              </Typography>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
