import React from 'react';
import { ChevronLeft, Trophy, Flame, Zap, Droplets, Dumbbell } from 'lucide-react';

function StatPill({ icon, title, value, subtitle, accentClass }) {
  return (
    <div className="achievement-pill">
      <div className="achievement-pill-icon">{icon}</div>
      <div className="achievement-pill-copy">
        <div className="achievement-pill-title">
          <span>{title}</span>
          {value ? <span className={accentClass}>{value}</span> : null}
        </div>
        <div className="achievement-pill-subtitle">{subtitle}</div>
      </div>
    </div>
  );
}

function BigAchievementCard() {
  return (
    <div className="achievement-hero">
      <div className="achievement-hero-sheen" aria-hidden="true"></div>
      <div className="achievement-badge">
        <div className="achievement-confetti confetti-a" aria-hidden="true"></div>
        <div className="achievement-confetti confetti-b" aria-hidden="true"></div>
        <div className="achievement-confetti confetti-c" aria-hidden="true"></div>
        <div className="achievement-confetti confetti-d" aria-hidden="true"></div>
        <div className="achievement-badge-core">
          <Trophy aria-hidden="true" strokeWidth={1.2} />
        </div>
      </div>
      <div className="achievement-hero-title">First Push Workout</div>
      <div className="achievement-hero-time">
        <span>Time achieved</span>
        <strong>7:42 AM</strong>
      </div>
    </div>
  );
}

function AchievementsPage({ isActive, onBack }) {
  return (
    <main className="app-shell achievements-shell" hidden={!isActive}>
      <header className="achievements-top">
        <button className="achievements-back" type="button" onClick={onBack}>
          <ChevronLeft aria-hidden="true" />
          Back
        </button>
        <h1>Achievements</h1>
        <div className="achievements-top-spacer" aria-hidden="true"></div>
      </header>

      <div className="achievements-content">
        <div className="achievements-label">Today</div>
        <BigAchievementCard />

        <div className="achievements-label">This Week</div>
        <div className="achievement-pill-grid">
          <StatPill
            icon={<Flame className="pill-icon flame" aria-hidden="true" />}
            title="Calories Burned"
            value="500"
            subtitle="Unlocked"
            accentClass="pill-accent"
          />
          <StatPill
            icon={<Droplets className="pill-icon droplet" aria-hidden="true" />}
            title="Streak 3 Days"
            value=""
            subtitle="Unlocked"
            accentClass="pill-accent"
          />
          <StatPill
            icon={<Flame className="pill-icon flame" aria-hidden="true" />}
            title="5k Lbs Lifted"
            value=""
            subtitle="Unlocked"
            accentClass="pill-accent"
          />
          <StatPill
            icon={<Zap className="pill-icon bolt" aria-hidden="true" />}
            title="Longest Set"
            value="10"
            subtitle="Unlocked"
            accentClass="pill-accent"
          />
          <StatPill
            icon={<Dumbbell className="pill-icon dumbbell" aria-hidden="true" />}
            title="Hyrm Lonce Presd"
            value=""
            subtitle="Unlocked"
            accentClass="pill-accent"
          />
          <StatPill
            icon={<Zap className="pill-icon bolt" aria-hidden="true" />}
            title="Bench Press"
            value=""
            subtitle="Dangles / Phn Rep P AM"
            accentClass="pill-accent"
          />
        </div>
      </div>

      <div className="achievements-home-indicator" aria-hidden="true"></div>
      <div className="achievements-bg-sheen" aria-hidden="true"></div>
    </main>
  );
}

export default AchievementsPage;
