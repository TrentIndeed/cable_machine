const MAX_RESISTANCE = 300;
const TWO_PI = Math.PI * 2;
const MAX_TRAVEL_INCHES = 24;
const REP_SPAN_THRESHOLD = 3;
const MOVEMENT_EPSILON = 0.05;

const elements = {
  workoutState: document.getElementById('workoutState'),
  startToggle: document.getElementById('toggleWorkout'),
  options: document.getElementById('workoutOptions'),
  setCount: document.getElementById('setCount'),
  repCount: document.getElementById('repCount'),
  startSet: document.getElementById('startSet'),
  stopSet: document.getElementById('stopSet'),
  reset: document.getElementById('resetWorkout'),
  setStatus: document.getElementById('setStatus'),
  repStatus: document.getElementById('repStatus'),
  message: document.getElementById('workoutMessage'),
  forceSelect: document.getElementById('forceCurve'),
  forceDescription: document.getElementById('forceCurveDescription'),
  forceLabel: document.getElementById('forceCurveLabel'),
  engageSlider: document.getElementById('engageDistance'),
  engageDisplay: document.getElementById('engageDisplay'),
  powerToggle: document.getElementById('powerToggle'),
  motorToggle: document.getElementById('motorToggle'),
  logList: document.getElementById('workoutLogList'),
  exerciseSelect: document.getElementById('exerciseSelect'),
  exerciseTitle: document.getElementById('exerciseTitle'),
  exerciseImagePlaceholder: document.getElementById('exerciseImagePlaceholder'),
  exerciseVideoPlaceholder: document.getElementById('exerciseVideoPlaceholder'),
};

const forceCurveCopy = {
  balanced: 'Balanced: consistent tension through the full stroke.',
  eccentric: 'Eccentric boost: heavier resistance while lowering to challenge the negative.',
  chain: 'Chain mode: resistance ramps up through the concentric like adding plates link by link.',
  band: 'Band mode: exponential tension rise near lockout for banded feel.',
  'reverse-chain': 'Reverse chain: heaviest from the start, tapering toward the top of the pull.',
};

const motors = [
  createMotor('left', {
    gaugeId: 'leftGauge',
    waveId: 'leftWave',
    sliderId: 'leftResistance',
    simId: 'leftSim',
    currentId: 'leftCurrentResistance',
    baseId: 'leftBaseResistance',
    repsId: 'leftRepCount',
    cableId: 'leftCableDistance',
  }),
  createMotor('right', {
    gaugeId: 'rightGauge',
    waveId: 'rightWave',
    sliderId: 'rightResistance',
    simId: 'rightSim',
    currentId: 'rightCurrentResistance',
    baseId: 'rightBaseResistance',
    repsId: 'rightRepCount',
    cableId: 'rightCableDistance',
  }),
];

let workoutActive = false;
let setActive = false;
let currentSet = 0;
let totalSets = 0;
let currentRep = 0;
let totalReps = 0;
let lastTimestamp = performance.now();
let powerOn = true;
let motorsRunning = true;
const workoutLog = [];

const exerciseCatalog = {
  'incline-bench': 'Incline Bench',
  'weighted-pullups': 'Weighted Pull Ups',
  'dumbbell-shoulder-press': 'Dumbbell Shoulder Press',
  'lateral-raise': 'Lateral Raise',
  'pec-deck': 'Pec Deck',
  'tricep-pushdown': 'Tricep Pushdown',
  deadlift: 'Deadlift',
  'one-arm-row': 'One-Arm Row',
  'leg-curl': 'Leg Curl',
  'calve-raise': 'Calve Raise',
};

function createMotor(id, refs) {
  const gaugeCanvas = document.getElementById(refs.gaugeId);
  const gaugeCtx = gaugeCanvas.getContext('2d');
  const waveCanvas = document.getElementById(refs.waveId);
  const waveCtx = waveCanvas.getContext('2d');

  const slider = document.getElementById(refs.sliderId);
  const simSlider = document.getElementById(refs.simId);
  const currentLabel = document.getElementById(refs.currentId);
  const baseLabel = document.getElementById(refs.baseId);
  const repsLabel = document.getElementById(refs.repsId);
  const cableLabel = document.getElementById(refs.cableId);

  const initialTravel = Number(simSlider.value);
  const normalized = Math.max(0, Math.min(1, initialTravel / MAX_TRAVEL_INCHES));
  const travelInches = normalized * MAX_TRAVEL_INCHES;

  return {
    id,
    gaugeCanvas,
    gaugeCtx,
    waveCanvas,
    waveCtx,
    slider,
    simSlider,
    currentLabel,
    baseLabel,
    repsLabel,
    cableLabel,
    baseResistance: Number(slider.value),
    currentResistance: Number(slider.value),
    reps: 0,
    engaged: false,
    normalized,
    direction: 0,
    trail: new Array(120).fill(normalized),
    lastTravel: travelInches,
    phase: 'idle',
    lastPeak: travelInches,
    lastTrough: travelInches,
    repCounted: false,
  };
}

