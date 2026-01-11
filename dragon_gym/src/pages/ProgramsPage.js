import React from 'react';

function ProgramsPage({ isActive, refs, exerciseCatalog, selectorOpen, setSelectorOpen, videoSrc }) {
  const { logListRef, exerciseSelectRef, exerciseTitleRef } = refs;

  return (
    <main className="app-shell" hidden={!isActive}>
      <section className="selector-panel" aria-label="Exercise selector">
        <button
          className="card-toggle"
          type="button"
          aria-expanded={selectorOpen}
          aria-controls="selectorBody"
          onClick={() => setSelectorOpen((prev) => !prev)}
        >
          <span>Exercise Selector</span>
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
      <section className="log-panel" aria-label="Workout log">
        <h3>Workout Log</h3>
        <p className="log-description" id="logDescription">
          Every set is recorded to see strength gains over time.
        </p>
        <ul className="log-list" id="workoutLogList" ref={logListRef}></ul>
      </section>
    </main>
  );
}

export default ProgramsPage;
