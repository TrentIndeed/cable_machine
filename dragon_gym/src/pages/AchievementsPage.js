import React from 'react';
import {
  Trophy,
  Flame,
  Zap,
  ArrowLeft,
  Dumbbell,
  Share2,
  Calendar,
  Activity,
  Award,
} from 'lucide-react';

function AchievementCard({ icon: Icon, title, value, status, colorClass, delay }) {
  return (
    <div className={`ach-card ${colorClass}`} style={{ animationDelay: `${delay}s` }}>
      <div className="ach-card__icon">
        <Icon size={26} />
      </div>
      <div className="ach-card__meta">
        <div className="ach-card__title">
          {title}
          {value ? <span className="ach-card__value">{value}</span> : null}
        </div>
        <div className="ach-card__status">{status}</div>
      </div>
    </div>
  );
}

function AchievementsPage({ isActive, onBack }) {
  return (
    <main className="app-shell achievements-shell" hidden={!isActive}>
      <header className="ach-header">
        <button className="ach-back" type="button" onClick={onBack}>
          <ArrowLeft size={22} />
          Back
        </button>
        <h1 className="ach-title">Achievements</h1>
        <button className="ach-share" type="button" aria-label="Share">
          <Share2 size={20} />
        </button>
      </header>

      <section className="ach-hero">
        <div className="ach-hero__row">
          <p>Today</p>
          <Calendar size={16} />
        </div>
        <div className="ach-hero__card">
          <div className="ach-hero__glow ach-hero__glow--blue"></div>
          <div className="ach-hero__glow ach-hero__glow--purple"></div>
          <div className="ach-hero__badge">
            <Trophy size={60} />
          </div>
          <h2>First Push Workout</h2>
          <div className="ach-hero__time">
            <span>Time:</span>
            <strong>7:42 AM</strong>
          </div>
        </div>
      </section>

      <section className="ach-section">
        <div className="ach-section__title">
          <span>This Week</span>
          <Activity size={16} />
        </div>
        <div className="ach-grid">
          <AchievementCard
            icon={Flame}
            title="Total Calories"
            value="500"
            status="Unlocked"
            colorClass="ach-card--orange"
            delay={0.05}
          />
          <AchievementCard
            icon={Zap}
            title="Current Streak"
            value="3 Days"
            status="Unlocked"
            colorClass="ach-card--yellow"
            delay={0.1}
          />
        </div>
      </section>

      <section className="ach-section">
        <div className="ach-section__title">
          <span>Strength Milestones</span>
          <Award size={16} />
        </div>
        <div className="ach-grid">
          <AchievementCard
            icon={Dumbbell}
            title="Volume Milestone"
            value="5k Lbs"
            status="Unlocked"
            colorClass="ach-card--blue"
            delay={0.15}
          />
          <AchievementCard
            icon={Zap}
            title="Longest Set"
            value="10 Reps"
            status="Unlocked"
            colorClass="ach-card--purple"
            delay={0.2}
          />
          <AchievementCard
            icon={Dumbbell}
            title="Heavy Leg Press"
            value=""
            status="PR Set"
            colorClass="ach-card--green"
            delay={0.25}
          />
          <AchievementCard
            icon={Trophy}
            title="Bench Press"
            value="PB"
            status="Unlocked"
            colorClass="ach-card--indigo"
            delay={0.3}
          />
        </div>
      </section>
    </main>
  );
}

export default AchievementsPage;
