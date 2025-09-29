import { Typography } from '@/components/ui/typography';
import {
  AsideInfoNote,
  CTAPanel,
  GetAppSection,
  LineupSection,
  PageBackground,
  PromoCodeSection,
  PromoterSection,
  RelatedEventsSection,
  TitleBlock,
  TopTrack,
  VenueSection,
} from './components';
import styles from './styles.module.css';

interface EventPageProps {
  eventName: string;
}

export default function EventPage({ eventName }: EventPageProps) {
  // TODO: Use eventName to fetch dynamic event data

  return (
    <div className="overflow-hidden bg-black text-white sm:overflow-visible">
      {/* Gradient background */}
      <PageBackground />
      <div className="container relative z-10 mx-auto flex max-w-[1080px] flex-col gap-8 px-4 py-10 md:flex-row">
        {/* Left sticky media column */}
        <aside
          className={`self-start md:sticky md:top-20 md:max-w-[328px] ${styles.asideContainer}`}
        >
          <div
            className="relative overflow-hidden rounded-2xl ring-1 ring-white/10"
            style={{ aspectRatio: '1 / 1' }}
          >
            <img
              alt="Frost Children DJ Set"
              className="h-auto w-full rounded-2xl object-cover"
              src="https://dice-media.imgix.net/attachments/2025-09-17/54b20d50-a53b-40a2-97dd-13c219685ede.jpg?rect=0%2C0%2C1080%2C1080&auto=format%2Ccompress&q=80&w=328&h=328&fit=crop&crop=faces%2Ccenter"
              srcSet="https://dice-media.imgix.net/attachments/2025-09-17/54b20d50-a53b-40a2-97dd-13c219685ede.jpg?rect=0%2C0%2C1080%2C1080&auto=format%2Ccompress&q=80&w=328&h=328&fit=crop&crop=faces%2Ccenter&dpr=1 1x,https://dice-media.imgix.net/attachments/2025-09-17/54b20d50-a53b-40a2-97dd-13c219685ede.jpg?rect=0%2C0%2C1080%2C1080&auto=format%2Ccompress&q=40&w=328&h=328&fit=crop&crop=faces%2Ccenter&dpr=2 2x"
              style={{ aspectRatio: '1 / 1' }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          <div className="hidden md:block">
            <TopTrack />
            <AsideInfoNote />
          </div>
        </aside>

        <section className="flex-[2_1_0%]">
          <TitleBlock />

          <CTAPanel />

          <div className="mt-10 grid">
            <section>
              <Typography spacing="loose" variant="h3">
                About
              </Typography>
              <div className="mt-4 space-y-4">
                <Typography color="secondary" variant="body">
                  L.A. Guns, one of the most influential bands to emerge from
                  the Los Angeles rock scene, bring their high-energy show to 89
                  North.
                </Typography>
                <ul className="grid gap-3">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary" />
                    <Typography color="secondary" variant="bodySmall">
                      Thursday, October 9, 2025 — Doors at 7 PM
                    </Typography>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary" />
                    <Typography color="secondary" variant="bodySmall">
                      89 N Ocean Ave, Patchogue, NY 11772, United States
                    </Typography>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary" />
                    <Typography color="secondary" variant="bodySmall">
                      $25 ADV / $35 ADV Balcony — $30 DOS / $40 DOS Balcony
                    </Typography>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary" />
                    <Typography color="secondary" variant="bodySmall">
                      18+ event
                    </Typography>
                  </li>
                </ul>
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                  <Typography color="tertiary" variant="bodySmall">
                    You can get a refund if it's within 24 hours of buying
                    tickets or if the event is rescheduled or cancelled.
                    Restrictions apply.
                  </Typography>
                </div>
              </div>
            </section>

            <LineupSection />

            <VenueSection />

            <PromoterSection />

            <PromoCodeSection />

            <GetAppSection />
          </div>
        </section>
      </div>
      <RelatedEventsSection />
    </div>
  );
}
