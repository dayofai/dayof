import { useEffect } from 'react';
import styles from './styles.module.css';
import { Logo } from '@/components/icons/logo';
import { Divider } from '@/components/ui/divider';

const BREAKPOINT_LG = 1024;
const RESIZE_DEBOUNCE_MS = 100;

const FOOTER_DATA = {
  sections: [
    {
      title: 'Our company',
      links: [
        { label: 'About DayOf', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Diversity, equity & inclusion', href: '/diversity' },
      ],
    },
    {
      title: 'Fan Support',
      links: [
        { label: 'Get help', href: '/help' },
        { label: 'FAQs', href: '/faq' },
        { label: 'Request a refund', href: '/refund' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Blog', href: '/blog' },
        { label: 'Press', href: '/press' },
        { label: 'Partners', href: '/partners' },
      ],
    },
  ],
  legal: {
    copyright: `© ${new Date().getFullYear()} DayOf FM Holdings Ltd`,
    trademark:
      'DayOf and The Fan logo are registered trademarks of DayOf FM Holdings Ltd.',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Use', href: '/terms' },
      { label: 'Purchase Terms', href: '/purchase-terms' },
      { label: 'Cookie Settings', href: '/cookies' },
    ],
  },
} as const;

export default function Footer() {
  useEffect(() => {
    const detailsElements = document.querySelectorAll(
      `.${styles.detailsElement}`
    );

    const setDetailsState = () => {
      const isLargeScreen = window.innerWidth >= BREAKPOINT_LG;
      for (const details of detailsElements) {
        if (isLargeScreen) {
          details.setAttribute('open', '');
        } else {
          details.removeAttribute('open');
        }
      }
    };

    setDetailsState();

    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(setDetailsState, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <footer className="mt-20 border-gray-200 border-t bg-white text-gray-800">
      <div className="mx-auto flex-row flex-wrap px-4 pt-[50px] lg:container lg:flex lg:px-0 lg:pb-[50px]">
        {/* Logo */}
        <div>
          <Logo theme="dark"/>
        </div>

        {/* Links */}
        <nav
          aria-label="Footer navigation"
          className="mt-15 flex-[1_1_0%] flex-row flex-wrap justify-end gap-4 lg:mt-0 lg:flex"
        >
          {FOOTER_DATA.sections.map((section) => (
            <details
              className={`mb-3 w-full lg:ml-6 lg:w-[200px] ${styles.detailsElement}`}
              key={section.title}
              open={true}
            >
              <summary
                className={`flex h-[24px] cursor-pointer list-none justify-between font-semibold text-black text-xs leading-5 lg:text-base ${styles.detailsSummary}`}
              >
                {section.title}
                <svg
                  className={`lg:hidden ${styles.arrowIcon}`}
                  fill="none"
                  height="32"
                  viewBox="0 0 24 24"
                  width="32"
                >
                  <title>Arrow Icon</title>
                  <path
                    d="M17.5 9.5 12 15 6.5 9.5"
                    stroke="currentColor"
                    strokeLinecap="square"
                  />
                </svg>
              </summary>
              <ul>
                {section.links.map((link) => (
                  <li className="my-6" key={link.label}>
                    <a
                      aria-label={`${link.label} - ${section.title}`}
                      className="text-gray-600 text-xs leading-5 transition-colors hover:text-black lg:text-base"
                      href={link.href}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </nav>
      </div>

      <div className="mx-auto px-4 lg:container lg:px-0">
        <Divider className="dark:border-gray-200" spacing="tight" />
        <div className="container flex flex-col justify-between gap-4 py-3 text-base text-black leading-5 md:flex-row lg:mx-auto lg:items-center lg:py-6">
          <p className="hidden text-base text-black leading-5 lg:block">
            {FOOTER_DATA.legal.copyright}
          </p>
          <nav aria-label="Legal links">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              {FOOTER_DATA.legal.links.map((link) => (
                <a
                  aria-label={link.label}
                  className="text-black text-xs leading-5 transition-colors hover:text-black lg:text-base"
                  href={link.href}
                  key={link.label}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
        </div>
      </div>

      <div className="mx-auto mt-15 mb-[50px] px-4 lg:container lg:mt-0 lg:px-0">
        <div className="container lg:mx-auto text-base text-gray-500 leading-5">
          <p className="text-black text-xs leading-5 lg:hidden lg:text-base">
            {FOOTER_DATA.legal.copyright}
          </p>
          <p className="mt-2 block text-xs leading-5 lg:text-base">
            {FOOTER_DATA.legal.trademark}
          </p>
        </div>
      </div>
    </footer>
  );
}
