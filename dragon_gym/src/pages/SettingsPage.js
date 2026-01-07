import React from 'react';
import { FONT_OPTIONS } from '../constants/appConstants';

function SettingsPage({
  isActive,
  uiFont,
  onFontChange,
  onBack,
  forceCurveOpen,
  setForceCurveOpen,
  telemetryConnected,
  telemetryFault,
  telemetryCmdStatus,
  commandStatus,
  commandMessage,
  refs,
}) {
  const {
    forceSelectRef,
    forceDescriptionRef,
    forceCurveConcentricRef,
    forceCurveEccentricRef,
    eccentricToggleRef,
    eccentricPanelRef,
    eccentricSelectRef,
    eccentricDescriptionRef,
    forceCurveIntensityRefElement,
    forcePanelRef,
    forceLockHintRef,
  } = refs;

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
      <section
        className="force-panel"
        aria-label="Force curve profiles"
        id="forceCurvePanel"
        ref={forcePanelRef}
        hidden
      >
        <button
          className="card-toggle"
          type="button"
          aria-expanded={forceCurveOpen}
          aria-controls="forceCurveBody"
          onClick={() => setForceCurveOpen((prev) => !prev)}
        >
          <span>Force Curve Profiles</span>
        </button>
        <div id="forceCurveBody" className="card-body" hidden={!forceCurveOpen}>
          <p
            className="hint lock-hint"
            id="forceCurveLockHint"
            ref={forceLockHintRef}
            hidden
            aria-live="polite"
          >
            Retract both cables to or below their engagement distance to adjust these settings.
          </p>
          <div className="force-curve-group">
            <div className="force-curve-header">
              <div className="force-curve-inputs">
                <label>
                  <span>Force curve mode</span>
                  <select id="forceCurve" ref={forceSelectRef} defaultValue="linear">
                    <option value="linear">Linear</option>
                    <option value="chain">Chain mode</option>
                    <option value="band">Band mode</option>
                    <option value="reverse-chain">Reverse chain</option>
                  </select>
                </label>
                <label>
                  <span>Force curve intensity (%)</span>
                  <input
                    type="number"
                    id="forceCurveIntensity"
                    ref={forceCurveIntensityRefElement}
                    min="0"
                    max="100"
                    step="1"
                    defaultValue="20"
                  />
                </label>
              </div>
              <button
                className="ghost eccentric-toggle"
                id="eccentricToggle"
                ref={eccentricToggleRef}
                type="button"
                aria-expanded="false"
              >
                Enable eccentric profile
              </button>
            </div>
            <canvas
              className="force-curve-graph"
              id="forceCurveConcentric"
              ref={forceCurveConcentricRef}
              width="640"
              height="220"
              aria-hidden="true"
            ></canvas>
            <p className="hint" id="forceCurveDescription" ref={forceDescriptionRef}>
              Force curve: Equal load through the pull and return.
            </p>
            <canvas
              className="force-curve-graph"
              id="forceCurveEccentric"
              ref={forceCurveEccentricRef}
              width="640"
              height="220"
              aria-hidden="true"
            ></canvas>
            <div className="eccentric-panel" ref={eccentricPanelRef} hidden>
              <label>
                <span>Eccentric profile</span>
                <select id="eccentricCurve" ref={eccentricSelectRef} defaultValue="eccentric">
                  <option value="eccentric">Eccentric mode</option>
                  <option value="chain">Chain mode</option>
                  <option value="band">Band mode</option>
                  <option value="reverse-chain">Reverse chain</option>
                </select>
              </label>
              <p className="hint" id="eccentricCurveDescription" ref={eccentricDescriptionRef}>
                Eccentric: +20% load on the lowering phase.
              </p>
            </div>
          </div>
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
