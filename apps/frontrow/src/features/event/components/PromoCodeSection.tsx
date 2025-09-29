import { Button } from '@/components/ui/button';

export function PromoCodeSection() {
  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Got a code?</h3>
          <p className="text-sm text-white/60">
            Enter a promo or access code to unlock tickets.
          </p>
        </div>
        <Button variant="outline">Enter code</Button>
      </div>
    </section>
  );
}
