import { ReactElement } from 'react';
import { DiscoveryNav } from '../machines/discovery';
import { Icon } from './Icon';

export interface SidebarProps {
  /** Which view is currently showing. */
  active: DiscoveryNav;
  onNavigate: (nav: DiscoveryNav) => void;
  onLogout: () => void;
  loggingOut?: boolean;
}

const NAV_ITEMS: { id: DiscoveryNav; icon: ReactElement; label: string }[] = [
  { id: 'discover', icon: <Icon.Food />, label: 'Discover' },
  { id: 'saved', icon: <Icon.Bookmark />, label: 'Saved' },
  { id: 'profile', icon: <Icon.User />, label: 'Profile' },
];

/**
 * The application sidebar.
 *
 * Shared by the Discover screen and the Saved overlay so that the "which
 * view am I in" indicator has exactly one source of truth (`active`), rather
 * than one `activeNav` state plus two `show*` booleans kept in sync by hand.
 */
export default function Sidebar({ active, onNavigate, onLogout, loggingOut = false }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">AK</div>
        <span className="brand-name">AratKain</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`nav-btn ${active === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
            title={label}
            aria-label={label}
            aria-current={active === id ? 'page' : undefined}
          >
            {icon}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="logout-btn" onClick={onLogout} disabled={loggingOut} title="Log out">
          <Icon.Logout />
          <span>{loggingOut ? '...' : 'Out'}</span>
        </button>
      </div>
    </aside>
  );
}
