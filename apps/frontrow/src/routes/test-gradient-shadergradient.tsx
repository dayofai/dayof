import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';
import { createFileRoute } from '@tanstack/react-router';
import { Suspense, useEffect, useState } from 'react';
import { Typography } from '@/components/ui/typography';

export const Route = createFileRoute('/test-gradient-shadergradient')({
  component: Page,
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

function LoadTrigger({ onLoad }: { onLoad: () => void }) {
  useEffect(() => {
    // Wait for canvas to be ready, then trigger fade-in
    const timer = setTimeout(onLoad, 500);
    return () => clearTimeout(timer);
  }, [onLoad]);
  return null;
}

function Page() {
  const [isLoaded, setIsLoaded] = useState(false);

  const fallback = (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0"
      style={{
        background:
          'linear-gradient(135deg, rgb(109, 0, 230) 0%, rgb(131, 14, 216) 50%, rgb(175, 0, 230) 100%)',
      }}
    />
  );

  return (
    <div className="relative min-h-screen">
      {/* Always render CSS fallback */}
      {fallback}

      {/* Fade in WebGL gradient on top - SSR disabled so no ClientOnly needed */}
      <Suspense fallback={null}>
        <div
          className="fixed inset-0 z-0 transition-opacity duration-1000"
          style={{ opacity: isLoaded ? 1 : 0 }}
        >
          <ShaderGradientCanvas
            style={{ position: 'absolute', inset: 0 as unknown as number }}
          >
            <ShaderGradient
              animate="on"
              brightness={1.0}
              color1="#6d00e6"
              color2="#830ed8"
              color3="#af00e6"
              control="props"
              grain="off"
              reflection={0}
              type="waterPlane"
              uDensity={1.5}
              uSpeed={0.3}
              uStrength={0.8}
            />
          </ShaderGradientCanvas>
        </div>
        <LoadTrigger onLoad={() => setIsLoaded(true)} />
      </Suspense>

      <div className="container relative z-10 mx-auto flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <Typography as="h1" spacing="normal" variant="h1">
          ShaderGradient Test
        </Typography>
        <Typography as="p" color="secondary" variant="subtitle">
          Using @shadergradient/react with Lavender colors
        </Typography>
      </div>
    </div>
  );
}
