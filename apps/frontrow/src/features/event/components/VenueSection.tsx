import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Typography } from '@/components/ui/typography';

export function VenueSection() {
  return (
    <section>
      <div className="flex items-start gap-6">
        <div className="flex-1">
          <Typography color="muted" spacing="tight" variant="bodySmall">
            Venue
          </Typography>
          <Typography spacing="normal" variant="h2">
            El Cid
          </Typography>
          <div className="mb-4 flex items-center gap-2">
            <Typography color="primary" variant="body">
              4212 Sunset Blvd, Los Angeles, CA 90029, USA
            </Typography>
            <Button size="icon" variant="subtle">
              <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                <title>Copy Icon</title>
                <path
                  d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>
          <div className="mb-4 flex items-center gap-3">
            <Button
              leftIcon={
                <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                  <title>Map Icon</title>
                  <path
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              size="md"
              variant="outline"
            >
              OPEN IN MAPS
            </Button>
            <Button variant="default">FOLLOW</Button>
          </div>
          <div className="flex items-center gap-2">
            <svg
              aria-label="Building icon"
              fill="none"
              height="16"
              viewBox="0 0 24 24"
              width="16"
            >
              <title>Building icon</title>
              <path
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Typography color="secondary" variant="bodySmall">
              Doors open 9:30 PM PDT
            </Typography>
          </div>
        </div>
        <div className="hidden h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg sm:block">
          <img
            alt="El Cid venue"
            className="h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop"
          />
        </div>
      </div>
      <Divider />
    </section>
  );
}
