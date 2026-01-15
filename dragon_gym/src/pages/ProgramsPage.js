import React, { useMemo, useState } from 'react';

function ProgramsPage({ isActive, refs, exerciseCatalog, selectorOpen, setSelectorOpen, videoSrc }) {
  const { exerciseSelectRef, exerciseTitleRef } = refs;
  const [primaryCat, setPrimaryCat] = useState('All');
  const [query, setQuery] = useState('');

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
    </main>
  );
}

export default ProgramsPage;
