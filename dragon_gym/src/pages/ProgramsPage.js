import React from 'react';

function ProgramsPage({ isActive, refs }) {
  const { logListRef } = refs;

  return (
    <main className="app-shell" hidden={!isActive}>
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
