import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import styles from '../styles.module.css';

const mockEvents = [
  {
    id: '1',
    title: 'Grato Cuore Fest 3 | Abbonamento 2 Giorni',
    venue: 'Covo Club',
    date: '28 Nov - 30 Nov',
    price: '€25.50',
    image:
      'https://dice-media.imgix.net/attachments/2025-09-17/54b20d50-a53b-40a2-97dd-13c219685ede.jpg?rect=0%2C0%2C1080%2C1080&auto=format%2Ccompress&q=80&w=200&h=200&fit=crop&crop=faces%2Ccenter',
    dateOverlay: '28-29 novembre',
    venueOverlay: 'COVO CLUB, BOLOGNA',
    lineup: [
      'quercia cabrera',
      'morningviews amalia bloom',
      'trauma glow giovanni pede',
      'orlando',
    ],
  },
  {
    id: '2',
    title: 'Electronic Night with Local DJs',
    venue: 'Club Underground',
    date: '30 Nov - 1 Dec',
    price: '€15.00',
    image:
      'https://dice-media.imgix.net/attachments/2022-02-16/b2be09ab-e456-4442-89ae-1d3a67fbb622.jpg?rect=0%2C1%2C639%2C639&auto=format%2Ccompress&q=80&w=200&h=200&fit=crop&crop=faces%2Ccenter',
    dateOverlay: '30 novembre',
    venueOverlay: 'CLUB UNDERGROUND, MILAN',
    lineup: ['DJ Alpha', 'Beat Master', 'Sound Wave'],
  },
  {
    id: '3',
    title: 'Indie Rock Showcase',
    venue: 'The Venue',
    date: '1 Dec - 2 Dec',
    price: '€22.00',
    image:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop',
    dateOverlay: '1 dicembre',
    venueOverlay: 'THE VENUE, ROME',
    lineup: ['Rock Band A', 'Indie Group B', 'Alternative C'],
  },
  {
    id: '4',
    title: 'Jazz & Blues Night',
    venue: 'Blue Note',
    date: '2 Dec - 3 Dec',
    price: '€25.00',
    image:
      'https://dice-media.imgix.net/attachments/2025-07-31/9482fa94-5911-476a-9eab-94076f6dd0e8.jpg?rect=0%2C225%2C1500%2C1500&auto=format%2Ccompress&q=80&w=200&h=200&fit=crop&crop=faces%2Ccenter',
    dateOverlay: '2 dicembre',
    venueOverlay: 'BLUE NOTE, FLORENCE',
    lineup: ['Jazz Trio', 'Blues Master', 'Sax Player'],
  },
];

export function RelatedEventsSection() {
  return (
    <section className="container mx-auto mt-8 max-w-[1080px] px-4">
      <div className="mb-6 flex items-center justify-between">
        <Typography spacing="none" variant="h3">
          Related events
        </Typography>
        <Button size="sm" variant="ghost">
          View all
        </Button>
      </div>

      <div
        className={`flex gap-4 overflow-x-auto pb-4 ${styles.scrollContainer}`}
      >
        {mockEvents.map((event) => (
          <div
            className="max-w-[203px] flex-shrink-0 overflow-hidden"
            key={event.id}
          >
            <div className="relative mb-2 aspect-square">
              <img
                alt={event.title}
                className="h-full w-full rounded-sm object-cover"
                src={event.image}
              />

              <div className="absolute right-3 bottom-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black">
                  <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
                    <title>Heart Icon</title>
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                      stroke="white"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <Typography variant="h4" weight="bold">
                {event.title}
              </Typography>

              <Typography variant="bodySmall">{event.venue}</Typography>

              <Typography color="accent" variant="bodySmall">
                {event.date}
              </Typography>

              <div className="mt-2 w-fit rounded-sm border border-white/10 px-2 py-1 font-bold">
                {event.price}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
