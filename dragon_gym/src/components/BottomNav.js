import React from 'react';

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: '/assets/icons/home.png' },
  { key: 'programs', label: 'Programs', icon: '/assets/icons/dumbbell-fitness.png' },
  { key: 'history', label: 'Workout History', icon: '/assets/icons/fitness-time.png' },
  { key: 'achievements', label: 'League', icon: '/assets/icons/users-alt.png' },
  { key: 'profile', label: 'Profile', icon: '/assets/icons/user.png' },
];

function BottomNav({ activePage, onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {NAV_ITEMS.map((item) => {
        const isHome = item.key === 'home';
        const showBack = isHome && activePage !== 'home';
        const icon = showBack ? '/assets/icons/backButton.png' : item.icon;
        const label = showBack ? 'Back' : item.label;
        const target = showBack ? 'home' : item.key;

        return (
          <button
            key={item.key}
            type="button"
            className={`nav-item ${activePage === item.key ? 'is-active' : ''}`}
            onClick={() => onNavigate(target)}
            aria-label={label}
          >
            <img className="nav-icon" src={icon} alt="" aria-hidden="true" />
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
