import React, { useMemo, useState } from 'react';

function ProgramsPage({ isActive, refs, exerciseCatalog, selectorOpen, setSelectorOpen, videoSrc }) {
  const { exerciseSelectRef, exerciseTitleRef } = refs;
  const [primaryCat, setPrimaryCat] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showSelectedCard, setShowSelectedCard] = useState(false);

  const categories = useMemo(
    () => [
      'Ahv ... Sond',
      'Ahv ... Souds',
      'Rowber',
      'Mobbell',
      'I6per Rove',
      'Ufole',
      'All',
      'Tel',
      'Core',
      'Tipordo',
      'Mc',
    ],
    []
  );

  const exercises = useMemo(
    () => [
      {
        name: 'Row - Seated',
        sub: 'Gr ciangment',
        tag: 'Special Body',
        leftBadge: 'Lunl...',
        rightBadge: 'Body...',
        category: 'All',
        img:
          'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=500&q=80',
      },
      {
        name: 'Deadlift - RDL',
        sub: 'He purgalith',
        tag: 'Lumary, hlutem',
        leftBadge: 'Body...',
        rightBadge: 'Body...',
        category: 'All',
        img:
          'https://images.unsplash.com/photo-1599058917212-d750089bc07a?auto=format&fit=crop&w=500&q=80',
      },
      {
        name: 'Sled Push',
        sub: 'Thumafgsit',
        tag: 'barf-1',
        leftBadge: 'Body...',
        rightBadge: 'Body...',
        category: 'Core',
        img:
          'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=500&q=80',
      },
      {
        name: 'Battle Ropes',
        sub: 'Gr caingment',
        tag: 'Rlyfier Barpe',
        leftBadge: 'Body...',
        rightBadge: 'Body...',
        category: 'All',
        img:
          'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=500&q=80',
      },
      {
        name: 'Battle Ropes',
        sub: 'Gr cadreics',
        tag: 'Plank Reach',
        leftBadge: 'Slv...',
        rightBadge: 'Body...',
        category: 'All',
        img:
          'https://images.unsplash.com/photo-1517964603305-11c0f6f66012?auto=format&fit=crop&w=500&q=80',
      },
      {
        name: 'Lunge - Reverse',
        sub: 'Gr Paqe',
        tag: 'Sody Puch',
        leftBadge: 'Puk...',
        rightBadge: 'Body...',
        category: 'Legs',
        img:
          'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=500&q=80',
      },
      {
        name: 'Cable Fly',
        sub: 'Gr ciangment',
        tag: 'Cout Ping',
        leftBadge: 'Body...',
        rightBadge: 'Body...',
        category: 'Upper',
        img:
          'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=500&q=80',
      },
      {
        name: 'Pull Down',
        sub: 'Gr cadreics',
        tag: 'Fort Eul...',
        leftBadge: 'Body...',
        rightBadge: 'Body...',
        category: 'Back',
        img:
          'https://images.unsplash.com/photo-1517838277536-f5f99be5018e?auto=format&fit=crop&w=500&q=80',
      },
      {
        name: 'Bench Press',
        sub: 'Gr ciangment',
        tag: 'Botch any...',
        leftBadge: 'Body...',
        rightBadge: 'Body...',
        category: 'Upper',
        img:
          'https://images.unsplash.com/photo-1517838277536-f5f99be5018e?auto=format&fit=crop&w=500&q=80',
      },
    ],
    []
  );

  const visibleExercises = exercises.filter((exercise) => {
    const matchesQuery =
      !query ||
      `${exercise.name} ${exercise.sub} ${exercise.tag}`
        .toLowerCase()
        .includes(query.toLowerCase());
    const matchesCat =
      primaryCat === 'All' ||
      exercise.category.toLowerCase() === primaryCat.toLowerCase();
    return matchesQuery && matchesCat;
  });

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
      <section className="exercise-library" aria-label="Exercise library">
        <header className="exercise-library__header">
          <div className="exercise-library__title">Exercises</div>
          <div className="exercise-library__searchRow">
            <div className="exercise-library__search">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="rgba(255,255,255,.55)"
                  d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm11 3-6.2-6.2a9.5 9.5 0 1 0-1.4 1.4L19.6 22 21 21Z"
                />
              </svg>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search exercises"
                autoComplete="off"
              />
            </div>
            <button className="exercise-library__filterBtn" type="button" aria-label="Filters">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h10"></path>
                <path d="M18 6h2"></path>
                <path d="M14 6a2 2 0 1 0 0 0Z"></path>
                <path d="M4 12h4"></path>
                <path d="M12 12h8"></path>
                <path d="M8 12a2 2 0 1 0 0 0Z"></path>
                <path d="M4 18h13"></path>
                <path d="M21 18h-1"></path>
                <path d="M17 18a2 2 0 1 0 0 0Z"></path>
              </svg>
            </button>
          </div>
          <div className="exercise-library__categories">
            {categories.map((label) => (
              <button
                key={label}
                className={`exercise-library__pill${
                  label === primaryCat ? ' is-on' : ''
                }${label === 'Core' && label !== primaryCat ? ' is-alt' : ''}`}
                type="button"
                onClick={() => setPrimaryCat(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </header>
        <div className="exercise-library__grid">
          {visibleExercises.map((exercise) => (
            <button
              key={`${exercise.name}-${exercise.sub}`}
              className="exercise-library__card"
              type="button"
              onClick={() => {
                setSelectedExercise(exercise);
                setShowSelectedCard(true);
              }}
            >
              <div className="exercise-library__thumb">
                <img src={exercise.img} alt="" />
                <div className="exercise-library__tag">
                  <span className="exercise-library__tagDot"></span>
                  <span>{exercise.tag}</span>
                </div>
                <div className="exercise-library__badges">
                  <div className="exercise-library__badge">
                    <span className="exercise-library__badgeDot is-warm"></span>
                    <span>{exercise.leftBadge}</span>
                  </div>
                  <div className="exercise-library__badge">
                    <span className="exercise-library__badgeDot is-cool"></span>
                    <span>{exercise.rightBadge}</span>
                  </div>
                </div>
              </div>
              <div className="exercise-library__name">{exercise.name}</div>
              <div className="exercise-library__sub">{exercise.sub}</div>
            </button>
          ))}
        </div>
        <button className="exercise-library__fab" type="button" aria-label="Add exercise">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14"></path>
            <path d="M5 12h14"></path>
          </svg>
        </button>
      </section>
      {showSelectedCard && selectedExercise ? (
        <section className="exercise-selected-overlay" aria-label="Selected exercise">
          <div className="exercise-selected-dim" aria-hidden="true"></div>
          <div className="exercise-selected-card">
            <div className="exercise-selected-topRow">
              <div className="exercise-selected-title">{selectedExercise.name}</div>
              <button
                className="exercise-selected-close"
                type="button"
                aria-label="Close"
                onClick={() => setShowSelectedCard(false)}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M3 3L11 11M11 3L3 11"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="exercise-selected-chipRow">
              <div className="exercise-selected-pill" aria-label="Muscle group chips">
                <div className="exercise-selected-dots" aria-hidden="true">
                  <span className="exercise-selected-dot"></span>
                  <span className="exercise-selected-dot is-pink"></span>
                </div>
                <div className="exercise-selected-pillText">
                  Vlol deer 51 eq Roighte Riete
                </div>
              </div>
              <div className="exercise-selected-actions" aria-label="Quick actions">
                <button className="exercise-selected-iconBtn" type="button" aria-label="Power">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 2v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path
                      d="M7.5 4.8A8.5 8.5 0 1 0 16.5 4.8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button className="exercise-selected-iconBtn" type="button" aria-label="Start set">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M13 5l-2 5 3 3-2 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 8l-2 2 3 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M15 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <button className="exercise-selected-iconBtn" type="button" aria-label="Add">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            <button className="exercise-selected-thumb" type="button" aria-label="Open exercise demo">
              <div className="exercise-selected-play">
                <div className="exercise-selected-playBtn" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M10 8l8 4-8 4V8z" fill="rgba(255,255,255,.92)" />
                  </svg>
                </div>
              </div>
              <div className="exercise-selected-brand">
                <div className="exercise-selected-mark" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3c4.8 0 9 3.7 9 9s-4.2 9-9 9-9-4.2-9-9 4.2-9 9-9Z"
                      fill="rgba(255,255,255,.14)"
                    />
                    <path
                      d="M8.4 14.8c.7 1.5 2.1 2.5 3.8 2.5 2.3 0 4.2-1.9 4.2-4.2 0-2.2-1.7-4-3.8-4.2"
                      stroke="rgba(255,255,255,.75)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="exercise-selected-brandText">
                  <div className="exercise-selected-brandName">Sora</div>
                  <div className="exercise-selected-brandHandle">@trentindeed</div>
                </div>
              </div>
            </button>
            <div className="exercise-selected-scrub">
              <div className="exercise-selected-track">
                <div className="exercise-selected-fill"></div>
              </div>
            </div>
            <div className="exercise-selected-actionsRow">
              <button className="exercise-selected-primary" type="button">
                Add to Workout
              </button>
              <button
                className="exercise-selected-confirm"
                type="button"
                aria-label="Confirm"
                onClick={() => setShowSelectedCard(false)}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="rgba(255,255,255,.92)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="exercise-selected-homeBar" aria-hidden="true"></div>
        </section>
      ) : null}
    </main>
  );
}

export default ProgramsPage;
