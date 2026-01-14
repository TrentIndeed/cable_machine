import React, { useEffect, useMemo, useRef } from 'react';

const BAR_DATA = [
  {
    label: 'Back',
    value: 72,
    colorClass: 'profile-bar--blue',
    textColor: 'rgba(70, 155, 255, 0.95)',
  },
  {
    label: 'Legs',
    value: 64,
    colorClass: 'profile-bar--green',
    textColor: 'rgba(67, 255, 150, 0.95)',
  },
  {
    label: 'Core',
    value: 38,
    colorClass: 'profile-bar--orange',
    textColor: 'rgba(255, 194, 70, 0.95)',
    isActive: true,
  },
  {
    label: 'Arms',
    value: 95,
    colorClass: 'profile-bar--pink',
    textColor: 'rgba(255, 90, 195, 0.95)',
  },
];

const TUNED_HEIGHTS = {
  Back: 0.78,
  Legs: 0.82,
  Core: 0.62,
  Arms: 0.5,
};

const WEEKLY_NOW = 872;
const WEEKLY_GOAL = 1500;
const MAX_BAR_PX = 800;

function ProfilePage({ isActive, onSettings }) {
  const handleSettings = onSettings || (() => {});
  const trackRef = useRef(null);
  const labelRef = useRef(null);

  const weeklyProgress = useMemo(() => {
    const pct = Math.max(0, Math.min(1, WEEKLY_NOW / WEEKLY_GOAL));
    return {
      pct,
      label: `${WEEKLY_NOW.toLocaleString()} lb`,
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const label = labelRef.current;
    if (!track || !label || !isActive) {
      return undefined;
    }

    const positionLabel = () => {
      const trackWidth = track.clientWidth;
      if (!trackWidth) {
        return;
      }
      const fillWidth = trackWidth * weeklyProgress.pct;
      const padding = 8;
      const labelWidth = label.clientWidth;
      const desiredCenter = fillWidth + 6;
      const clamped = Math.max(
        padding + labelWidth / 2,
        Math.min(trackWidth - padding - labelWidth / 2, desiredCenter)
      );
      label.style.left = `${clamped}px`;
    };

    const rafId = window.requestAnimationFrame(positionLabel);
    const timeoutId = window.setTimeout(positionLabel, 0);
    window.addEventListener('resize', positionLabel);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', positionLabel);
    };
  }, [weeklyProgress.pct, isActive]);

  return (
    <main className="app-shell profile-shell" hidden={!isActive}>
      <header className="profile-header profile-header--floating">
        <div className="profile-title-row">
          <h1 className="profile-title">Smart Gym Profile</h1>
          <svg
            className="profile-trophy"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              fill="#ffcc42"
              d="M18 2H6v2H3v3a5 5 0 0 0 5 5h.1A6 6 0 0 0 11 14.7V18H8v2h8v-2h-3v-3.3A6 6 0 0 0 15.9 12H16a5 5 0 0 0 5-5V4h-3V2Zm-13 5V6h1v4a3 3 0 0 1-2-3Zm16 0a3 3 0 0 1-2 3V6h2v1Z"
            />
          </svg>
          <button
            type="button"
            className="profile-settings"
            onClick={handleSettings}
            aria-label="Open settings"
          >
            <img src="/assets/icons/settings.png" alt="" aria-hidden="true" />
          </button>
        </div>
      </header>
      <div
        className="profile-surface"
        role="application"
        aria-label="Smart Gym Profile"
      >
        <div className="profile-notch" aria-hidden="true" />
        <div className="profile-content">
          <section className="profile-card profile-card--identity">
            <div className="profile-avatar">
              <img
                alt="Profile portrait"
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=70"
              />
            </div>
            <div className="profile-meta">
              <div className="profile-handle">@trentindeed</div>
              <div className="profile-name-row">
                <div className="profile-name">JayPowers</div>
              </div>
              <div className="profile-rank-row">
                <span>Today&apos;s Rank</span>
                <span className="profile-rank-up" aria-hidden="true">
                  ▲
                </span>
              </div>
              <div className="profile-rank">
                5 <span>/ 118</span>
              </div>
            </div>
          </section>

          <section className="profile-card profile-card--chart">
            <div className="profile-chart-header">
              <div className="profile-chart-title">Total Volume 389 lb</div>
            </div>
            <div className="profile-bars" aria-label="Total volume by focus area">
              {BAR_DATA.map((item) => {
                const height = Math.round(
                  MAX_BAR_PX * (TUNED_HEIGHTS[item.label] ?? 0.7)
                );
                return (
                  <div key={item.label} className="profile-bar-col">
                    <div className="profile-bar-value" style={{ color: item.textColor }}>
                      {item.value} lb
                    </div>
                    <div
                      className={`profile-bar ${item.colorClass}`}
                      style={{ height: `${height}px` }}
                    />
                    <div
                      className={`profile-bar-label${item.isActive ? ' is-active' : ''}`}
                    >
                      {item.label}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="profile-home-indicator" aria-hidden="true" />
          </section>

          <section className="profile-card profile-card--goal">
            <div className="profile-goal-header">
              <div className="profile-goal-title">Weekly Goal</div>
              <div className="profile-goal-total">1,500 lb</div>
            </div>
            <div className="profile-progress-track" ref={trackRef}>
              <div
                className="profile-progress-fill"
                style={{ width: `${(weeklyProgress.pct * 100).toFixed(1)}%` }}
              />
              <div className="profile-progress-label" ref={labelRef}>
                {weeklyProgress.label}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default ProfilePage;
