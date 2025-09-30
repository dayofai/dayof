import { Typography } from '@/components/ui/typography';

export function TitleBlock() {
  return (
    <div className="flex flex-col">
      <Typography spacing="normal" variant="h1">
        Frost Children DJ Set (In The Round) LA
      </Typography>
      <Typography spacing="tight" variant="subtitle">
        89 North • Patchogue, NY
      </Typography>
      <Typography color="accent" spacing="tight" variant="subtitle">
        Thu, Oct 9, 2025 • 7:00 PM GMT-4
      </Typography>
    </div>
  );
}
