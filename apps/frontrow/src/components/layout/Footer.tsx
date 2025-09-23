export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-black text-white/80">
      <div className="container mx-auto grid gap-10 py-12 md:grid-cols-4">
        <div>
          <div className="text-white font-extrabold text-xl">GIGS</div>
          <p className="mt-3 text-sm text-white/60 max-w-xs">Discover and buy tickets for the best gigs, clubs and festivals.</p>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Our company</div>
          <ul className="space-y-2 text-sm">
            <li>About</li>
            <li>Careers</li>
            <li>Partners</li>
            <li>Press</li>
          </ul>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Fan support</div>
          <ul className="space-y-2 text-sm">
            <li>Get help</li>
            <li>Refund policy</li>
            <li>Accessibility</li>
          </ul>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Resources</div>
          <ul className="space-y-2 text-sm">
            <li>Guides</li>
            <li>Community</li>
            <li>Developers</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 py-6 text-xs text-white/50">
          <p>© {new Date().getFullYear()} GIGS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
