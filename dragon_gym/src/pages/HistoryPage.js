import React from 'react';

function HistoryPage({ isActive, refs, onAchievements }) {
  const { logListRef } = refs;
  const handleAchievements = onAchievements || (() => {});

  return (
    <main className="app-shell" hidden={!isActive}>
      <header className="history-header">
        <h1></h1>
        <button
          className="achievements-button"
          type="button"
          onClick={handleAchievements}
        >
          <img src="/assets/icons/chart-histogram.png" alt="" aria-hidden="true" />
          Achievements
        </button>
      </header>
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

export default HistoryPage;