function resetMotorTracking(motor, travel) {
  motor.phase = 'idle';
  motor.repCounted = false;
  motor.lastPeak = travel;
  motor.lastTrough = travel;
  motor.lastTravel = travel;
  motor.direction = 0;
}

function updateEngageDisplay() {
  elements.engageDisplay.textContent = Number(elements.engageSlider.value).toFixed(1);
}

function toggleWorkout() {
  workoutActive = !workoutActive;
  elements.options.hidden = !workoutActive;
  elements.startToggle.textContent = workoutActive ? 'Stop Workout' : 'Start Workout';

  elements.startSet.disabled = !workoutActive;
  elements.reset.disabled = !workoutActive;

  if (!workoutActive) {
    stopSet();
    currentSet = 0;
    totalSets = 0;
    currentRep = 0;
    totalReps = 0;
    elements.workoutState.classList.remove('active');
    elements.workoutState.textContent = 'Workout Not Started';
    elements.message.textContent = 'Tap “Start Workout” to program your session.';
    updateStatuses();
  } else {
    totalSets = Math.max(1, Number(elements.setCount.value));
    totalReps = Math.max(1, Number(elements.repCount.value));
    currentSet = 0;
    currentRep = 0;
    elements.workoutState.classList.add('active');
    elements.workoutState.textContent = 'Workout Not Started';
    elements.message.textContent = 'Press “Start Set” to begin counting reps.';
    updateStatuses();
  }
}

elements.startToggle.addEventListener('click', toggleWorkout);

elements.setCount.addEventListener('change', () => {
  if (!workoutActive) return;
  totalSets = Math.max(1, Number(elements.setCount.value));
  currentSet = Math.min(currentSet, totalSets);
  updateStatuses();
});

elements.repCount.addEventListener('change', () => {
  if (!workoutActive) return;
  totalReps = Math.max(1, Number(elements.repCount.value));
  currentRep = Math.min(currentRep, totalReps);
  updateStatuses();
});

elements.forceSelect.addEventListener('change', () => {
  const mode = elements.forceSelect.value;
  elements.forceDescription.textContent = forceCurveCopy[mode];
  elements.forceLabel.textContent = elements.forceSelect.options[elements.forceSelect.selectedIndex].text;
});

elements.engageSlider.addEventListener('input', updateEngageDisplay);
updateEngageDisplay();

elements.startSet.addEventListener('click', () => {
  if (!workoutActive) return;
  if (setActive) return;

  setActive = true;
  elements.startSet.disabled = true;
  elements.stopSet.disabled = false;
  elements.workoutState.textContent = 'Workout Started';
  elements.workoutState.classList.add('active');

  totalSets = Math.max(1, Number(elements.setCount.value));
  totalReps = Math.max(1, Number(elements.repCount.value));

  if (currentSet >= totalSets) {
    currentSet = 0;
  }
  currentSet += 1;
  currentRep = 0;
  motors.forEach((motor) => {
    motor.reps = 0;
    motor.engaged = false;
    const travel = motor.normalized * MAX_TRAVEL_INCHES;
    resetMotorTracking(motor, travel);
  });
  elements.message.textContent = `Set ${currentSet} active. Cable movement will arm the servos.`;
  updateStatuses();
});

elements.stopSet.addEventListener('click', stopSet);

elements.reset.addEventListener('click', () => {
  stopSet();
  currentSet = 0;
  currentRep = 0;
  motors.forEach((motor) => {
    motor.reps = 0;
  });
  workoutLog.length = 0;
  elements.logList.innerHTML = '';
  updateStatuses();
  elements.message.textContent = 'Workout reset. Adjust parameters when ready.';
  elements.workoutState.textContent = 'Workout Not Started';
});

