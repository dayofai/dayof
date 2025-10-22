import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';

const HERO = {
  square:
    'https://dice-media.imgix.net/attachments/2025-07-31/9482fa94-5911-476a-9eab-94076f6dd0e8.jpg?rect=0%2C225%2C1500%2C1500&auto=format%2Ccompress&q=80&w=328&h=328&fit=crop&crop=faces%2Ccenter',
};

export function CTAPanel() {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="flex flex-col items-stretch justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <img
            alt="Frost Children DJ Set (In The Round) LA"
            className="h-16 w-16 rounded-lg object-cover"
            src={HERO.square}
          />
          <div>
            <Typography color="tertiary" variant="bodySmall">
              From
            </Typography>
            <Typography variant="price">$31.42</Typography>
            <Typography color="disabled" variant="bodyTiny">
              The price you'll pay. No surprises later.
            </Typography>
          </div>
        </div>
        <Button size="lg" variant="default">
          Buy tickets
        </Button>
      </div>
    </div>
  );
}
