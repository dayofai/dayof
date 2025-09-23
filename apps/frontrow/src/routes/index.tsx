import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto max-w-3xl px-4 py-20">
        <div className="text-center">
          <h1 className="mb-6 font-extrabold text-4xl">Welcome to GIGS</h1>
          <p className="mb-8 text-white/70">
            Discover and buy tickets for the best gigs, clubs and festivals.
          </p>
          <Link
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-black hover:bg-white/90"
            params={{ eventName: 'la-guns' }}
            to="/event/$eventName"
          >
            View L.A. Guns Event
          </Link>
        </div>
      </div>
    </div>
  );
}