function stopSet() {
  if (!setActive) return;
  setActive = false;
  elements.startSet.disabled = !workoutActive;
  elements.stopSet.disabled = true;
  elements.workoutState.textContent = 'Workout Not Started';
  elements.message.textContent = currentRep >= totalReps
    ? 'Set complete. Press “Start Set” for the next round.'
    : 'Set paused. Press “Start Set” to resume.';
  motors.forEach((motor) => {
    const travel = motor.normalized * MAX_TRAVEL_INCHES;
    resetMotorTracking(motor, travel);
  });
  updateStatuses();
}

motors.forEach((motor) => {
  motor.slider.addEventListener('input', () => {
    motor.baseResistance = Number(motor.slider.value);
    motor.baseLabel.textContent = `${motor.baseResistance} lb`;
    motor.currentResistance = motor.baseResistance;
    drawGauge(motor);
  });
  motor.simSlider.addEventListener('input', () => {
    const sliderDistance = Number(motor.simSlider.value);
    const normalized = Math.max(0, Math.min(1, sliderDistance / MAX_TRAVEL_INCHES));
    motor.normalized = normalized;
    motor.trail.push(normalized);
    if (motor.trail.length > 120) {
      motor.trail.shift();
    }
    motor.cableLabel.textContent = (normalized * MAX_TRAVEL_INCHES).toFixed(1);
    drawWave(motor);
  });
  motor.baseLabel.textContent = `${motor.baseResistance} lb`;
});

function updateMotorToggle() {
  if (!elements.motorToggle) return;
  if (!powerOn) {
    elements.motorToggle.dataset.state = 'offline';
    elements.motorToggle.innerHTML =
      '<span class="status-line">Motors Offline</span><span class="action-line">Power on required</span>';
    elements.motorToggle.disabled = true;
    elements.motorToggle.setAttribute('aria-pressed', 'false');
    return;
  }

  elements.motorToggle.disabled = false;
  if (motorsRunning) {
    elements.motorToggle.dataset.state = 'online';
    elements.motorToggle.innerHTML =
      '<span class="status-line">Motors Ready</span><span class="action-line">Tap to stop</span>';
    elements.motorToggle.setAttribute('aria-pressed', 'true');
  } else {
    elements.motorToggle.dataset.state = 'offline';
    elements.motorToggle.innerHTML =
      '<span class="status-line">Motors Offline</span><span class="action-line">Tap to start</span>';
    elements.motorToggle.setAttribute('aria-pressed', 'false');
  }
}

function applyPowerState() {
  const interactive = [
    elements.startToggle,
    elements.setCount,
    elements.repCount,
    elements.startSet,
    elements.stopSet,
    elements.reset,
    elements.forceSelect,
    elements.engageSlider,
    elements.motorToggle,
  ];

  motors.forEach((motor) => {
    motor.slider.disabled = !powerOn;
    motor.simSlider.disabled = !powerOn;
  });

  interactive.forEach((el) => {
    if (!el) return;
    if (!powerOn) {
      el.dataset.prevDisabled = el.disabled ? 'true' : 'false';
      el.disabled = true;
    } else if (el.dataset.prevDisabled !== undefined) {
      if (el.dataset.prevDisabled !== 'true') {
        el.disabled = false;
      }
      delete el.dataset.prevDisabled;
    }
  });

  if (elements.powerToggle) {
    elements.powerToggle.textContent = powerOn ? 'Shutdown' : 'Power On';
    elements.powerToggle.dataset.state = powerOn ? 'on' : 'off';
    elements.powerToggle.setAttribute('aria-pressed', powerOn ? 'true' : 'false');
  }

  if (!powerOn) {
    stopSet();
    workoutActive = false;
    elements.options.hidden = true;
    elements.startToggle.textContent = 'Start Workout';
    elements.workoutState.textContent = 'System Offline';
    elements.workoutState.classList.remove('active');
    elements.message.textContent = 'Power system on to resume control.';
    motorsRunning = false;
    updateMotorToggle();
  } else {
    updateMotorToggle();
    if (!workoutActive) {
      elements.workoutState.textContent = 'Workout Not Started';
    }
  }
}

function toggleMotors() {
  if (!powerOn) return;
  motorsRunning = !motorsRunning;
  updateMotorToggle();
}

if (elements.powerToggle) {
  elements.powerToggle.addEventListener('click', () => {
    powerOn = !powerOn;
    motorsRunning = powerOn ? true : false;
    applyPowerState();
  });
}

if (elements.motorToggle) {
  elements.motorToggle.addEventListener('click', toggleMotors);
}

