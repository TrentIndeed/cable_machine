const MAX_RESISTANCE = 300;
const TWO_PI = Math.PI * 2;
const MAX_TRAVEL_INCHES = 24;

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
    currentId: 'leftCurrentResistance',
    baseId: 'leftBaseResistance',
    repsId: 'leftRepCount',
    cableId: 'leftCableDistance',
    phaseOffset: 0,
  }),
  createMotor('right', {
    gaugeId: 'rightGauge',
    waveId: 'rightWave',
    sliderId: 'rightResistance',
    currentId: 'rightCurrentResistance',
    baseId: 'rightBaseResistance',
    repsId: 'rightRepCount',
    cableId: 'rightCableDistance',
    phaseOffset: Math.PI / 3,
  }),
];

let workoutActive = false;
let setActive = false;
let currentSet = 0;
let totalSets = 0;
let currentRep = 0;
let totalReps = 0;
let lastTimestamp = performance.now();

const waveColors = {
  left: createGradient(motors[0].waveCtx),
  right: createGradient(motors[1].waveCtx),
};

function createMotor(id, refs) {
  const gaugeCanvas = document.getElementById(refs.gaugeId);
  const gaugeCtx = gaugeCanvas.getContext('2d');
  const waveCanvas = document.getElementById(refs.waveId);
  const waveCtx = waveCanvas.getContext('2d');

  const slider = document.getElementById(refs.sliderId);
  const currentLabel = document.getElementById(refs.currentId);
  const baseLabel = document.getElementById(refs.baseId);
  const repsLabel = document.getElementById(refs.repsId);
  const cableLabel = document.getElementById(refs.cableId);

  return {
    id,
    gaugeCanvas,
    gaugeCtx,
    waveCanvas,
    waveCtx,
    slider,
    currentLabel,
    baseLabel,
    repsLabel,
    cableLabel,
    phase: 0,
    phaseOffset: refs.phaseOffset || 0,
    baseResistance: Number(slider.value),
    currentResistance: Number(slider.value),
    reps: 0,
    engaged: false,
    normalized: 0.5,
    direction: 1,
    speedFactor: id === 'left' ? 1 : 1.08,
  };
}

function createGradient(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
  gradient.addColorStop(0, 'rgba(31, 139, 255, 0.8)');
  gradient.addColorStop(0.45, 'rgba(127, 255, 212, 0.8)');
  gradient.addColorStop(1, 'rgba(31, 139, 255, 0.3)');
  return gradient;
}

function updateEngageDisplay() {
  elements.engageDisplay.textContent = Number(elements.engageSlider.value).toFixed(1);
}

function toggleWorkout() {
  workoutActive = !workoutActive;
  elements.options.hidden = !workoutActive;
  elements.startToggle.textContent = workoutActive ? 'Hide Workout' : 'Start Workout';

  elements.startSet.disabled = !workoutActive;
  elements.reset.disabled = !workoutActive;

  if (!workoutActive) {
    stopSet();
    currentSet = 0;
    totalSets = 0;
    currentRep = 0;
    totalReps = 0;
    elements.workoutState.classList.remove('active');
    elements.workoutState.textContent = 'Workout Idle';
    elements.message.textContent = 'Tap “Start Workout” to program your session.';
    updateStatuses();
  } else {
    totalSets = Math.max(1, Number(elements.setCount.value));
    totalReps = Math.max(1, Number(elements.repCount.value));
    currentSet = 0;
    currentRep = 0;
    elements.workoutState.classList.add('active');
    elements.workoutState.textContent = 'Programming';
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
  elements.workoutState.textContent = 'Set Running';
  elements.workoutState.classList.add('active');

  totalSets = Math.max(1, Number(elements.setCount.value));
  totalReps = Math.max(1, Number(elements.repCount.value));

  if (currentSet >= totalSets) {
    currentSet = 0;
  }
  currentSet += 1;
  currentRep = 0;
  motors.forEach((motor) => {
    motor.phase = 0;
    motor.reps = 0;
    motor.engaged = false;
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
  updateStatuses();
  elements.message.textContent = 'Workout reset. Adjust parameters when ready.';
});

function stopSet() {
  if (!setActive) return;
  setActive = false;
  elements.startSet.disabled = !workoutActive;
  elements.stopSet.disabled = true;
  elements.workoutState.textContent = 'Workout Paused';
  elements.message.textContent = currentRep >= totalReps
    ? 'Set complete. Press “Start Set” for the next round.'
    : 'Set paused. Press “Start Set” to resume.';
}

motors.forEach((motor) => {
  motor.slider.addEventListener('input', () => {
    motor.baseResistance = Number(motor.slider.value);
    motor.baseLabel.textContent = `${motor.baseResistance} lb`;
  });
  motor.baseLabel.textContent = `${motor.baseResistance} lb`;
});

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
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 0.25;

  ctx.lineCap = 'round';
  ctx.lineWidth = 12;

  ctx.strokeStyle = 'rgba(40, 54, 82, 0.65)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
  ctx.stroke();

  const progress = Math.max(0, Math.min(1, motor.currentResistance / MAX_RESISTANCE));
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(127, 255, 212, 0.95)');
  gradient.addColorStop(1, 'rgba(31, 139, 255, 0.95)');

  ctx.strokeStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, startAngle + (endAngle - startAngle) * progress, false);
  ctx.stroke();

  motor.currentLabel.textContent = `${Math.round(motor.currentResistance)} lb`;
  motor.repsLabel.textContent = `${motor.reps}`;
}

