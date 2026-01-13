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
    setStopwatchRef,
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
    workoutSummaryOverlayRef,
    workoutSummaryFireworksRef,
    workoutSummarySuccessRef,
    workoutSummaryRepsRef,
    workoutSummaryAvgLeftRef,
    workoutSummaryAvgRightRef,
    workoutSummaryPeakRef,
    workoutSummaryTimeRef,
    workoutSummaryXpRef,
    workoutSummaryButtonRef,
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
    const targets = [
      {
        container: setCompleteFireworksRef?.current,
        path: '/assets/animations/Fireworks.json',
        loop: true,
      },
      {
        container: setCompleteSuccessRef?.current,
        path: '/assets/animations/Successful.json',
        loop: false,
      },
      {
        container: workoutSummaryFireworksRef?.current,
        path: '/assets/animations/Fireworks.json',
        loop: true,
      },
      {
        container: workoutSummarySuccessRef?.current,
        path: '/assets/animations/Successful.json',
        loop: false,
      },
    ];
    const animations = targets
      .filter((target) => target.container)
      .map((target) => {
        const animation = lottie.loadAnimation({
          container: target.container,
          renderer: 'svg',
          loop: target.loop,
          autoplay: false,
          path: target.path,
        });
        target.container._lottie = animation;
        return animation;
      });

    return () => {
      animations.forEach((animation) => animation.destroy());
    };
  }, [
    setCompleteFireworksRef,
    setCompleteSuccessRef,
    workoutSummaryFireworksRef,
    workoutSummarySuccessRef,
  ]);

  return (
    <main
      className={`app-shell ${motorsSyncedState ? 'is-synced' : ''}`}
      hidden={!isActive}
    >
      <div className="set-complete-overlay" ref={setCompleteOverlayRef} aria-hidden="true">
        <div className="set-complete-fireworks" ref={setCompleteFireworksRef}></div>
        <div className="set-complete-success" ref={setCompleteSuccessRef}></div>
      </div>
      <div
        className="workout-summary-overlay"
        ref={workoutSummaryOverlayRef}
        aria-hidden="true"
      >
        <div className="workout-summary-backdrop"></div>
        <div className="workout-summary-fireworks" ref={workoutSummaryFireworksRef}></div>
        <div className="workout-summary-success" ref={workoutSummarySuccessRef}></div>
        <div className="workout-summary-content" role="dialog" aria-modal="true">
          <div className="workout-summary-headline">Set Complete!</div>
          <div className="workout-summary-card" aria-label="Workout summary">
            <div className="workout-summary-header">
              <div>Workout Summary</div>
              <div className="workout-summary-share" aria-label="Share">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M14 9V5l7 7-7 7v-4H8a5 5 0 0 1-5-5V7h2v3a3 3 0 0 0 3 3h6v-4Z"
                    fill="rgba(255,255,255,.95)"
                  />
                </svg>
                <span>Share</span>
                <span className="workout-summary-share-badge">1</span>
              </div>
            </div>
            <div className="workout-summary-body">
              <div className="workout-summary-top">
                <div>
                  <div className="workout-summary-label">Total Reps</div>
                  <div className="workout-summary-value">
                    <span ref={workoutSummaryRepsRef}>0</span>
                    <span className="workout-summary-unit">reps</span>
                  </div>
                </div>
                <div className="workout-summary-status" aria-label="Set completion status and xp">
                  <svg className="workout-summary-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M9.2 16.4 4.8 12l1.4-1.4 3 3 8.6-8.6L19.2 6l-10 10.4Z"
                      fill="rgba(46, 229, 144, .95)"
                    />
                  </svg>
                  <svg className="workout-summary-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M9.2 16.4 4.8 12l1.4-1.4 3 3 8.6-8.6L19.2 6l-10 10.4Z"
                      fill="rgba(255,255,255,.7)"
                    />
                  </svg>
                  <span>XP</span>
                </div>
              </div>
              <div className="workout-summary-grid">
                <div className="workout-summary-stat">
                  <div className="workout-summary-icon-wrap is-blue" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M8.2 13.7c.8 1.6 2.3 2.3 4 2.3 2.2 0 3.5-1.1 4.6-2.4.5-.7.5-1.7 0-2.4-.6-.9-1.4-1.7-2.5-2.2-.6-.3-1.2-.3-1.7 0l-.7.4-.7-1.2c-.4-.7-1.2-1.1-2-1-1 .1-1.7 1-1.6 2l.2 1.3c-1.3.4-2 1.8-1.6 3.2Z"
                        fill="rgba(255,255,255,.92)"
                      />
                      <path
                        d="M4 16.5c1.4 1.6 3.2 2.5 5.8 2.5h5.1c1.2 0 2.1-.3 2.8-.9"
                        stroke="rgba(255,255,255,.75)"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="workout-summary-meta">
                    <div className="workout-summary-key">Avg Load (L)</div>
                    <div className="workout-summary-stat-value">
                      <span ref={workoutSummaryAvgLeftRef}>0</span>
                      <span className="workout-summary-unit">lb</span>
                    </div>
                  </div>
                </div>
                <div className="workout-summary-stat">
                  <div className="workout-summary-icon-wrap is-green" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 5 12 7.2 15 5l3 2.2 3 2.1-2.4 3.2-1.6-1V20H7V11.5l-1.6 1L3 9.3 6 7.2 9 5Z"
                        fill="rgba(255,255,255,.92)"
                      />
                    </svg>
                  </div>
                  <div className="workout-summary-meta">
                    <div className="workout-summary-key">Avg Load (R)</div>
                    <div className="workout-summary-stat-value">
                      <span ref={workoutSummaryAvgRightRef}>0</span>
                      <span className="workout-summary-unit">lb</span>
                    </div>
                  </div>
                </div>
                <div className="workout-summary-stat">
                  <div className="workout-summary-icon-wrap is-red" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"
                        fill="rgba(255,255,255,.92)"
                      />
                    </svg>
                  </div>
                  <div className="workout-summary-meta">
                    <div className="workout-summary-key">Peak Load</div>
                    <div className="workout-summary-stat-value">
                      <span ref={workoutSummaryPeakRef}>0</span>
                      <span className="workout-summary-unit">lb</span>
                    </div>
                  </div>
                </div>
                <div className="workout-summary-stat">
                  <div className="workout-summary-icon-wrap is-neutral" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
                        stroke="rgba(255,255,255,.88)"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M12 6v6l4 2"
                        stroke="rgba(255,255,255,.88)"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="workout-summary-meta">
                    <div className="workout-summary-key">Time</div>
                    <div className="workout-summary-stat-value">
                      <span ref={workoutSummaryTimeRef}>0:00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button className="workout-summary-cta" ref={workoutSummaryButtonRef} type="button">
            <svg className="workout-summary-bolt" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="rgba(255,255,255,.98)" />
            </svg>
            <span>
              Level Up +<span ref={workoutSummaryXpRef}>0</span> XP
            </span>
          </button>
        </div>
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
                <div className="set-stopwatch" ref={setStopwatchRef} aria-live="polite">
                  00:00
                </div>
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
