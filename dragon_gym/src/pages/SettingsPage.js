import React, { useState } from 'react';

function SettingsPage({
  isActive,
  onBack,
}) {
  const [autoRetract, setAutoRetract] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(false);

  return (
    <main className="app-shell settings-shell" hidden={!isActive}>
      <section className="settings-screen" aria-label="Settings">
        <header className="settings-topbar">
          <button
            className="settings-icon-button"
            type="button"
            onClick={onBack}
            aria-label="Back"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2 className="settings-title">Settings</h2>
          <button className="settings-icon-button" type="button" aria-label="Account">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 12a4.2 4.2 0 1 0 0-8.4A4.2 4.2 0 0 0 12 12Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M4.5 20.4c1.9-4.1 13.1-4.1 15 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="settings-section">
          <p className="settings-section-label">Account</p>
          <button
            className="settings-row-card"
            type="button"
            aria-label="Privacy and Security"
          >
            <span className="settings-row-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M9.2 12.2l1.8 1.8 3.9-3.9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="settings-row-text">Privacy &amp; Security</span>
            <svg className="settings-row-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="settings-section">
          <p className="settings-section-label">App</p>
          <div className="settings-badges">
            <button className="settings-badge settings-badge--gold" type="button" aria-label="Profile">
              <div className="settings-badge-center">
                <div className="settings-badge-art" aria-hidden="true">
                  <svg width="54" height="54" viewBox="0 0 64 64" fill="none">
                    <path d="M32 5l22 13v28L32 59 10 46V18L32 5Z" fill="#3B2F23" opacity=".85" />
                    <path d="M32 9.5l18 10.6v23.8L32 54.5 14 43.9V20.1L32 9.5Z" fill="#B98B3E" opacity=".85" />
                    <circle cx="32" cy="31" r="13" fill="rgba(233,238,249,.92)" />
                    <circle cx="27.5" cy="29" r="1.6" fill="#101626" />
                    <circle cx="36.5" cy="29" r="1.6" fill="#101626" />
                    <path
                      d="M27.5 35c1.8 2.1 7.2 2.1 9 0"
                      stroke="#101626"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span className="settings-badge-label">Profile</span>
                <span className="settings-badge-sub">Edit your profile</span>
              </div>
            </button>
            <button className="settings-badge settings-badge--blue" type="button" aria-label="Language">
              <div className="settings-badge-center">
                <div className="settings-badge-art" aria-hidden="true">
                  <svg width="54" height="54" viewBox="0 0 64 64" fill="none">
                    <path d="M32 6l22 10v16c0 13-9.3 23.8-22 26C19.3 55.8 10 45 10 32V16L32 6Z" fill="rgba(233,238,249,.18)" />
                    <path d="M32 10l18 8.1V32c0 10.9-7.3 19.7-18 22-10.7-2.3-18-11.1-18-22V18.1L32 10Z" fill="rgba(44,107,255,.30)" />
                    <path d="M21 34l10-10 12 12" stroke="rgba(233,238,249,.9)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M30.8 24.2l-9.8 9.8" stroke="rgba(233,238,249,.9)" strokeWidth="3.2" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="settings-badge-label">Language</span>
                <span className="settings-badge-sub">Language &amp; region</span>
              </div>
            </button>
          </div>
        </div>

        <div className="settings-divider" aria-hidden="true"></div>

        <div className="settings-section">
          <p className="settings-section-label">Workout Settings</p>
          <div className="settings-list" role="group" aria-label="Workout Settings">
            <div className="settings-item">
              <span className="settings-item-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 9l6-6 6 6"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 15l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="settings-item-text">Auto Retract</span>
              <span className="settings-item-meta">{autoRetract ? 'On' : 'Off'}</span>
              <button
                className="settings-toggle"
                data-on={autoRetract}
                type="button"
                onClick={() => setAutoRetract((prev) => !prev)}
                aria-pressed={autoRetract}
                aria-label="Toggle Auto Retract"
              >
                <span className="settings-toggle-knob" />
              </button>
            </div>
            <div className="settings-item">
              <span className="settings-item-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7h12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                  <path d="M4 12h16" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                  <path d="M4 17h10" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                </svg>
              </span>
              <span className="settings-item-text">Haptics</span>
              <span className="settings-item-meta">{hapticsEnabled ? 'On' : 'Off'}</span>
              <button
                className="settings-toggle"
                data-on={hapticsEnabled}
                type="button"
                onClick={() => setHapticsEnabled((prev) => !prev)}
                aria-pressed={hapticsEnabled}
                aria-label="Toggle Haptics"
              >
                <span className="settings-toggle-knob" />
              </button>
            </div>
            <button className="settings-item settings-item--link" type="button" aria-label="Smartwatch">
              <span className="settings-item-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="8" y="3" width="8" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
                  <path d="M10 3V1m4 2V1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <span className="settings-item-text">Smartwatch</span>
              <svg className="settings-row-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <button className="settings-logout" type="button">
          Logout
        </button>
      </section>
    </main>
  );
}

export default SettingsPage;
