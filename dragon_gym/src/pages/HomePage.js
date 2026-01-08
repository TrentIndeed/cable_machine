import React from 'react';

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
  const {
    workoutStateRef,
    startToggleRef,
    setToggleRef,
    setControlGroupRef,
    simPanelRef,
    resetRef,
    setStatusRef,
    repStatusRef,
    waveRepRef,
    messageRef,
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
    eccentricToggleRef,
    eccentricPanelRef,
    eccentricSelectRef,
    eccentricDescriptionRef,
    forceCurveIntensityRefElement,
    forcePanelRef,
    forceLockHintRef,
    exerciseSelectRef,
    exerciseTitleRef,
  } = refs;

  return (
    <main
      className={`app-shell ${motorsSyncedState ? 'is-synced' : ''}`}
      hidden={!isActive}
    >
      <header className="app-header" aria-label="System header">
        <div className="header-brand" aria-label="Dragon Gym logo">
          <img
            src="/assets/dragonai-logo.png"
            alt="DragonAI neon dragon"
            className="logo-image"
          />
        </div>
        <div className="header-center" aria-label="Dragon Gym overview">
          <h1 className="header-title">Dragon Gym</h1>
        </div>
        <div className="header-actions" aria-label="Power controls">
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
      </header>

      <section className="resistance-overview" aria-label="Resistance overview">
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
        <article className="combined-card" aria-label="Resistance gauges and wave">
          <div className="motor-grid">
            <article className="motor-card" data-motor="left">
              <div className="motor-engagement" aria-label="Left motor cable engagement">
                <div className="engagement-readout" aria-live="polite">
                  <span className="label">Engagement distance</span>
                  <span className="value" id="leftEngageDisplay" ref={leftEngageDisplayRef}>
                    1.0 in
                  </span>
                </div>
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
              <dl className="motor-meta">
                <div>
                  <dt>Base resistance</dt>
                  <dd id="leftBaseResistance" ref={leftBaseResistanceRef}>
                    0 lb
                  </dd>
                </div>
              </dl>
            </article>

            <article
              className={`motor-card ${motorsSyncedState ? 'is-synced-hidden' : ''}`}
              data-motor="right"
              hidden={syncHidden}
            >
              <div className="motor-engagement" aria-label="Right motor cable engagement">
                <div className="engagement-readout" aria-live="polite">
                  <span className="label">Engagement distance</span>
                  <span className="value" id="rightEngageDisplay" ref={rightEngageDisplayRef}>
                    1.0 in
                  </span>
                </div>
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
              <dl className="motor-meta">
                <div>
                  <dt>Base resistance</dt>
                  <dd id="rightBaseResistance" ref={rightBaseResistanceRef}>
                    0 lb
                  </dd>
                </div>
              </dl>
            </article>
          </div>
          <div className="wave-grid">
            <article className="wave-card" data-motor="combined">
              <header>
                <span className="wave-rep-label">
                <span className="wave-rep-count" ref={waveRepRef}>0</span>
                </span>
              </header>
              <canvas
                className="wave-canvas"
                id="combinedWave"
                ref={waveCombinedRef}
                width="960"
                height="260"
                aria-hidden="true"
              ></canvas>
            </article>
          </div>
        </article>
      </section>
      <section className="workspace">
        <section className="set-controls-panel" aria-label="Set controls">
          <div className="status-controls">
            <button
              className="primary"
              id="toggleWorkout"
              ref={startToggleRef}
              type="button"
              aria-pressed="false"
            >
              Start Workout
            </button>
            <div
              className="set-control-group"
              aria-label="Set controls"
              ref={setControlGroupRef}
              hidden
            >
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
                className="ghost"
                id="resetWorkout"
                ref={resetRef}
                type="button"
                disabled
              >
                Reset
              </button>
              <button
                className="ghost"
                id="syncMotors"
                ref={syncMotorsRef}
                type="button"
                aria-pressed={motorsSyncedState}
              >
                {motorsSyncedState ? 'Unsync Motors' : 'Sync Motors'}
              </button>
            </div>
          </div>
          <div className="status-stack">
            <div>
              <span className="label">Set</span>
              <span className="value" id="setStatus" ref={setStatusRef}>
                0
              </span>
            </div>
            <div>
              <span className="label">Reps</span>
              <span className="value" id="repStatus" ref={repStatusRef}>
                0 / 12
              </span>
            </div>
            <div>
              <span className="label">Force curve</span>
              <span className="value" id="forceCurveLabel" ref={forceLabelRef}>
                Linear
              </span>
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
        <section className="selector-panel" aria-label="Workout selector">
          <button
            className="card-toggle"
            type="button"
            aria-expanded={selectorOpen}
            aria-controls="selectorBody"
            onClick={() => setSelectorOpen((prev) => !prev)}
          >
            <span>Workout Selector</span>
          </button>
          <div id="selectorBody" className="card-body" hidden={!selectorOpen}>
            <div className="selector-controls">
              <label htmlFor="exerciseSelect">Choose an exercise</label>
              <select id="exerciseSelect" ref={exerciseSelectRef} defaultValue="incline-bench">
                {Object.entries(exerciseCatalog).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <p className="exercise-title" id="exerciseTitle" ref={exerciseTitleRef}>
              Incline Bench
            </p>
            <div className="exercise-preview">
            <video
              className="media-placeholder video"
              src={videoSrc}
              muted
              loop
              playsInline
              autoPlay
            ></video>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

export default HomePage;
