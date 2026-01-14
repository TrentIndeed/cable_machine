import React from 'react';

const ACTIVITY_DATA = [
  { day: 'M', height: '40%' },
  { day: 'T', height: '60%' },
  { day: 'W', height: '45%' },
  { day: 'T', height: '85%' },
  { day: 'F', height: '30%' },
  { day: 'S', height: '70%' },
  { day: 'S', height: '50%' },
];

const VOLUME_DATA = [
  { label: 'Chest', value: '4.2k', height: '70%', tone: 'blue' },
  { label: 'Back', value: '5.8k', height: '90%', tone: 'green' },
  { label: 'Legs', value: '3.1k', height: '55%', tone: 'orange' },
  { label: 'Arms', value: '2.4k', height: '40%', tone: 'pink' },
];

const STATS = [
  {
    id: 'calories',
    label: 'Calories',
    value: '1,240',
    unit: 'kcal',
    icon: '🔥',
    tone: 'orange',
  },
  {
    id: 'weight',
    label: 'Weight',
    value: '75.4',
    unit: 'kg',
    icon: '🎯',
    tone: 'blue',
  },
  {
    id: 'workouts',
    label: 'Workouts',
    value: '48',
    unit: 'total',
    icon: '🏆',
    tone: 'gold',
  },
];

const MENU_ITEMS = [
  {
    id: 'training',
    label: 'Training History',
    icon: '/assets/icons/fitness-time.png',
  },
  {
    id: 'records',
    label: 'Personal Records',
    icon: '/assets/icons/chart-histogram.png',
  },
  {
    id: 'badges',
    label: 'Badges & Achievements',
    icon: '/assets/icons/users-alt.png',
    badge: '3 New',
  },
];

function StatCard({ icon, label, value, unit, tone }) {
  return (
    <div className="profile-stat-card">
      <div className={`profile-stat-icon profile-stat-icon--${tone}`} aria-hidden="true">
        {icon}
      </div>
      <span className="profile-stat-label">{label}</span>
      <div className="profile-stat-value">
        <span>{value}</span>
        <span className="profile-stat-unit">{unit}</span>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, badge }) {
  return (
    <button className="profile-menu-item" type="button">
      <span className="profile-menu-icon" aria-hidden="true">
        <img src={icon} alt="" />
      </span>
      <span className="profile-menu-label">{label}</span>
      <span className="profile-menu-meta">
        {badge ? <span className="profile-menu-badge">{badge}</span> : null}
        <span className="profile-menu-chevron" aria-hidden="true">
          ›
        </span>
      </span>
    </button>
  );
}

function ProfilePage({ isActive }) {
  return (
    <main className="app-shell profile-shell" hidden={!isActive}>
      <header className="profile-header">
        <div>
          <p className="profile-eyebrow">Athlete Snapshot</p>
          <h1>Profile</h1>
        </div>
        <button className="profile-settings" type="button" aria-label="Open profile settings">
          <img src="/assets/icons/settings.png" alt="" aria-hidden="true" />
        </button>
      </header>

      <section className="profile-identity" aria-label="Profile summary">
        <div className="profile-avatar">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=240&auto=format&fit=crop"
            alt="Alex Johnson"
          />
          <span className="profile-avatar-add" aria-hidden="true">
            +
          </span>
        </div>
        <div className="profile-identity-copy">
          <h2>Alex Johnson</h2>
          <p>Pro Member since 2023</p>
        </div>
      </section>

      <section className="profile-stats" aria-label="Summary stats">
        {STATS.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </section>

      <section className="profile-volume" aria-label="Total volume">
        <header className="profile-section-header">
          <div>
            <h3>Total Volume</h3>
            <p>Lbs per Group</p>
          </div>
          <span className="profile-section-pill">Last 7 days</span>
        </header>
        <div className="profile-card profile-volume-card">
          {VOLUME_DATA.map((item) => (
            <div key={item.label} className="profile-volume-bar">
              <span className="profile-volume-value">{item.value}</span>
              <div className="profile-volume-track" aria-hidden="true">
                <div
                  className={`profile-volume-fill profile-volume-fill--${item.tone}`}
                  style={{ height: item.height }}
                />
              </div>
              <span className="profile-volume-label">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="profile-activity" aria-label="Weekly activity">
        <header className="profile-section-header">
          <div>
            <h3>Weekly Activity</h3>
            <p>Sets completed</p>
          </div>
          <button className="profile-link" type="button">
            See Details
          </button>
        </header>
        <div className="profile-card profile-activity-card">
          {ACTIVITY_DATA.map((item, index) => (
            <div key={`${item.day}-${index}`} className="profile-activity-bar">
              <div className="profile-activity-track" aria-hidden="true">
                <div
                  className={`profile-activity-fill ${index === 3 ? 'is-active' : ''}`}
                  style={{ height: item.height }}
                />
              </div>
              <span className={`profile-activity-label ${index === 3 ? 'is-active' : ''}`}>
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="profile-menu" aria-label="Profile actions">
        {MENU_ITEMS.map((item) => (
          <MenuItem key={item.id} {...item} />
        ))}
      </section>
    </main>
  );
}

export default ProfilePage;
