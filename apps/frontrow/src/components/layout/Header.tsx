import { Link } from '@tanstack/react-router';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="container mx-auto flex items-center gap-4 py-3">
        <Link to="/" className="shrink-0 text-white font-extrabold tracking-tight text-xl">
          GIGS
        </Link>

        <div className="hidden md:flex flex-1 items-center gap-4">
          <div className="relative flex-1">
            <input
              placeholder="Search by event, venue or city"
              className="w-full rounded-full bg-white/5 text-white placeholder-white/50 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-primary pl-12 pr-4 py-3"
            />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-sm">
            <Link to="/browse" className="text-white/80 hover:text-white">Browse events</Link>
            <Link to="/help" className="text-white/80 hover:text-white">Get help</Link>
            <Link to="/login" className="text-white/80 hover:text-white">Log in / Sign up</Link>
          </nav>

          <Link
            to="/app"
            className="hidden sm:inline-flex items-center justify-center rounded-full bg-white text-black px-4 py-2 font-medium hover:bg-white/90"
          >
            Get the app
          </Link>
        </div>
      </div>
    </header>
  );
}