function drawWave(motor) {
  const ctx = motor.waveCtx;
  const { width, height } = motor.waveCanvas;
  ctx.clearRect(0, 0, width, height);

  ctx.lineWidth = 4;
  ctx.strokeStyle = waveColors[motor.id];
  ctx.beginPath();

  const amplitude = height * 0.38;
  const baseline = height / 2;
  const segments = Math.floor(width / 4);

  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width;
    const theta = motor.phase + motor.phaseOffset + (i / segments) * TWO_PI;
    const y = baseline - Math.sin(theta) * amplitude;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  const bubbleX = width - 40;
  const bubbleY = baseline - Math.sin(motor.phase + motor.phaseOffset) * amplitude;
  ctx.fillStyle = 'rgba(31, 139, 255, 0.35)';
  ctx.beginPath();
  ctx.arc(bubbleX, bubbleY, 14, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = 'rgba(127, 255, 212, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function update(timestamp) {
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  const engageThreshold = Math.min(0.98, Number(elements.engageSlider.value) / MAX_TRAVEL_INCHES);
  const mode = elements.forceSelect.value;

  motors.forEach((motor, index) => {
    const speed = setActive ? 1.9 * motor.speedFactor : 0.6 * (index === 0 ? 1 : 1.1);
    motor.phase += delta * speed;

    if (motor.phase >= TWO_PI) {
      motor.phase -= TWO_PI;
      if (setActive && motor.engaged) {
        motor.reps += 1;
        if (motor.id === 'left') {
          currentRep = Math.min(totalReps, currentRep + 1);
          if (currentRep >= totalReps) {
            finishSet();
          } else {
            elements.message.textContent = `Set ${currentSet}: rep ${currentRep} complete.`;
          }
          updateStatuses();
        }
      }
    }

    motor.normalized = 0.5 + 0.5 * Math.sin(motor.phase);
    motor.direction = Math.cos(motor.phase) >= 0 ? 1 : -1;

    if (setActive && !motor.engaged && motor.normalized >= engageThreshold) {
      motor.engaged = true;
      if (motor.id === 'left') {
        elements.message.textContent = `Left motor engaged at ${elements.engageSlider.value} in. Rep tracking armed.`;
      }
    }

    if (!setActive) {
      motor.engaged = false;
      motor.reps = 0;
    }

    const multiplier = computeForceMultiplier(mode, motor.normalized, motor.direction);
    motor.currentResistance = Math.min(
      MAX_RESISTANCE,
      Math.max(0, motor.baseResistance * multiplier)
    );

    const travel = motor.normalized * MAX_TRAVEL_INCHES;
    motor.cableLabel.textContent = travel.toFixed(1);

    drawGauge(motor);
    drawWave(motor);
  });

  requestAnimationFrame(update);
}

function finishSet() {
  setActive = false;
  elements.startSet.disabled = currentSet >= totalSets;
  elements.stopSet.disabled = true;
  elements.workoutState.textContent = currentSet >= totalSets ? 'Workout Complete' : 'Set Complete';
  elements.message.textContent = currentSet >= totalSets
    ? 'Workout complete! Reset or adjust your programming to begin again.'
    : `Set ${currentSet} complete. Press “Start Set” when ready for set ${currentSet + 1}.`;
}

requestAnimationFrame(update);

updateStatuses();

elements.forceDescription.textContent = forceCurveCopy[elements.forceSelect.value];
elements.forceLabel.textContent = elements.forceSelect.options[elements.forceSelect.selectedIndex].text;
