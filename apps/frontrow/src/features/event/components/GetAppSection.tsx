import { Button } from '@/components/ui/button';

export function GetAppSection() {
  return (
    <section className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="flex-1">
          <h3 className="font-semibold">Get the app</h3>
          <p className="mt-1 text-sm text-white/70">
            Buy tickets, stream events, and keep them safe in the app.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button href="#" variant="default">
            App Store
          </Button>
          <Button href="#" variant="default">
            Google Play
          </Button>
        </div>
      </div>
    </section>
  );
}
