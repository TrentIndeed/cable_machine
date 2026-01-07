import React from 'react';

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: '/assets/icons/home.png' },
  { key: 'programs', label: 'Programs', icon: '/assets/icons/chart-histogram.png' },
  { key: 'live', label: 'Live', icon: '/assets/icons/users-alt.png' },
  { key: 'history', label: 'History', icon: '/assets/icons/settings-sliders.png' },
  { key: 'profile', label: 'Profile', icon: '/assets/icons/user.png' },
  { key: 'settings', label: 'Settings', icon: '/assets/icons/settings.png' },
];

function BottomNav({ activePage, onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`nav-item ${activePage === item.key ? 'is-active' : ''}`}
          onClick={() => onNavigate(item.key)}
          aria-label={item.label}
        >
          <img className="nav-icon" src={item.icon} alt="" aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}

export default BottomNav;
