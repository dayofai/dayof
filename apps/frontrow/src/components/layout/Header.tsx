import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Logo } from '../icons/logo';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const [mobileSearchEntering, setMobileSearchEntering] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile search is open
  useEffect(() => {
    if (!mobileSearchOpen) {
      return;
    }
    const root = document.documentElement;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - root.clientWidth;
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [mobileSearchOpen]);

  function openMobileSearch() {
    setMobileSearchOpen(true);
    // Ensure CSS transitions run after mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMobileSearchEntering(true));
    });
  }

  function closeMobileSearch() {
    setMobileSearchEntering(false);
    // Wait for exit animation then unmount
    setTimeout(() => setMobileSearchOpen(false), 200);
  }

  // Close mobile menu on outside click or Escape
  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }
    const onClick = (e: MouseEvent) => {
      const menuEl = mobileMenuRef.current;
      if (menuEl && !menuEl.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('click', onClick, { capture: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', onClick, { capture: true });
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 border-none transition-colors duration-200 ${
        isScrolled
          ? 'bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/60'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex items-center justify-between gap-4 px-4 py-3 lg:container lg:px-0 lg:py-5">
        <Link
          className="shrink-0 font-extrabold text-white text-xl tracking-tight"
          to="/"
        >
          <Logo theme="light" />
        </Link>

        {/* Desktop search and navigation */}
        <div className="hidden flex-1 items-center justify-between gap-4 md:flex">
          <div className="relative max-w-[360px] flex-1">
            <input
              className="w-full rounded-full bg-white/5 py-3 pr-4 pl-12 text-white placeholder-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-primary"
              placeholder="Search by event, venue or city"
            />
            <svg
              className="-translate-y-1/2 absolute top-1/2 left-4 text-white/60"
              fill="none"
              height="18"
              viewBox="0 0 24 24"
              width="18"
            >
              <title>Search</title>
              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>

          <nav className="hidden items-center gap-6 text-md lg:flex">
            <Link className="text-white hover:text-white" to="/">
              Browse events
            </Link>
            <Link className="text-white hover:text-white" to="/">
              Get help
            </Link>
            <Link className="text-white hover:text-white" to="/">
              Log in / Sign up
            </Link>
          </nav>
        </div>

        {/* Mobile actions */}
        <div
          className="relative flex items-center gap-2 md:hidden"
          ref={mobileMenuRef}
        >
          <button
            aria-label="Search"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-gray-200"
            onClick={openMobileSearch}
            type="button"
          >
            <svg
              fill="none"
              height="24"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Open search</title>
              <path
                clipRule="evenodd"
                d="M9.864 18.16c.324.045.652.068.982.07H10.866a7.343 7.343 0 0 0 4.788-1.77l3.875 3.874a.567.567 0 0 0 .801-.801l-3.874-3.874a7.37 7.37 0 0 0 .535-8.884 7.364 7.364 0 1 0-7.126 11.386Zm6.076-3.68a6.233 6.233 0 1 0-5.076 2.616h.001a6.211 6.211 0 0 0 5.075-2.616Z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
          </button>
          <button
            aria-expanded={mobileMenuOpen}
            aria-label="Menu"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-gray-200"
            onClick={() => setMobileMenuOpen((v) => !v)}
            type="button"
          >
            {mobileMenuOpen ? (
              <svg
                fill="none"
                height="24"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Close menu</title>
                <path
                  d="M18 6L6 18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
                <path
                  d="M6 6L18 18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              <svg
                fill="none"
                height="24"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Open menu</title>
                <path d="M6 6.5h12m0 5.5H6m0 5.5h12" stroke="currentColor" />
              </svg>
            )}
          </button>

          {mobileMenuOpen ? (
            <div className="fixed inset-x-0 top-14 z-50 flex justify-center px-4 md:hidden">
              <div
                className={cn(
                  'w-full rounded bg-white text-black shadow-lg ring-1 ring-black/10',
                  'transition-all duration-200 ease-out',
                  mobileMenuOpen
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-1 opacity-0'
                )}
                role="menu"
              >
                <nav className="divide-y divide-black/10">
                  <Link
                    className="block px-6 py-5 text-lg"
                    onClick={() => setMobileMenuOpen(false)}
                    to="/"
                  >
                    Browse events
                  </Link>
                  <Link
                    className="block px-6 py-5 text-lg"
                    onClick={() => setMobileMenuOpen(false)}
                    to="/"
                  >
                    Get help
                  </Link>
                  <Link
                    className="block px-6 py-5 text-lg"
                    onClick={() => setMobileMenuOpen(false)}
                    to="/"
                  >
                    Log in / Sign up
                  </Link>
                </nav>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile full-screen search overlay */}
      {mobileSearchOpen ? (
        <div
          className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
            mobileSearchEntering ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="px-4 pt-4">
            <div
              className={`relative transform transition-all duration-200 ease-out ${
                mobileSearchEntering
                  ? 'translate-y-0 scale-100 opacity-100'
                  : 'translate-y-3 scale-[0.98] opacity-0'
              }`}
            >
              <input
                autoFocus
                className="h-12 w-full rounded-full bg-white pr-12 pl-12 text-black placeholder-black/60 shadow-[0_2px_12px_rgba(0,0,0,0.25)] outline-none ring-1 ring-black/10"
                placeholder="Search by event, venue or city"
                type="text"
              />
              <svg
                className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-6 text-black/80"
                fill="none"
                height="20"
                viewBox="0 0 24 24"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Search</title>
                <path
                  d="M21 21l-4.35-4.35"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <button
                aria-label="Close search"
                className="-translate-y-1/2 absolute top-1/2 right-2 rounded-full p-2 text-black/60 hover:bg-black/5"
                onClick={closeMobileSearch}
                type="button"
              >
                <svg
                  fill="none"
                  height="20"
                  viewBox="0 0 24 24"
                  width="20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Close search</title>
                  <path
                    d="M18 6L6 18"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                  <path
                    d="M6 6L18 18"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
