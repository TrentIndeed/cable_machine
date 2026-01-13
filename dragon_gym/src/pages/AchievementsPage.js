import React, { useState } from 'react';

const FRIENDS_ONLY = [
  {
    rank: 1,
    name: 'NiaFlex',
    lbs: 1245,
    pct: 0.62,
    color: 'blue',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=60',
  },
  {
    rank: 2,
    name: 'CoachMark',
    lbs: 1102,
    pct: 0.54,
    color: 'teal',
    avatar:
      'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=160&q=60',
  },
  {
    rank: 3,
    name: 'ElPower',
    lbs: 997,
    pct: 0.48,
    color: 'orange',
    avatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=60',
  },
  {
    rank: 4,
    name: 'JoyPowers',
    lbs: 991,
    pct: 0.47,
    color: 'blue',
    avatar:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=160&q=60',
  },
  {
    rank: 5,
    name: 'LenaK',
    lbs: 860,
    pct: 0.41,
    color: 'teal',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=60',
  },
];

const GLOBAL = [
  {
    rank: 1,
    name: 'AtlasLifts',
    lbs: 1890,
    pct: 0.78,
    color: 'blue',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=60',
  },
  {
    rank: 2,
    name: 'NovaStrength',
    lbs: 1765,
    pct: 0.72,
    color: 'teal',
    avatar:
      'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=160&q=60',
  },
  {
    rank: 3,
    name: 'IronWarden',
    lbs: 1692,
    pct: 0.7,
    color: 'orange',
    avatar:
      'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=160&q=60',
  },
  {
    rank: 4,
    name: 'PulsePrime',
    lbs: 1608,
    pct: 0.66,
    color: 'blue',
    avatar:
      'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=160&q=60',
  },
  {
    rank: 5,
    name: 'Valkyrie',
    lbs: 1544,
    pct: 0.63,
    color: 'teal',
    avatar:
      'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=160&q=60',
  },
];

const FILL_GRADIENT = {
  teal: 'linear-gradient(90deg, rgba(22, 242, 190, 1), rgba(18, 214, 255, 0.9))',
  orange: 'linear-gradient(90deg, rgba(255, 176, 32, 1), rgba(255, 136, 32, 0.95))',
  blue: 'linear-gradient(90deg, rgba(45, 163, 255, 1), rgba(18, 214, 255, 1))',
};

const rankClass = (rank) => {
  if (rank === 1) {
    return 'league-rank--gold';
  }
  if (rank === 2) {
    return 'league-rank--silver';
  }
  if (rank === 3) {
    return 'league-rank--bronze';
  }
  return 'league-rank--plain';
};

const fillGradient = (color) => FILL_GRADIENT[color] || FILL_GRADIENT.blue;

function AchievementsPage({ isActive }) {
  const [scope, setScope] = useState('friends');
  const rows = scope === 'friends' ? FRIENDS_ONLY : GLOBAL;

  return (
    <main className="app-shell league-shell" hidden={!isActive}>
      <header className="league-header">
        <div>
          <p className="league-kicker">Monthly League</p>
          <div className="league-title-row">
            <h1 className="league-title">January League</h1>
            <svg className="league-trophy" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 4h2a1 1 0 0 1 1 1v2a5 5 0 0 1-5 5h-.35A6.99 6.99 0 0 1 13 14.92V17h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2.08A6.99 6.99 0 0 1 8.35 12H8a5 5 0 0 1-5-5V5a1 1 0 0 1 1-1h2V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1Z"
                fill="rgba(255, 176, 32, 0.95)"
              />
              <path
                d="M6 6H4v1a3 3 0 0 0 3 3h.03A7 7 0 0 1 6 6Zm14 0h-2a7 7 0 0 1-1.03 4H17a3 3 0 0 0 3-3V6Z"
                fill="rgba(255, 206, 92, 0.95)"
              />
              <path
                d="M9 21a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1Z"
                fill="rgba(255, 176, 32, 0.7)"
              />
            </svg>
          </div>
        </div>
        <div className="league-seg" role="tablist" aria-label="League scope">
          <button
            type="button"
            className={scope === 'friends' ? 'is-active' : ''}
            role="tab"
            aria-selected={scope === 'friends'}
            onClick={() => setScope('friends')}
          >
            Friends Only
          </button>
          <button
            type="button"
            className={scope === 'global' ? 'is-active' : ''}
            role="tab"
            aria-selected={scope === 'global'}
            onClick={() => setScope('global')}
          >
            Global
          </button>
        </div>
      </header>

      <section className="league-board" aria-label="Leaderboard">
        {rows.map((row) => (
          <div className="league-row" key={`${row.rank}-${row.name}`}>
            <div className={`league-rank ${rankClass(row.rank)}`}>{row.rank}</div>
            <div className="league-avatar">
              {row.avatar ? <img alt={row.name} src={row.avatar} /> : null}
            </div>
            <div className="league-who">
              <div className="league-name">{row.name}</div>
              <div className="league-bar" aria-hidden="true">
                <div
                  className="league-fill"
                  style={{
                    width: `${Math.round(row.pct * 100)}%`,
                    background: fillGradient(row.color),
                  }}
                />
              </div>
            </div>
            <div className="league-lbs">
              {row.lbs.toLocaleString()}
              <span>lb</span>
            </div>
          </div>
        ))}
      </section>

      <div className="league-timeline" aria-label="Month timeline">
        <span className="league-dot" aria-hidden="true" />
        <span>2in</span>
        <span>3w</span>
        <span>5w</span>
      </div>
    </main>
  );
}

export default AchievementsPage;
