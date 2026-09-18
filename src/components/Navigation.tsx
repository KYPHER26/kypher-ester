import type { SVGProps } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/timeline', label: 'Memories', icon: HeartIcon },
  { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { to: '/gallery', label: 'Gallery', icon: PhotoIcon },
  { to: '/story', label: 'Our Story', icon: LetterIcon },
  { to: '/profile', label: 'Profile', icon: ProfileIcon },
];

export default function Navigation() {
  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-ink-light/95 backdrop-blur border-t border-ink-border pb-[env(safe-area-inset-bottom)]">
        <ul className="flex justify-between px-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                    isActive ? 'text-rose' : 'text-muted'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:flex-col md:w-56 md:h-screen md:sticky md:top-0 border-r border-ink-border px-4 py-8 gap-1">
        <div className="mb-8 px-2">
          <p className="heading-serif text-lg text-paper">ESTER <span className="text-rose">❤</span> KYPHER</p>
          <p className="text-[11px] text-muted mt-1">🔒 Private space</p>
        </div>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-ink-light text-paper' : 'text-muted hover:text-paper hover:bg-ink-light/60'
              }`
            }
          >
            <Icon className="w-4.5 h-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M12 20s-7-4.4-9.5-9C.8 7.7 2.3 4 6 4c2 0 3.3 1 6 3.5C14.7 5 16 4 18 4c3.7 0 5.2 3.7 3.5 7-2.5 4.6-9.5 9-9.5 9Z" strokeLinejoin="round" />
    </svg>
  );
}
function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" strokeLinecap="round" />
    </svg>
  );
}
function PhotoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M3 16l5-5 4 4 3-3 6 6" strokeLinejoin="round" />
    </svg>
  );
}
function LetterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5 12 13l8.5-6.5" strokeLinejoin="round" />
    </svg>
  );
}
function ProfileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1-3.8 4-6 7.5-6s6.5 2.2 7.5 6" strokeLinecap="round" />
    </svg>
  );
}
