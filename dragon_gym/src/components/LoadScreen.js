import React, { useCallback, useEffect, useRef, useState } from 'react';

const WORKOUTS = [
  {
    tagText: 'Arms  Loody',
    tagColor: '#F3A11D',
    title: 'Cable Squat',
    reps: '15 Reps',
    image:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1400">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#2f2f2f"/>
              <stop offset="0.55" stop-color="#1a1a1a"/>
              <stop offset="1" stop-color="#080808"/>
            </linearGradient>
            <radialGradient id="r" cx="60%" cy="30%" r="70%">
              <stop offset="0" stop-color="#3aa7ff" stop-opacity="0.35"/>
              <stop offset="1" stop-color="#000" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
          <rect width="100%" height="100%" fill="url(#r)"/>
          <g opacity="0.6">
            <path d="M120 980 C240 650, 520 460, 650 240" stroke="#bfbfbf" stroke-width="18" stroke-linecap="round"/>
            <path d="M90 1040 C250 720, 500 520, 680 300" stroke="#6bc6ff" stroke-width="6" stroke-linecap="round"/>
          </g>
        </svg>
      `),
  },
  {
    tagText: 'Lower',
    tagColor: '#C9B406',
    title: 'Lower Press',
    reps: '12 Reps',
    image:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1400">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#343434"/>
              <stop offset="0.55" stop-color="#1c1c1c"/>
              <stop offset="1" stop-color="#080808"/>
            </linearGradient>
            <radialGradient id="r" cx="70%" cy="28%" r="65%">
              <stop offset="0" stop-color="#ffd54a" stop-opacity="0.25"/>
              <stop offset="1" stop-color="#000" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
          <rect width="100%" height="100%" fill="url(#r)"/>
          <g opacity="0.55">
            <circle cx="560" cy="560" r="210" fill="#0f0f0f"/>
            <path d="M150 1020 L700 520" stroke="#a9a9a9" stroke-width="14" stroke-linecap="round"/>
          </g>
        </svg>
      `),
  },
  {
    tagText: 'Core',
    tagColor: '#00BBD4',
    title: 'Cable Row',
    reps: '10 Reps',
    image:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1400">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#2f2f2f"/>
              <stop offset="0.55" stop-color="#171717"/>
              <stop offset="1" stop-color="#070707"/>
            </linearGradient>
            <radialGradient id="r" cx="45%" cy="24%" r="70%">
              <stop offset="0" stop-color="#50e6ff" stop-opacity="0.22"/>
              <stop offset="1" stop-color="#000" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
          <rect width="100%" height="100%" fill="url(#r)"/>
          <g opacity="0.55">
            <path d="M120 680 C260 520, 420 520, 680 690" stroke="#cfcfcf" stroke-width="16" stroke-linecap="round"/>
            <path d="M120 730 C260 570, 420 570, 680 740" stroke="#6bc6ff" stroke-width="6" stroke-linecap="round"/>
          </g>
        </svg>
      `),
  },
];

function getTransformX(element) {
  if (!element) {
    return 0;
  }
  const transform = getComputedStyle(element).transform;
  if (!transform || transform === 'none') {
    return 0;
  }
  if (typeof DOMMatrixReadOnly === 'undefined') {
    const match = transform.match(/matrix(3d)?\(([^)]+)\)/);
    if (!match) {
      return 0;
    }
    const values = match[2].split(',').map((value) => Number.parseFloat(value));
    if (match[1] === '3d') {
      return values[12] || 0;
    }
    return values[4] || 0;
  }
  const matrix = new DOMMatrixReadOnly(transform);
  return matrix.m41 || 0;
}

function LoadScreen({ isActive = true, onBegin }) {
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const indexRef = useRef(0);
  const trackRef = useRef(null);
  const carouselRef = useRef(null);
  const cardWidthRef = useRef(0);
  const autoTimerRef = useRef(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const startTransformXRef = useRef(0);

  const measure = useCallback(() => {
    const first = trackRef.current?.querySelector('.cardWrap');
    if (!first) {
      return;
    }
    const rect = first.getBoundingClientRect();
    cardWidthRef.current = rect.width;
  }, []);

  const snapTo = useCallback(
    (nextIndex, animate = true) => {
      const track = trackRef.current;
      const carousel = carouselRef.current;
      if (!track || !carousel) {
        return;
      }
      const wraps = Array.from(track.querySelectorAll('.cardWrap'));
      if (!wraps.length) {
        return;
      }

      const normalized = (nextIndex + wraps.length) % wraps.length;
      indexRef.current = normalized;
      setIndex(normalized);

      const carouselRect = carousel.getBoundingClientRect();
      const carouselCenter = carouselRect.left + carouselRect.width / 2;

      const active = wraps[normalized];
      const activeRect = active.getBoundingClientRect();
      const activeCenter = activeRect.left + activeRect.width / 2;

      const currentX = getTransformX(track);
      const delta = carouselCenter - activeCenter;
      const nextX = currentX + delta;

      if (!animate) {
        track.style.transition = 'none';
      }
      requestAnimationFrame(() => {
        track.style.transform = `translateX(${nextX}px)`;
        if (!animate) {
          requestAnimationFrame(() => {
            track.style.transition =
              'transform 1200ms cubic-bezier(.2,.85,.15,1)';
          });
        }
      });
    },
    []
  );

  const stopAuto = useCallback(() => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const startAuto = useCallback(() => {
    stopAuto();
    autoTimerRef.current = setInterval(() => {
      snapTo(indexRef.current + 1);
    }, 5000);
  }, [snapTo, stopAuto]);

  const handleDown = useCallback(
    (event) => {
      isDownRef.current = true;
      setIsDragging(true);
      const x = event.touches ? event.touches[0].clientX : event.clientX;
      startXRef.current = x;
      lastXRef.current = x;
      startTransformXRef.current = getTransformX(trackRef.current);
      stopAuto();
    },
    [stopAuto]
  );

  const handleMove = useCallback((event) => {
    if (!isDownRef.current) {
      return;
    }
    const x = event.touches ? event.touches[0].clientX : event.clientX;
    const dx = x - startXRef.current;
    lastXRef.current = x;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${startTransformXRef.current + dx}px)`;
    }
  }, []);

  const handleUp = useCallback(() => {
    if (!isDownRef.current) {
      return;
    }
    isDownRef.current = false;
    setIsDragging(false);

    const dx = lastXRef.current - startXRef.current;
    const threshold = Math.min(90, cardWidthRef.current * 0.22);

    if (dx < -threshold) {
      snapTo(indexRef.current + 1);
    } else if (dx > threshold) {
      snapTo(indexRef.current - 1);
    } else {
      snapTo(indexRef.current);
    }

    startAuto();
  }, [snapTo, startAuto]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    measure();
    snapTo(0, false);
    startAuto();

    const handleResize = () => {
      measure();
      snapTo(indexRef.current, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleUp, { passive: true });

    return () => {
      stopAuto();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [handleMove, handleUp, measure, snapTo, startAuto, stopAuto]);

  const total = WORKOUTS.length;
  const prevIndex = (index - 1 + total) % total;
  const nextIndex = (index + 1) % total;
  const handleBegin = useCallback(() => {
    if (onBegin) {
      onBegin();
    }
  }, [onBegin]);

  if (!isActive) {
    return null;
  }

  return (
    <section className="load-screen" role="dialog" aria-label="Choose Exercise">
      <div className="screen safeTop safeBottom">
        <header className="topbar">
          <div className="left">
            <button className="backPill" type="button" aria-label="Back">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="rgba(255,255,255,.92)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Back</span>
            </button>
          </div>

          <div className="title">Choose Exercise</div>

          <div className="right">
            <button className="iconBtn" type="button" aria-label="Search">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                  stroke="rgba(255,255,255,.95)"
                  strokeWidth="2.2"
                />
                <path
                  d="M16.5 16.5 21 21"
                  stroke="rgba(255,255,255,.95)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <main className="carouselArea">
          <div
            className={`carousel ${isDragging ? 'dragging' : ''}`}
            ref={carouselRef}
            onMouseDown={handleDown}
            onTouchStart={handleDown}
          >
            <div className="edgeFade"></div>
            <div className="track" ref={trackRef}>
              {WORKOUTS.map((workout, workoutIndex) => {
                const state =
                  workoutIndex === index
                    ? 'active'
                    : workoutIndex === prevIndex
                      ? 'prev'
                      : workoutIndex === nextIndex
                        ? 'next'
                        : '';
                return (
                  <div
                    className="cardWrap"
                    data-state={state}
                    key={workout.title}
                    role="button"
                    tabIndex={0}
                    onClick={handleBegin}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleBegin();
                      }
                    }}
                  >
                    <div className="card">
                      <div
                        className="cardImg"
                        style={{ backgroundImage: `url('${workout.image}')` }}
                      ></div>
                      <div className="shade"></div>
                      <div className="tag" style={{ background: workout.tagColor }}>
                        {workout.tagText}
                      </div>
                      <div className="content">
                        <h2 className="exerciseTitle">{workout.title}</h2>
                        <div className="metaRow">
                          <div className="metaIcon" aria-hidden="true">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6 15.5c.5 1.8 2.6 3 6 3s5.5-1.2 6-3"
                                stroke="#111"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M9 5.5h6"
                                stroke="#111"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M8 7.8c-1.6 1.2-2.6 3-2.6 5 0 3.3 3 6 6.6 6s6.6-2.7 6.6-6c0-2-1-3.8-2.6-5"
                                stroke="#111"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <div>{workout.reps}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <footer className="bottom">
          <button className="beginBtn" type="button" onClick={handleBegin}>
            Begin
          </button>
        </footer>
      </div>
    </section>
  );
}

export default LoadScreen;
