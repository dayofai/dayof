import { createFileRoute } from '@tanstack/react-router';
import EventPage from '@/features/event';

export const Route = createFileRoute('/event/$eventName')({
  component: EventComponent,
});

function EventComponent() {
  const { eventName } = Route.useParams();

  return <EventPage eventName={eventName} />;
}


