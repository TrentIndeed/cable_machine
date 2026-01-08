import React from 'react';
import { FONT_OPTIONS } from '../constants/appConstants';

function SettingsPage({
  isActive,
  uiFont,
  onFontChange,
  onBack,
  telemetryConnected,
  telemetryFault,
  telemetryCmdStatus,
  commandStatus,
  commandMessage,
}) {
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
      <section className="debug-panel" aria-label="Command debug">
        <article className="telemetry-card" aria-label="Command debug">
          <header className="telemetry-header">
            <div>
              <h2>Command Debug</h2>
              <p className="telemetry-subtitle">TwinCAT ADS</p>
            </div>
            <div className="telemetry-status">
              <span
                className={`telemetry-connection ${telemetryConnected ? 'is-online' : 'is-offline'}`}
              >
                {telemetryConnected ? 'Connected' : 'Disconnected'}
              </span>
              {telemetryFault ? <span className="telemetry-fault">Fault</span> : null}
            </div>
          </header>
          <p className="command-status" data-state="telemetry">
            CmdStatus: {telemetryCmdStatus}
          </p>
          <p className="command-status" data-state={commandStatus}>
            {commandMessage || 'Ready to send commands.'}
          </p>
        </article>
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
