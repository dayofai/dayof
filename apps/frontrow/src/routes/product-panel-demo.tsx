import { createFileRoute } from '@tanstack/react-router';
import { ProductPanel } from '@/feature/product-panel/components/panel';

export const Route = createFileRoute('/product-panel-demo')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="mb-2 font-bold text-3xl">Product Panel Demo</h1>
        <p className="text-muted-foreground">
          Testing ground for the product panel component
        </p>
      </div>

      {/* Demo Panel */}
      <ProductPanel eventId="evt_demo_123" />
    </div>
  );
}
