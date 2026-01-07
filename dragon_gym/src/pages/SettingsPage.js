import React from 'react';
import { FONT_OPTIONS } from '../constants/appConstants';

function SettingsPage({ isActive, uiFont, onFontChange, onBack }) {
  return (
    <main className="app-shell settings-shell" hidden={!isActive}>
      <section className="settings-panel" aria-label="Settings">
        <header className="settings-header">
          <h2>Settings</h2>
          <p>Appearance and typography</p>
        </header>
        <div className="settings-group">
          <label htmlFor="fontSelect">UI font</label>
          <select id="fontSelect" value={uiFont} onChange={onFontChange}>
            {FONT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>
      <button
        className="settings-back"
        type="button"
        onClick={onBack}
        aria-label="Back to home"
      >
        Back
      </button>
    </main>
  );
}

export default SettingsPage;
