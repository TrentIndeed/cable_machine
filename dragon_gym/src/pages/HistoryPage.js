import React, { useEffect, useRef } from 'react';

function HistoryPage({ isActive, refs, onAchievements }) {
  const { logListRef } = refs;
  const handleAchievements = onAchievements || (() => {});
  const lineChartRef = useRef(null);
  const barChartRef = useRef(null);

  useEffect(() => {
    const drawLineChart = (canvas) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      const rows = 4;
      const cols = 6;
      for (let i = 1; i < rows; i += 1) {
        const y = (height / rows) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let i = 1; i < cols; i += 1) {
        const x = (width / cols) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const data = [2, 3, 4, 5, 6, 6.5, 7];
      const max = 7;
      const padding = 8;
      ctx.strokeStyle = '#2d8cff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      data.forEach((value, index) => {
        const x = padding + (index / (data.length - 1)) * (width - padding * 2);
        const y = height - padding - (value / max) * (height - padding * 2);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.fillStyle = 'rgba(45,140,255,0.25)';
      ctx.lineTo(width - padding, height - padding);
      ctx.lineTo(padding, height - padding);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#2d8cff';
      data.forEach((value, index) => {
        const x = padding + (index / (data.length - 1)) * (width - padding * 2);
        const y = height - padding - (value / max) * (height - padding * 2);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawBarChart = (canvas) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      const rows = 4;
      for (let i = 1; i < rows; i += 1) {
        const y = (height / rows) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const primary = [12, 6, 7, 8, 9, 7, 8];
      const secondary = [6, 8, 9, 6, 7, 8, 9];
      const max = 12;
      const barCount = primary.length;
      const gap = 6;
      const barWidth = (width - gap * (barCount + 1)) / barCount;

      primary.forEach((value, index) => {
        const x = gap + index * (barWidth + gap);
        const barHeight = (value / max) * (height - 12);
        ctx.fillStyle = '#2d8cff';
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      });

      secondary.forEach((value, index) => {
        const x = gap + index * (barWidth + gap) + barWidth * 0.25;
        const barHeight = (value / max) * (height - 12);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(x, height - barHeight, barWidth * 0.5, barHeight);
      });
    };

    drawLineChart(lineChartRef.current);
    drawBarChart(barChartRef.current);

    const handleResize = () => {
      drawLineChart(lineChartRef.current);
      drawBarChart(barChartRef.current);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      <section className="session-summary" aria-label="Session summary">
        <header className="session-summary__header">
          <button className="session-summary__back" type="button">
            Back
          </button>
          <div className="session-summary__title">Session Summary</div>
          <div className="session-summary__dots">...</div>
        </header>
        <div className="session-summary__totals">
          <small>1/10 lat/rotation</small>
          <div className="session-summary__totalRow">
            <div className="session-summary__totalMain">
              9,780 <span className="session-summary__unit">lb</span>
            </div>
            <div className="session-summary__totalSub">36 min</div>
          </div>
        </div>
        <div className="session-summary__grid">
          <div className="session-summary__card is-blue">
            <h4>Best Set</h4>
            <div className="session-summary__big">
              95 <span className="session-summary__unit">reps</span>
            </div>
          </div>
          <div className="session-summary__card is-green">
            <h4>Heaviest 1 Rep</h4>
            <div className="session-summary__big">
              105 <span className="session-summary__unit">Arm</span>
            </div>
          </div>
          <div className="session-summary__card">
            <h4>Average Tempo</h4>
            <div className="session-summary__tempo">1.8</div>
            <div className="session-summary__tempoSub">
              / 10 lb &nbsp; R 2.0 down · 3 lb
            </div>
          </div>
          <div className="session-summary__card">
            <h4>Consistency</h4>
            <div className="session-summary__ringWrap">
              <div className="session-summary__ring">
                <span>82%</span>
              </div>
            </div>
          </div>
          <div className="session-summary__card session-summary__chartCard">
            <div className="session-summary__chartTitle">Performance Over Sets</div>
            <canvas ref={lineChartRef} className="session-summary__chart"></canvas>
          </div>
          <div className="session-summary__card session-summary__chartCard is-bar">
            <div className="session-summary__chartTitle">Range of Motion Region</div>
            <canvas ref={barChartRef} className="session-summary__chart"></canvas>
          </div>
        </div>
        <div className="session-summary__watermark">Sora · @trentindeed</div>
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

export default HistoryPage;