function renderExercisePreview() {
  const selection = elements.exerciseSelect.value;
  const label = exerciseCatalog[selection] || 'Custom';
  if (elements.exerciseTitle) {
    elements.exerciseTitle.textContent = label;
  }
  if (elements.exerciseImagePlaceholder) {
    elements.exerciseImagePlaceholder.textContent = `${label} image placeholder`;
  }
  if (elements.exerciseVideoPlaceholder) {
    elements.exerciseVideoPlaceholder.textContent = `${label} video placeholder`;
  }
}

elements.exerciseSelect.addEventListener('change', renderExercisePreview);
renderExercisePreview();

function updateStatuses() {
  elements.setStatus.textContent = `${currentSet} / ${totalSets}`;
  elements.repStatus.textContent = `${currentRep} / ${totalReps}`;
}

function computeForceMultiplier(mode, normalized, derivative) {
  switch (mode) {
    case 'eccentric':
      return derivative < 0 ? 1.25 : 0.95;
    case 'chain':
      return 0.7 + normalized * 0.6;
    case 'band':
      return 0.6 + Math.pow(normalized, 1.8) * 0.85;
    case 'reverse-chain':
      return 1.35 - normalized * 0.55;
    default:
      return 1.0;
  }
}

function drawGauge(motor) {
  const ctx = motor.gaugeCtx;
  const { width, height } = motor.gaugeCanvas;
  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 10;
  const startAngle = -Math.PI / 2;

  ctx.lineCap = 'round';
  ctx.lineWidth = 12;

  ctx.strokeStyle = 'rgba(40, 54, 82, 0.55)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, TWO_PI, false);
  ctx.stroke();

  const progress = Math.max(0, Math.min(1, motor.currentResistance / MAX_RESISTANCE));
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(127, 255, 212, 0.95)');
  gradient.addColorStop(1, 'rgba(31, 139, 255, 0.95)');

  ctx.strokeStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, startAngle + TWO_PI * progress, false);
  ctx.stroke();

  motor.currentLabel.textContent = `${Math.round(motor.currentResistance)} lb`;
  motor.repsLabel.textContent = `${motor.reps}`;
}

