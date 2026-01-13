import React from 'react';

const ACHIEVEMENTS_WEEK = [
  {
    id: 'calories',
    title: 'Total Calories',
    value: '500',
    status: 'Unlocked',
    color: 'amber',
    icon: 'F',
  },
  {
    id: 'streak',
    title: 'Current Streak',
    value: '3 Days',
    status: 'Unlocked',
    color: 'gold',
    icon: 'Z',
  },
];

const ACHIEVEMENTS_STRENGTH = [
  {
    id: 'volume',
    title: 'Volume Milestone',
    value: '5k Lbs',
    status: 'Unlocked',
    color: 'blue',
    icon: 'D',
  },
  {
    id: 'longest',
    title: 'Longest Set',
    value: '10 Reps',
    status: 'Unlocked',
    color: 'violet',
    icon: 'Z',
  },
  {
    id: 'leg-press',
    title: 'Heavy Leg Press',
    value: '',
    status: 'PR Set',
    color: 'emerald',
    icon: 'D',
  },
  {
    id: 'bench',
    title: 'Bench Press',
    value: 'PB',
    status: 'Unlocked',
    color: 'indigo',
    icon: 'T',
  },
];

function AchievementCard({ icon, title, value, status, color, delay }) {
  return (
    <div
      className={`achievement-card achievement-card--${color}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="achievement-icon" aria-hidden="true">
        <span className="achievement-icon-letter">{icon}</span>
      </div>
      <div className="achievement-copy">
        <h3 className="achievement-title">
          {title}
          {value ? <span className="achievement-value"> {value}</span> : null}
        </h3>
        <p className="achievement-status">{status}</p>
      </div>
    </div>
  );
}

function AchievementsPage({ isActive, onBack }) {
  return (
    <main className="app-shell achievements-shell" hidden={!isActive}>
      <header className="achievements-header">
        <button className="achievements-back" type="button" onClick={onBack}>
          <img src="/assets/icons/backButton.png" alt="" aria-hidden="true" />
          Back
        </button>
        <h1>Achievements</h1>
        <button className="achievements-share" type="button">
          Share
        </button>
      </header>

      <section className="achievements-hero">
        <div className="achievements-hero-header">
          <p>Today&apos;s Highlight</p>
          <span className="achievements-hero-date">Today</span>
        </div>
        <div className="achievements-hero-card">
          <div className="achievements-hero-glow achievements-hero-glow--left" />
          <div className="achievements-hero-glow achievements-hero-glow--right" />
          <div className="achievements-hero-trophy">
            <span className="achievement-icon-letter">T</span>
          </div>
          <h2>First Push Workout</h2>
          <div className="achievements-hero-pill">
            <span>Time</span>
            <strong>07:42 AM</strong>
          </div>
        </div>
      </section>

      <section className="achievements-section">
        <div className="achievements-section-header">
          <p>This Week</p>
          <span>Activity</span>
        </div>
        <div className="achievements-grid">
          {ACHIEVEMENTS_WEEK.map((item, index) => (
            <AchievementCard key={item.id} {...item} delay={0.1 + index * 0.1} />
          ))}
        </div>
      </section>

      <section className="achievements-section">
        <div className="achievements-section-header">
          <p>Strength Milestones</p>
          <span>Awards</span>
        </div>
        <div className="achievements-grid">
          {ACHIEVEMENTS_STRENGTH.map((item, index) => (
            <AchievementCard key={item.id} {...item} delay={0.3 + index * 0.1} />
          ))}
        </div>
      </section>
    </main>
  );
}

export default AchievementsPage;
