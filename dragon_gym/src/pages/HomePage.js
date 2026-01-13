import React, { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';

function HomePage({
  isActive,
  motorsSyncedState,
  syncHidden,
  telemetryConnected,
  forceCurveOpen,
  setForceCurveOpen,
  selectorOpen,
  setSelectorOpen,
  exerciseCatalog,
  videoSrc,
  refs,
}) {
  const [forceCurveSpin, setForceCurveSpin] = useState(false);
  const lastForceCurveToggleRef = useRef(0);
  const {
    workoutStateRef,
    startToggleRef,
    startToggleHomeSlotRef,
    pauseIconRef,
    setToggleRef,
    setControlRowRef,
    setControlGroupRef,
    simPanelRef,
    resetRef,
    setStatusRef,
    leftStatusRepsRef,
    rightStatusRepsRef,
    waveRepRef,
    messageRef,
    repCurveLabelRef,
    leftWaveLegendRef,
    rightWaveLegendRef,
    forceSelectRef,
    forceDescriptionRef,
    powerToggleRef,
    adsResetRef,
    syncMotorsRef,
    leftGaugeRef,
    leftSimRef,
    leftCurrentResistanceRef,
    leftBaseResistanceRef,
    leftCableDistanceRef,
    leftEngageDisplayRef,
    leftSetCableLengthRef,
    leftRetractCableRef,
    rightGaugeRef,
    rightSimRef,
    rightCurrentResistanceRef,
    rightBaseResistanceRef,
    rightCableDistanceRef,
    rightEngageDisplayRef,
    rightSetCableLengthRef,
    rightRetractCableRef,
    waveCombinedRef,
    forceLabelRef,
    forceCurveConcentricRef,
    forceCurveEccentricRef,
    forceCurveModePillRef,
    eccentricTogglePillRef,
    eccentricModePillRef,
    eccentricToggleRef,
    eccentricPanelRef,
    eccentricSelectRef,
    eccentricDescriptionRef,
    forceCurveIntensityRefElement,
    forcePanelRef,
    forceLockHintRef,
    setCompleteOverlayRef,
    setCompleteFireworksRef,
    setCompleteSuccessRef,
    exerciseSelectRef,
    exerciseTitleRef,
  } = refs;
  const handleForceModeCycle = () => {
    window.dispatchEvent(new Event('dg:forceModeCycle'));
    const select = forceSelectRef?.current || document.getElementById('forceCurve');
    if (select && select.options.length && forceCurveModePillRef?.current) {
      forceCurveModePillRef.current.textContent =
        select.options[select.selectedIndex].text;
    }
  };

  const handleEccentricTogglePill = (event) => {
    window.dispatchEvent(new Event('dg:eccentricToggle'));
    void event;
  };

  const handleEccentricModeCycle = () => {
    window.dispatchEvent(new Event('dg:eccentricModeCycle'));
    const select =
      eccentricSelectRef?.current || document.getElementById('eccentricCurve');
    if (select && select.options.length && eccentricModePillRef?.current) {
      eccentricModePillRef.current.textContent =
        select.options[select.selectedIndex].text;
    }
  };

  const handleForceCurveToggle = (event) => {
    event.preventDefault();
    const now = window.performance?.now ? window.performance.now() : Date.now();
    if (now - lastForceCurveToggleRef.current < 250) {
      return;
    }
    lastForceCurveToggleRef.current = now;
    setForceCurveOpen((prev) => !prev);
    setForceCurveSpin(true);
    window.setTimeout(() => setForceCurveSpin(false), 320);
  };

  useEffect(() => {
    const fireworksContainer = setCompleteFireworksRef?.current;
    const successContainer = setCompleteSuccessRef?.current;
    if (!fireworksContainer || !successContainer) {
      return undefined;
    }

    const fireworksAnim = lottie.loadAnimation({
      container: fireworksContainer,
      renderer: 'svg',
      loop: true,
      autoplay: false,
      path: '/assets/animations/Fireworks.json',
    });

    const successAnim = lottie.loadAnimation({
      container: successContainer,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: '/assets/animations/Successful.json',
    });

    fireworksContainer._lottie = fireworksAnim;
    successContainer._lottie = successAnim;

    return () => {
      fireworksAnim.destroy();
      successAnim.destroy();
    };
  }, [setCompleteFireworksRef, setCompleteSuccessRef]);

  return (
    <main
      className={`app-shell ${motorsSyncedState ? 'is-synced' : ''}`}
      hidden={!isActive}
    >
      <div className="set-complete-overlay" ref={setCompleteOverlayRef} aria-hidden="true">
        <div className="set-complete-fireworks" ref={setCompleteFireworksRef}></div>
        <div className="set-complete-success" ref={setCompleteSuccessRef}></div>
      </div>
      <section className="resistance-overview" aria-label="Resistance overview">
        <div className="rep-curve-label" aria-live="polite" ref={repCurveLabelRef}>
          <span className="rep-curve-text">Rep</span>
          <span className="rep-curve-count" ref={waveRepRef}>
            0
          </span>
        </div>
        <div className="bottom-actions top-actions" aria-label="Power controls">
          <button
            className="reset-toggle"
            id="adsReset"
            ref={adsResetRef}
            type="button"
            disabled={!telemetryConnected}
          >
            Reset
          </button>
          <button
            className="power-toggle"
            id="powerToggle"
            ref={powerToggleRef}
            type="button"
            disabled={!telemetryConnected}
          >
            Shutdown
          </button>
        </div>
        <article className="status-card" aria-label="Workout status" aria-live="polite">
          <header className="status-header">
            <span className="status-pill sr-only" id="workoutState" ref={workoutStateRef}>
              Workout Not Started
            </span>
          </header>
          <div className="status-controls" aria-label="Workout controls">
            <div className="workout-toggle"></div>
          </div>
          <p className="status-message" id="workoutMessage" ref={messageRef}>
          </p>
        </article>
        <article className="combined-card is-concave-top" aria-label="Resistance gauges and wave">
          <div className="engagement-corners" aria-hidden="true">
            <div className="engagement-corner left">
              <span className="label">Base</span>
              <span className="value" id="leftBaseResistance" ref={leftBaseResistanceRef}>
                0 lb
              </span>
            </div>
            <div className="engagement-corner right">
              <span className="label">Base</span>
              <span className="value" id="rightBaseResistance" ref={rightBaseResistanceRef}>
                0 lb
              </span>
            </div>
          </div>
          <div className="motor-grid">
            <article className="motor-card" data-motor="left">
              <div className="gauge-wrapper">
                <canvas
                  className="resistance-gauge"
                  id="leftGauge"
                  ref={leftGaugeRef}
                  width="540"
                  height="540"
                  aria-hidden="true"
                ></canvas>
                <div className="gauge-center">
                  <span className="current-resistance">
                    <span
                      className="current-resistance-value"
                      id="leftCurrentResistance"
                      ref={leftCurrentResistanceRef}
                    >
                      0
                    </span>
                    <span className="current-resistance-unit">LB</span>
                  </span>
                </div>
              </div>
              <div className="engagement-readout" aria-live="polite">
                <span className="label">Left engagement</span>
                <span className="value" id="leftEngageDisplay" ref={leftEngageDisplayRef}>
                  1.0 in
                </span>
              </div>
            </article>

            <article
              className={`motor-card ${motorsSyncedState ? 'is-synced-hidden' : ''}`}
              data-motor="right"
              hidden={syncHidden}
            >
              <div className="gauge-wrapper">
                <canvas
                  className="resistance-gauge"
                  id="rightGauge"
                  ref={rightGaugeRef}
                  width="540"
                  height="540"
                  aria-hidden="true"
                ></canvas>
                <div className="gauge-center">
                  <span className="current-resistance">
                    <span
                      className="current-resistance-value"
                      id="rightCurrentResistance"
                      ref={rightCurrentResistanceRef}
                    >
                      0
                    </span>
                    <span className="current-resistance-unit">LB</span>
                  </span>
                </div>
              </div>
              <div className="engagement-readout" aria-live="polite">
                <span className="label">Right engagement</span>
                <span className="value" id="rightEngageDisplay" ref={rightEngageDisplayRef}>
                  1.0 in
                </span>
              </div>
            </article>
          </div>
          <div className="wave-grid">
            <article className="wave-card" data-motor="combined">
              <header>
                <div className="wave-legend" role="group" aria-label="Wave graph toggles">
                  <button
                    type="button"
                    className="wave-legend-btn"
                    ref={leftWaveLegendRef}
                    aria-pressed="true"
                  >
                    <span className="wave-legend-label">Left</span>
                    <span className="wave-legend-swatch left" aria-hidden="true"></span>
                  </button>
                  <button
                    type="button"
                    className="wave-legend-btn"
                    ref={rightWaveLegendRef}
                    aria-pressed="true"
                  >
                    <span className="wave-legend-label">Right</span>
                    <span className="wave-legend-swatch right" aria-hidden="true"></span>
                  </button>
                  <button
                    type="button"
                    className="wave-legend-btn sync-toggle"
                    id="syncMotors"
                    ref={syncMotorsRef}
                    aria-pressed={motorsSyncedState}
                  >
                    <span className="wave-legend-label">
                      {motorsSyncedState ? 'Unsync' : 'Sync'} Motors
                    </span>
                  </button>
                </div>
              </header>
              <canvas
                className="wave-canvas"
                id="combinedWave"
                ref={waveCombinedRef}
                width="960"
                height="520"
                aria-hidden="true"
              ></canvas>
            </article>
          </div>
        </article>
      </section>
      <section className="workspace">
        <section className="set-controls-panel" aria-label="Set controls">
          <div className="status-controls">
            <div className="start-toggle-slot" ref={startToggleHomeSlotRef}>
              <button
                className="primary"
                id="toggleWorkout"
                ref={startToggleRef}
                type="button"
                aria-pressed="false"
              >
                Start Workout
              </button>
            </div>
            <div
              className="set-control-group"
              aria-label="Set controls"
              ref={setControlGroupRef}
              hidden
            >
              <div className="set-control-row" ref={setControlRowRef}>
                <button
                  className="accent"
                  id="setToggle"
                  ref={setToggleRef}
                  type="button"
                  disabled
                  aria-pressed="false"
                >
                  Start Set
                </button>
                <button
                  className="set-control-icon pause-toggle"
                  id="pauseToggle"
                  ref={pauseIconRef}
                  type="button"
                  aria-pressed="false"
                  hidden
                >
                  <img src="/assets/icons/pause.png" alt="Pause" />
                </button>
              </div>
              <button
                className="ghost"
                id="resetWorkout"
                ref={resetRef}
                type="button"
                disabled
                hidden
              >
                Reset
              </button>
              
            </div>
          </div>
          <div className="status-stack">
            <div className="status-metrics">
              <div>
                <span className="label">Reps Left</span>
                <span className="value" id="repStatusLeft" ref={leftStatusRepsRef}>
                  0 / 12
                </span>
              </div>
              <div>
                <span className="label">Set</span>
                <span className="value" id="setStatus" ref={setStatusRef}>
                  0
                </span>
              </div>
              <div>
                <span className="label">Reps Right</span>
                <span className="value" id="repStatusRight" ref={rightStatusRepsRef}>
                  0 / 12
                </span>
              </div>
            </div>
            <div className="engagement-grid">
              <div className="motor-engagement" aria-label="Left motor cable engagement">
                <div className="engagement-actions">
                  <button
                    type="button"
                    className="ghost"
                    id="leftSetCableLength"
                    ref={leftSetCableLengthRef}
                  >
                    Set Cable Length
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    id="leftRetractCable"
                    ref={leftRetractCableRef}
                  >
                    Retract Cable
                  </button>
                </div>
              </div>
              <div className="motor-engagement" aria-label="Right motor cable engagement">
                <div className="engagement-actions">
                  <button
                    type="button"
                    className="ghost"
                    id="rightSetCableLength"
                    ref={rightSetCableLengthRef}
                  >
                    Set Cable Length
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    id="rightRetractCable"
                    ref={rightRetractCableRef}
                  >
                    Retract Cable
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          className="simulator-panel"
          aria-label="Cable length simulator"
          ref={simPanelRef}
        >
          <h3>Cable Length Simulator</h3>
          <div className="sim-slider-group">
            <label className="sim-slider" htmlFor="leftSim">
              <span>Left cable length (in)</span>
              <input
                id="leftSim"
                ref={leftSimRef}
                type="range"
                min="0"
                max="24"
                step="0.1"
                defaultValue="0"
              />
              <span id="leftCableDistance" ref={leftCableDistanceRef}>
                0.0 in
              </span>
            </label>
            <label className="sim-slider" htmlFor="rightSim">
              <span>Right cable length (in)</span>
              <input
                id="rightSim"
                ref={rightSimRef}
                type="range"
                min="0"
                max="24"
                step="0.1"
                defaultValue="0"
              />
              <span id="rightCableDistance" ref={rightCableDistanceRef}>
                0.0 in
              </span>
            </label>
          </div>
        </section>
        <section
          className="force-panel"
          aria-label="Force curve profiles"
          id="forceCurvePanel"
          ref={forcePanelRef}
        >
          <button
            className="card-toggle"
            type="button"
            aria-expanded={forceCurveOpen}
            aria-controls="forceCurveBody"
            onClick={handleForceCurveToggle}
          >
            <span>Force Curve</span>
            <img
              className={`card-toggle-icon${forceCurveSpin ? ' is-spinning' : ''}`}
              src="/assets/icons/settings.png"
              alt=""
            />
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
                      <option value="linear">Disabled</option>
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
                    <option value="eccentric">Linear</option>
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
          <div
            className="force-curve-summary"
            hidden={forceCurveOpen}
          >
            <button
              className="force-pill mode"
              type="button"
              ref={forceCurveModePillRef}
              data-action="mode"
              onClick={handleForceModeCycle}
            >
              Disabled
            </button>
            <button
              className="force-pill eccentric"
              type="button"
              ref={eccentricTogglePillRef}
              data-action="eccentric"
              aria-pressed="false"
              onClick={handleEccentricTogglePill}
            >
              Eccentric
            </button>
            <button
              className="force-pill eccentric-mode"
              type="button"
              ref={eccentricModePillRef}
              data-action="eccentric-mode"
              aria-pressed="false"
              onClick={handleEccentricModeCycle}
            >
              Linear
            </button>
          </div>
        </section>
        
      </section>
    </main>
  );
}

export default HomePage;