function drawWave(motor) {
  const ctx = motor.waveCtx;
  const { width, height } = motor.waveCanvas;
  ctx.clearRect(0, 0, width, height);

  const topPadding = 20;
  const bottomPadding = 24;
  const usableHeight = height - topPadding - bottomPadding;
  const circleX = width - 46;
  const availableWidth = circleX - 16;
  const headY = topPadding + (1 - motor.normalized) * usableHeight;

  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const gradient = ctx.createLinearGradient(0, 0, circleX, 0);
  gradient.addColorStop(0, 'rgba(31, 139, 255, 0)');
  gradient.addColorStop(0.18, 'rgba(31, 139, 255, 0.45)');
  gradient.addColorStop(1, 'rgba(127, 255, 212, 0.95)');
  ctx.strokeStyle = gradient;
  ctx.beginPath();

  const points = motor.trail;
  const len = points.length;
  if (len > 0) {
    for (let i = 0; i < len; i++) {
      const progress = i / (len - 1 || 1);
      const x = progress * availableWidth;
      const y = topPadding + (1 - points[i]) * usableHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
  } else {
    ctx.moveTo(0, headY);
  }
  ctx.lineTo(circleX, headY);
  ctx.stroke();

  ctx.fillStyle = 'rgba(31, 139, 255, 0.35)';
  ctx.beginPath();
  ctx.arc(circleX, headY, 16, 0, TWO_PI);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(127, 255, 212, 0.85)';
  ctx.stroke();
}

function update(timestamp) {
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (!powerOn) {
    motors.forEach((motor) => {
      motor.currentResistance = 0;
      motor.normalized = 0;
      motor.trail.fill(0);
      motor.cableLabel.textContent = '0.0';
      drawGauge(motor);
      drawWave(motor);
    });
    requestAnimationFrame(update);
    return;
  }

  const engageThreshold = Math.min(0.98, Number(elements.engageSlider.value) / MAX_TRAVEL_INCHES);
  const mode = elements.forceSelect.value;

  motors.forEach((motor) => {
    const sliderDistance = Number(motor.simSlider.value);
    const normalized = Math.max(0, Math.min(1, sliderDistance / MAX_TRAVEL_INCHES));
    const previous = motor.normalized;
    motor.normalized = normalized;
    const travel = motor.normalized * MAX_TRAVEL_INCHES;
    const derivative = delta > 0 ? (normalized - previous) / delta : 0;
    motor.direction = derivative >= 0 ? 1 : -1;

    if (motorsRunning && setActive && !motor.engaged && motor.normalized >= engageThreshold) {
      motor.engaged = true;
      if (motor.id === 'left') {
        elements.message.textContent = `Left motor engaged at ${elements.engageSlider.value} in. Rep tracking armed.`;
      }
    }

    if (!setActive) {
      motor.engaged = false;
      motor.reps = 0;
      resetMotorTracking(motor, travel);
    } else if (!motorsRunning) {
      motor.engaged = false;
      resetMotorTracking(motor, travel);
    }

    const multiplier = computeForceMultiplier(mode, motor.normalized, motor.direction);
    motor.currentResistance = Math.min(
      MAX_RESISTANCE,
      Math.max(0, motor.baseResistance * multiplier)
    );

    motor.cableLabel.textContent = travel.toFixed(1);

    motor.trail.push(motor.normalized);
    if (motor.trail.length > 120) {
      motor.trail.shift();
    }

    if (motorsRunning && setActive && motor.engaged) {
      const deltaTravel = travel - motor.lastTravel;
      motor.lastTravel = travel;
      if (Math.abs(deltaTravel) > MOVEMENT_EPSILON) {
        motor.direction = deltaTravel > 0 ? 1 : -1;
      }

      if (motor.direction >= 0) {
        if (motor.phase !== 'ascending') {
          motor.phase = 'ascending';
          motor.lastPeak = travel;
          motor.lastTrough = travel;
          motor.repCounted = false;
        } else {
          motor.lastPeak = Math.max(motor.lastPeak, travel);
        }
      } else if (motor.direction < 0) {
        if (motor.phase !== 'descending') {
          motor.phase = 'descending';
          motor.lastTrough = travel;
        } else {
          motor.lastTrough = Math.min(motor.lastTrough, travel);
        }

        const span = motor.lastPeak - motor.lastTrough;
        if (!motor.repCounted && span >= REP_SPAN_THRESHOLD) {
          motor.reps += 1;
          motor.repCounted = true;
          synchronizeRepProgress();
        }
      }
    } else {
      resetMotorTracking(motor, travel);
    }

    drawGauge(motor);
    drawWave(motor);
  });

  requestAnimationFrame(update);
}

function finishSet() {
  setActive = false;
  elements.startSet.disabled = currentSet >= totalSets;
  elements.stopSet.disabled = true;
  motors.forEach((motor) => {
    motor.engaged = false;
    const travel = motor.normalized * MAX_TRAVEL_INCHES;
    resetMotorTracking(motor, travel);
  });
  elements.workoutState.textContent = currentSet >= totalSets ? 'Workout Complete' : 'Set Complete';
  elements.message.textContent = currentSet >= totalSets
    ? 'Workout complete! Reset or adjust your programming to begin again.'
    : `Set ${currentSet} complete. Press “Start Set” when ready for set ${currentSet + 1}.`;
  recordWorkoutSet();
  updateStatuses();
}

function synchronizeRepProgress() {
  if (!setActive) return;
  const completedReps = Math.min(...motors.map((motor) => motor.reps));
  if (completedReps <= currentRep) return;

  currentRep = Math.min(totalReps, completedReps);
  if (currentRep >= totalReps) {
    finishSet();
    return;
  }

  elements.message.textContent = `Set ${currentSet}: rep ${currentRep} complete.`;
  updateStatuses();
}

function recordWorkoutSet() {
  if (!currentRep) return;
  const exerciseKey = elements.exerciseSelect.value;
  const exerciseLabel = exerciseCatalog[exerciseKey] || 'Custom';
  const entry = {
    set: currentSet,
    exercise: exerciseLabel,
    reps: currentRep,
    left: Math.round(motors[0].currentResistance),
    right: Math.round(motors[1].currentResistance),
  };
  workoutLog.push(entry);

  const item = document.createElement('li');
  item.innerHTML = `<span class="log-set">Set ${entry.set}</span><span class="log-exercise">${entry.exercise}</span><span class="log-weight">${entry.left} lb / ${entry.right} lb</span><span class="log-reps">${entry.reps} reps</span>`;
  elements.logList.prepend(item);
}

requestAnimationFrame(update);

updateStatuses();

elements.forceDescription.textContent = forceCurveCopy[elements.forceSelect.value];
elements.forceLabel.textContent = elements.forceSelect.options[elements.forceSelect.selectedIndex].text;
applyPowerState();
