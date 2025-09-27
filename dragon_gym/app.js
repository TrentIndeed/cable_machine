const MAX_RESISTANCE = 300;
const TWO_PI = Math.PI * 2;
const MAX_TRAVEL_INCHES = 24;
const ENGAGEMENT_RAMP_INCHES = 1;
const REP_SPAN_THRESHOLD = 3;
const MOVEMENT_EPSILON = 0.05;
const DEFAULT_REP_TARGET = 12;
const TRAIL_LENGTH = 600;
const INCHES_PER_MILE = 63360;
const SECONDS_PER_HOUR = 3600;
const RETRACTION_SPEED_MPH = 0.2;
const RETRACTION_SPEED_IPS =
  (RETRACTION_SPEED_MPH * INCHES_PER_MILE) / SECONDS_PER_HOUR;
const SIM_SLIDER_STEP = 0.1;
const DEFAULT_RETRACTION_BOTTOM = 1;
const WEIGHT_ENGAGE_OFFSET = 1;

const elements = {
  workoutState: document.getElementById('workoutState'),
  startToggle: document.getElementById('toggleWorkout'),
  setToggle: document.getElementById('setToggle'),
  reset: document.getElementById('resetWorkout'),
  setStatus: document.getElementById('setStatus'),
  repStatus: document.getElementById('repStatus'),
  leftStatusReps: document.getElementById('leftStatusReps'),
  rightStatusReps: document.getElementById('rightStatusReps'),
  message: document.getElementById('workoutMessage'),
  forceSelect: document.getElementById('forceCurve'),
  forceDescription: document.getElementById('forceCurveDescription'),
  forceLabel: document.getElementById('forceCurveLabel'),
  forceCurveConcentric: document.getElementById('forceCurveConcentric'),
  forceCurveEccentric: document.getElementById('forceCurveEccentric'),
  eccentricToggle: document.getElementById('eccentricToggle'),
  eccentricPanel: document.getElementById('eccentricPanel'),
  eccentricSelect: document.getElementById('eccentricCurve'),
  eccentricDescription: document.getElementById('eccentricCurveDescription'),
  forceCurveIntensity: document.getElementById('forceCurveIntensity'),
  forcePanel: document.getElementById('forceCurvePanel'),
  powerToggle: document.getElementById('powerToggle'),
  motorToggle: document.getElementById('motorToggle'),
  logList: document.getElementById('workoutLogList'),
  exerciseSelect: document.getElementById('exerciseSelect'),
  exerciseTitle: document.getElementById('exerciseTitle'),
  exerciseImagePlaceholder: document.getElementById('exerciseImagePlaceholder'),
  exerciseVideoPlaceholder: document.getElementById('exerciseVideoPlaceholder'),
};

function getForceCurveCopy(mode, intensityPercent) {
  const pct = Math.round(intensityPercent);
  switch (mode) {
    case 'eccentric':
      return `+${pct}% load on the lowering phase.`;
    case 'chain':
      return `Gradually increases to +${pct}% at the top of the stroke.`;
    case 'band':
      return `Fast ramp to +${pct}% near lockout.`;
    case 'reverse-chain':
      return `Starts +${pct}% heavier and eases off toward the top.`;
    case 'linear':
    default:
      return 'Equal load through the pull and return.';
  }
}

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
let currentRep = 0;
let totalReps = DEFAULT_REP_TARGET;
let lastTimestamp = performance.now();
let powerOn = true;
let motorsRunning = true;
let eccentricOverrideEnabled = false;
let forceCurveIntensity = 20;
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
  const engageDisplay = document.getElementById(`${id}EngageDisplay`);
  const engageThresholdDisplay = document.getElementById(`${id}EngageThreshold`);
  const setCableButton = document.getElementById(`${id}SetCableLength`);
  const retractCableButton = document.getElementById(`${id}RetractCable`);

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
    engageDisplay,
    engageThresholdDisplay,
    setCableButton,
    retractCableButton,
    baseResistance: Number(slider.value),
    currentResistance: 0,
    reps: 0,
    engaged: false,
    engagementDistance: Math.max(DEFAULT_RETRACTION_BOTTOM, travelInches),
    setArmed: false,
    retractionActive: false,
    retractionTarget: DEFAULT_RETRACTION_BOTTOM,
    retractionSpeed: RETRACTION_SPEED_IPS,
    normalized,
    direction: 0,
    trail: new Array(TRAIL_LENGTH).fill(normalized),
    lastTravel: travelInches,
    phase: 'idle',
    lastPeak: travelInches,
    lastTrough: travelInches,
    repCounted: false,
  };
}

function resizeCanvasToDisplaySize(canvas) {
  if (!canvas) return false;
  const rect = canvas.getBoundingClientRect();
  const displayWidth = Math.round(rect.width);
  const displayHeight = Math.round(rect.height);
  if (!displayWidth || !displayHeight) {
    return false;
  }
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    return true;
  }
  return false;
}

function syncWaveCanvasSizes() {
  let resized = false;
  motors.forEach((motor) => {
    resized = resizeCanvasToDisplaySize(motor.waveCanvas) || resized;
  });
  if (resized) {
    motors.forEach((motor) => drawWave(motor));
  }
}

function syncGaugeCanvasSizes() {
  let resized = false;
  motors.forEach((motor) => {
    resized = resizeCanvasToDisplaySize(motor.gaugeCanvas) || resized;
  });
  if (resized) {
    motors.forEach((motor) => drawGauge(motor));
  }
}

function syncForceCurveCanvasSizes() {
  const canvases = [elements.forceCurveConcentric, elements.forceCurveEccentric];
  let resized = false;
  canvases.forEach((canvas) => {
    resized = resizeCanvasToDisplaySize(canvas) || resized;
  });
  if (resized) {
    redrawForceCurves();
  }
}

function resetMotorTracking(motor, travel) {
  motor.phase = 'idle';
  motor.repCounted = false;
  motor.lastPeak = travel;
  motor.lastTrough = travel;
  motor.lastTravel = travel;
  motor.direction = 0;
}

function calculateEngagementProgress(travel, engageDistance) {
  const engageStart = Math.max(
    0,
    Math.min(MAX_TRAVEL_INCHES, engageDistance + WEIGHT_ENGAGE_OFFSET)
  );
  const rampEnd = Math.min(MAX_TRAVEL_INCHES, engageStart + ENGAGEMENT_RAMP_INCHES);
  if (travel <= engageStart) {
    return 0;
  }
  if (travel >= rampEnd) {
    return 1;
  }
  const span = Math.max(0.001, rampEnd - engageStart);
  return Math.max(0, Math.min(1, (travel - engageStart) / span));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function quantize(value, step) {
  if (!step) return value;
  return Math.round(value / step) * step;
}

function formatMotorLabel(id) {
  if (!id) return 'System';
  return `${id.charAt(0).toUpperCase()}${id.slice(1)}`;
}


function renderMotorEngagement(motor) {
  if (!motor) return;
  const clampedValue = clamp(
    motor.engagementDistance,
    DEFAULT_RETRACTION_BOTTOM,
    MAX_TRAVEL_INCHES
  );
  const formatted = `${clampedValue.toFixed(1)} in`;
  const threshold = Math.min(
    MAX_TRAVEL_INCHES,
    clampedValue + WEIGHT_ENGAGE_OFFSET
  );
  const thresholdFormatted = `${threshold.toFixed(1)} in`;
  if (motor.engageDisplay) {
    motor.engageDisplay.textContent = formatted;
  }
  if (motor.engageThresholdDisplay) {
    motor.engageThresholdDisplay.textContent = thresholdFormatted;
  }
}

function announceMotorEngagementChange(motor, distance, source) {
  if (!elements.message || !motor) return;
  const clampedDistance = clamp(
    distance,
    DEFAULT_RETRACTION_BOTTOM,
    MAX_TRAVEL_INCHES
  );
  const actualEngage = Math.min(
    MAX_TRAVEL_INCHES,
    clampedDistance + WEIGHT_ENGAGE_OFFSET
  );
  const engageNote = ` Weight engages at ${actualEngage.toFixed(1)} in.`;
  const label = formatMotorLabel(motor.id);
  let message;
  switch (source) {
    case 'set-button':
      message = `${label} cable length locked at ${clampedDistance.toFixed(1)} in.`;
      break;
    case 'simulation':
      message = `${label} cable length synchronized to ${clampedDistance.toFixed(
        1
      )} in from the simulator.`;
      break;
    case 'retraction':
      message = `${label} cable retracted to ${clampedDistance.toFixed(1)} in.`;
      break;
    case 'engagement':
    default:
      message = `${label} engagement distance set to ${clampedDistance.toFixed(
        1
      )} in.`;
      break;
  }
  if (source !== 'retraction') {
    message = `${message}${engageNote}`;
  }
  elements.message.textContent = message;
}

function setMotorEngagementDistance(motor, distance, options = {}) {
  if (!motor) return null;
  const { skipSimSync = false, source = 'engagement', announce = true } = options;
  const clamped = clamp(distance, DEFAULT_RETRACTION_BOTTOM, MAX_TRAVEL_INCHES);
  const quantized = quantize(clamped, SIM_SLIDER_STEP);
  motor.engagementDistance = quantized;
  renderMotorEngagement(motor);
  refreshMotorResistance(motor);

  if (!skipSimSync && motor.simSlider) {
    motor.simSlider.value = quantized.toFixed(1);
  }

  if (announce) {
    announceMotorEngagementChange(motor, quantized, source);
  }

  return quantized;
}

function disarmMotorCableSet(motor, options = {}) {
  if (!motor || !motor.setArmed) return;
  const { silent = false } = options;
  motor.setArmed = false;
  toggleButtonPulse(motor.setCableButton, false);
  if (!silent && elements.message) {
    const label = formatMotorLabel(motor.id);
    elements.message.textContent = `${label} cable length arming canceled.`;
  }
}

function toggleMotorCableSet(motor) {
  if (!motor || !powerOn) return;
  if (motor.setArmed) {
    disarmMotorCableSet(motor);
    return;
  }
  motors.forEach((other) => {
    if (other !== motor) {
      disarmMotorCableSet(other, { silent: true });
    }
  });
  motor.setArmed = true;
  toggleButtonPulse(motor.setCableButton, true);
  if (elements.message) {
    const label = formatMotorLabel(motor.id);
    elements.message.textContent = `${label} cable length armed. Adjust the motor travel slider and release to lock it.`;
  }
}

function markRetractActive(motor, active) {
  if (!motor || !motor.retractCableButton) return;
  toggleButtonPulse(motor.retractCableButton, active);
}

function startMotorRetraction(motor) {
  if (!powerOn || !motor) return false;
  if (motor.retractionActive) return false;
  disarmMotorCableSet(motor, { silent: true });
  const current = Number(motor.simSlider.value || 0);
  if (current <= DEFAULT_RETRACTION_BOTTOM + SIM_SLIDER_STEP / 2) {
    if (elements.message) {
      const label = formatMotorLabel(motor.id);
      elements.message.textContent = `${label} control reports cable already at the retraction stop.`;
    }
    return false;
  }

  motor.retractionActive = true;
  motor.retractionTarget = DEFAULT_RETRACTION_BOTTOM;
  motor.retractionSpeed = RETRACTION_SPEED_IPS;
  markRetractActive(motor, true);

  if (elements.message) {
    const label = formatMotorLabel(motor.id);
    elements.message.textContent = `${label} cable retracting to ${motor.retractionTarget.toFixed(
      1
    )} in at ${RETRACTION_SPEED_MPH.toFixed(1)} mph.`;
  }

  return true;
}

function resolveMotorResistance(motor, engageDistance, mode) {
  if (!powerOn || !motorsRunning) {
    return 0;
  }

  const travel = motor.normalized * MAX_TRAVEL_INCHES;
  const rampProgress = calculateEngagementProgress(travel, engageDistance);
  if (rampProgress <= 0) {
    return 0;
  }

  const derivative = motor.direction || 1;
  const multiplier = computeForceMultiplier(mode, motor.normalized, derivative);
  const applied = motor.baseResistance * rampProgress * multiplier;
  return Math.min(MAX_RESISTANCE, Math.max(0, applied));
}

function refreshMotorResistance(motor) {
  if (!motor) return;
  const engageDistance = motor.engagementDistance;
  const mode = elements.forceSelect ? elements.forceSelect.value : 'linear';
  motor.currentResistance = resolveMotorResistance(motor, engageDistance, mode);
  drawGauge(motor);
}

function refreshAllMotorResistances() {
  motors.forEach((motor) => refreshMotorResistance(motor));
}

function updateSetToggleAppearance() {
  if (!elements.setToggle) return;
  const shouldDisable = !workoutActive || !powerOn;
  elements.setToggle.disabled = shouldDisable;

  if (setActive) {
    elements.setToggle.textContent = 'Stop Set';
    elements.setToggle.classList.remove('accent');
    elements.setToggle.classList.add('danger');
    elements.setToggle.setAttribute('aria-pressed', 'true');
  } else {
    elements.setToggle.textContent = 'Start Set';
    elements.setToggle.classList.remove('danger');
    if (!elements.setToggle.classList.contains('accent')) {
      elements.setToggle.classList.add('accent');
    }
    elements.setToggle.setAttribute('aria-pressed', 'false');
  }
}

function updateWorkoutToggleAppearance() {
  if (!elements.startToggle) return;
  const isActive = workoutActive && powerOn;
  elements.startToggle.textContent = isActive ? 'Stop Workout' : 'Start Workout';
  elements.startToggle.classList.toggle('is-stop', isActive);
  elements.startToggle.setAttribute('aria-pressed', isActive ? 'true' : 'false');
}

function toggleWorkout() {
  workoutActive = !workoutActive;
  if (elements.forcePanel) {
    elements.forcePanel.hidden = !workoutActive;
  }
  updateWorkoutToggleAppearance();

  updateSetToggleAppearance();
  elements.reset.disabled = !workoutActive;

  if (!workoutActive) {
    stopSet();
    currentSet = 0;
    currentRep = 0;
    totalReps = DEFAULT_REP_TARGET;
    if (elements.workoutState) {
      elements.workoutState.classList.remove('active');
      elements.workoutState.textContent = 'Workout Not Started';
    }
    elements.message.textContent = 'Tap “Start Workout” to arm the set controls.';
    eccentricOverrideEnabled = false;
    if (elements.eccentricToggle) {
      elements.eccentricToggle.textContent = 'Enable eccentric profile';
      elements.eccentricToggle.setAttribute('aria-expanded', 'false');
    }
    if (elements.eccentricPanel) {
      elements.eccentricPanel.hidden = true;
    }
    updateStatuses();
  } else {
    totalReps = DEFAULT_REP_TARGET;
    currentSet = 0;
    currentRep = 0;
    if (elements.workoutState) {
      elements.workoutState.classList.add('active');
      elements.workoutState.textContent = 'Workout Started';
    }
    elements.message.textContent = 'Press “Start Set” to begin counting reps.';
    updateStatuses();
    requestAnimationFrame(() => {
      syncForceCurveCanvasSizes();
      redrawForceCurves();
    });
  }

  updateForceCurveDescriptions();
  updateForceCurveLabel();
}

elements.startToggle.addEventListener('click', toggleWorkout);

elements.forceSelect.addEventListener('change', () => {
  updateForceCurveDescriptions();
  updateForceCurveLabel();
  redrawForceCurves();
  refreshAllMotorResistances();
});

if (elements.forceCurveIntensity) {
  setForceCurveIntensity(elements.forceCurveIntensity.value || forceCurveIntensity);
  elements.forceCurveIntensity.addEventListener('input', (event) => {
    setForceCurveIntensity(event.target.value);
  });
}

if (elements.eccentricToggle) {
  elements.eccentricToggle.addEventListener('click', () => {
    eccentricOverrideEnabled = !eccentricOverrideEnabled;
    elements.eccentricToggle.textContent = eccentricOverrideEnabled
      ? 'Disable eccentric profile'
      : 'Enable eccentric profile';
    elements.eccentricToggle.setAttribute('aria-expanded', eccentricOverrideEnabled ? 'true' : 'false');

    if (elements.eccentricPanel) {
      if (eccentricOverrideEnabled) {
        elements.eccentricPanel.removeAttribute('hidden');
      } else {
        elements.eccentricPanel.hidden = true;
      }
    }

    updateForceCurveDescriptions();
    updateForceCurveLabel();
    redrawForceCurves();
    refreshAllMotorResistances();
    requestAnimationFrame(() => {
      syncForceCurveCanvasSizes();
    });
  });
}

if (elements.eccentricSelect) {
  elements.eccentricSelect.addEventListener('change', () => {
    updateForceCurveDescriptions();
    updateForceCurveLabel();
    redrawForceCurves();
    refreshAllMotorResistances();
  });
}

updateSetToggleAppearance();
updateWorkoutToggleAppearance();

function startSet() {
  if (!workoutActive || !powerOn || setActive) return;

  setActive = true;
  if (elements.workoutState) {
    elements.workoutState.textContent = 'Workout Started';
    elements.workoutState.classList.add('active');
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
  updateSetToggleAppearance();
}

if (elements.setToggle) {
  elements.setToggle.addEventListener('click', () => {
    if (!workoutActive || !powerOn) return;
    if (setActive) {
      stopSet({ record: true });
    } else {
      startSet();
    }
  });
}

elements.reset.addEventListener('click', () => {
  stopSet();
  currentSet = 0;
  currentRep = 0;
  totalReps = DEFAULT_REP_TARGET;
  motors.forEach((motor) => {
    motor.reps = 0;
  });
  workoutLog.length = 0;
  elements.logList.innerHTML = '';
  updateStatuses();
  elements.message.textContent = 'Workout reset. Adjust engagement or force curve when ready.';
  if (elements.workoutState) {
    elements.workoutState.textContent = workoutActive ? 'Workout Started' : 'Workout Not Started';
  }
});

function stopSet(options = {}) {
  const { record = false } = options;
  const wasActive = setActive;
  setActive = false;
  updateSetToggleAppearance();
  if (!wasActive) return;

  let recorded = false;
  if (record && currentRep > 0) {
    const partial = currentRep < totalReps;
    recordWorkoutSet(partial);
    if (elements.workoutState) {
      elements.workoutState.textContent = partial ? 'Set Logged' : 'Set Complete';
    }
    elements.message.textContent = partial
      ? `Set ${currentSet} logged with ${currentRep} reps.`
      : `Set ${currentSet} complete. Press “Start Set” when you are ready for the next round.`;
    recorded = true;
  } else {
    if (elements.workoutState) {
      elements.workoutState.textContent = workoutActive ? 'Workout Started' : 'Workout Not Started';
    }
    elements.message.textContent = currentRep >= totalReps
      ? 'Set complete. Press “Start Set” for the next round.'
      : 'Set paused. Press “Start Set” to resume.';
  }

  motors.forEach((motor) => {
    const travel = motor.normalized * MAX_TRAVEL_INCHES;
    resetMotorTracking(motor, travel);
    if (recorded) {
      motor.reps = 0;
      motor.repsLabel.textContent = '0';
    }
  });
  if (recorded) {
    currentRep = 0;
  }
  updateStatuses();
}

motors.forEach((motor) => {
  motor.slider.addEventListener('input', () => {
    motor.baseResistance = Number(motor.slider.value);
    motor.baseLabel.textContent = `${motor.baseResistance} lb`;
    refreshMotorResistance(motor);
  });
  motor.simSlider.addEventListener('input', () => {
    const sliderDistance = Number(motor.simSlider.value);
    const normalized = Math.max(0, Math.min(1, sliderDistance / MAX_TRAVEL_INCHES));
    motor.normalized = normalized;
    motor.trail.push(normalized);
    if (motor.trail.length > TRAIL_LENGTH) {
      motor.trail.shift();
    }
    motor.cableLabel.textContent = (normalized * MAX_TRAVEL_INCHES).toFixed(1);
    drawWave(motor);
    refreshMotorResistance(motor);
  });
  motor.simSlider.addEventListener('change', () => {
    const distance = Number(motor.simSlider.value || 0);
    if (motor.setArmed) {
      setMotorEngagementDistance(motor, distance, { source: 'set-button' });
      disarmMotorCableSet(motor, { silent: true });
    } else {
      setMotorEngagementDistance(motor, distance, { source: 'simulation' });
    }
  });
  motor.baseLabel.textContent = `${motor.baseResistance} lb`;
  refreshMotorResistance(motor);

  if (motor.setCableButton) {
    motor.setCableButton.addEventListener('click', () => {
      toggleMotorCableSet(motor);
    });
  }
  if (motor.retractCableButton) {
    motor.retractCableButton.addEventListener('click', () => {
      startMotorRetraction(motor);
    });
  }
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
    elements.setToggle,
    elements.reset,
    elements.forceSelect,
    elements.forceCurveIntensity,
    elements.motorToggle,
  ];

  motors.forEach((motor) => {
    if (motor.setCableButton) {
      interactive.push(motor.setCableButton);
    }
    if (motor.retractCableButton) {
      interactive.push(motor.retractCableButton);
    }
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
    motors.forEach((motor) => {
      disarmMotorCableSet(motor, { silent: true });
      if (motor.retractionActive) {
        motor.retractionActive = false;
        markRetractActive(motor, false);
      }
    });
    stopSet();
    workoutActive = false;
    updateWorkoutToggleAppearance();
    if (elements.workoutState) {
      elements.workoutState.textContent = 'System Offline';
      elements.workoutState.classList.remove('active');
    }
    elements.message.textContent = 'Power system on to resume control.';
    motorsRunning = false;
    updateMotorToggle();
  } else {
    updateMotorToggle();
    if (elements.workoutState) {
      elements.workoutState.textContent = workoutActive ? 'Workout Started' : 'Workout Not Started';
    }
    updateWorkoutToggleAppearance();
  }

  updateSetToggleAppearance();
  refreshAllMotorResistances();
}

function toggleMotors() {
  if (!powerOn) return;
  motorsRunning = !motorsRunning;
  updateMotorToggle();
  refreshAllMotorResistances();
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
  elements.setStatus.textContent = `${currentSet}`;
  elements.repStatus.textContent = `${currentRep} / ${totalReps}`;
  if (elements.leftStatusReps) {
    elements.leftStatusReps.textContent = `${motors[0].reps}`;
  }
  if (elements.rightStatusReps) {
    elements.rightStatusReps.textContent = `${motors[1].reps}`;
  }
}

function getForceCurveMultiplier(mode, normalized, direction) {
  const clamped = Math.max(0, Math.min(1, normalized));
  const descending = direction < 0;
  const intensity = Math.max(0, Math.min(100, forceCurveIntensity)) / 100;

  switch (mode) {
    case 'eccentric':
      return descending ? 1 + intensity : 1.0;
    case 'chain':
      return 1 + clamped * intensity;
    case 'band':
      return 1 + Math.pow(clamped, 2.2) * intensity;
    case 'reverse-chain':
      return 1 + intensity - clamped * intensity;
    case 'linear':
    default:
      return 1.0;
  }
}

function computeForceMultiplier(mode, normalized, derivative) {
  const direction = derivative < 0 ? -1 : 1;
  let activeMode = mode;
  if (direction < 0 && eccentricOverrideEnabled && elements.eccentricSelect) {
    activeMode = elements.eccentricSelect.value;
  }
  return getForceCurveMultiplier(activeMode, normalized, direction);
}

function drawForceProfile(canvas, mode, direction) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(10, 16, 30, 0.92)';
  ctx.fillRect(0, 0, width, height);

  const intensity = Math.max(0, Math.min(100, forceCurveIntensity)) / 100;
  const displayedIntensity = Math.max(intensity, 0.05);

  const padding = {
    top: 28,
    right: 44,
    bottom: 56,
    left: 68,
  };

  const minForce = -displayedIntensity;
  const maxForce = displayedIntensity;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;

  const ySteps = 4;
  for (let i = 0; i <= ySteps; i += 1) {
    const value = minForce + ((maxForce - minForce) / ySteps) * i;
    const y = padding.top + ((maxForce - value) / (maxForce - minForce || 1)) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  const xSteps = 4;
  for (let i = 0; i <= xSteps; i += 1) {
    const x = padding.left + (plotWidth / xSteps) * i;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
  }

  const zeroY = padding.top + ((maxForce - 0) / (maxForce - minForce || 1)) * plotHeight;
  ctx.strokeStyle = 'rgba(127, 255, 212, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding.left, zeroY);
  ctx.lineTo(width - padding.right, zeroY);
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) {
    const travel = i / 120;
    const multiplier = getForceCurveMultiplier(mode, travel, direction);
    const delta = Math.max(minForce, Math.min(maxForce, multiplier - 1));
    const px = padding.left + travel * plotWidth;
    const py = padding.top + ((maxForce - delta) / (maxForce - minForce || 1)) * plotHeight;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.strokeStyle = 'rgba(31, 139, 255, 0.92)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(127, 255, 212, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  ctx.fillStyle = 'rgba(173, 201, 255, 0.85)';
  ctx.font = '12px "Roboto", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Cable Length', padding.left + plotWidth / 2, height - 16);

  ctx.save();
  ctx.translate(padding.left - 46, padding.top + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Force (%)', 0, 0);
  ctx.restore();

  const tickStep = displayedIntensity / 2;
  const tickValues = [
    -displayedIntensity,
    -tickStep,
    0,
    tickStep,
    displayedIntensity,
  ];
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  tickValues.forEach((value) => {
    const y = padding.top + ((maxForce - value) / (maxForce - minForce || 1)) * plotHeight;
    const offset = value === minForce ? 12 : value === maxForce ? -4 : 4;
    const percentLabel = `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`;
    ctx.fillText(percentLabel, padding.left - 8, y + offset);
  });
}

function redrawForceCurves() {
  const mode = elements.forceSelect.value;
  drawForceProfile(elements.forceCurveConcentric, mode, 1);

  const eccentricMode =
    eccentricOverrideEnabled && elements.eccentricSelect
      ? elements.eccentricSelect.value
      : mode;
  drawForceProfile(elements.forceCurveEccentric, eccentricMode, -1);
}

function updateForceCurveDescriptions() {
  const concentricMode = elements.forceSelect.value;
  const intensity = forceCurveIntensity;
  if (elements.forceDescription) {
    elements.forceDescription.textContent = `Concentric: ${getForceCurveCopy(concentricMode, intensity)}`;
  }

  if (elements.eccentricDescription) {
    const eccMode =
      elements.eccentricSelect && eccentricOverrideEnabled
        ? elements.eccentricSelect.value
        : concentricMode;
    elements.eccentricDescription.textContent = `Eccentric: ${getForceCurveCopy(eccMode, intensity)}`;
  }
}

function updateForceCurveLabel() {
  const concentricLabel = elements.forceSelect
    ? elements.forceSelect.options[elements.forceSelect.selectedIndex].text
    : 'Linear';

  if (eccentricOverrideEnabled && elements.eccentricSelect) {
    const eccentricLabel = elements.eccentricSelect.options[elements.eccentricSelect.selectedIndex].text;
    elements.forceLabel.textContent = `${concentricLabel} / ${eccentricLabel} (eccentric)`;
  } else {
    elements.forceLabel.textContent = concentricLabel;
  }
}

function setForceCurveIntensity(value) {
  const numeric = Number(value);
  const sanitized = Number.isFinite(numeric)
    ? Math.max(0, Math.min(100, numeric))
    : forceCurveIntensity;
  forceCurveIntensity = sanitized;
  if (elements.forceCurveIntensity) {
    elements.forceCurveIntensity.value = String(sanitized);
  }
  updateForceCurveDescriptions();
  updateForceCurveLabel();
  redrawForceCurves();
  refreshAllMotorResistances();
}


function drawGauge(motor) {
  const ctx = motor.gaugeCtx;
  const { width, height } = motor.gaugeCanvas;
  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 10;
  const startAngle = -Math.PI / 2;
  const strokeWidth = Math.max(8, radius * 0.08);

  ctx.lineCap = 'round';
  ctx.lineWidth = strokeWidth;

  ctx.strokeStyle = 'rgba(40, 54, 82, 0.55)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, TWO_PI, false);
  ctx.stroke();

  const progress = Math.max(0, Math.min(1, motor.currentResistance / MAX_RESISTANCE));
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(127, 255, 212, 0.95)');
  gradient.addColorStop(1, 'rgba(31, 139, 255, 0.95)');

  if (progress > 0) {
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + TWO_PI * progress, false);
    ctx.stroke();
  }

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
  const circleRadius = 16;
  const circleX = width - 46;
  const availableWidth = circleX - circleRadius;
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
  ctx.arc(circleX, headY, circleRadius, 0, TWO_PI);
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

  const mode = elements.forceSelect ? elements.forceSelect.value : 'linear';

  motors.forEach((motor) => {
    if (motor.retractionActive) {
      const tolerance = SIM_SLIDER_STEP / 2;
      const currentValue = Number(motor.simSlider.value);
      if (currentValue > motor.retractionTarget + tolerance) {
        const next = Math.max(
          motor.retractionTarget,
          currentValue - motor.retractionSpeed * delta
        );
        const quantized = quantize(next, SIM_SLIDER_STEP);
        motor.simSlider.value = quantized.toFixed(1);
      } else if (currentValue > motor.retractionTarget) {
        const quantized = quantize(motor.retractionTarget, SIM_SLIDER_STEP);
        motor.simSlider.value = quantized.toFixed(1);
      } else {
        motor.retractionActive = false;
        markRetractActive(motor, false);
        setMotorEngagementDistance(motor, motor.retractionTarget, {
          skipSimSync: true,
          source: 'retraction',
          announce: true,
        });
      }
    }

    const sliderDistance = Number(motor.simSlider.value);
    const normalized = Math.max(0, Math.min(1, sliderDistance / MAX_TRAVEL_INCHES));
    const previous = motor.normalized;
    motor.normalized = normalized;
    const travel = motor.normalized * MAX_TRAVEL_INCHES;
    const derivative = delta > 0 ? (normalized - previous) / delta : 0;
    motor.direction = derivative >= 0 ? 1 : -1;

    const engageDistance = motor.engagementDistance;
    const engageThresholdDistance = Math.min(
      MAX_TRAVEL_INCHES,
      engageDistance + WEIGHT_ENGAGE_OFFSET
    );
    const engageThreshold = Math.min(
      0.98,
      engageThresholdDistance / MAX_TRAVEL_INCHES
    );

    if (
      motorsRunning &&
      setActive &&
      !motor.engaged &&
      motor.normalized >= engageThreshold
    ) {
      motor.engaged = true;
      if (elements.message) {
        const label = formatMotorLabel(motor.id);
        elements.message.textContent = `${label} motor engaged at ${engageThresholdDistance.toFixed(
          1
        )} in. Rep tracking armed.`;
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

    motor.currentResistance = resolveMotorResistance(motor, engageDistance, mode);

    motor.cableLabel.textContent = travel.toFixed(1);

    motor.trail.push(motor.normalized);
    if (motor.trail.length > TRAIL_LENGTH) {
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
  updateSetToggleAppearance();
  motors.forEach((motor) => {
    motor.engaged = false;
    const travel = motor.normalized * MAX_TRAVEL_INCHES;
    resetMotorTracking(motor, travel);
  });
  if (elements.workoutState) {
    elements.workoutState.textContent = 'Set Complete';
  }
  elements.message.textContent = `Set ${currentSet} complete. Press “Start Set” when you are ready for the next round.`;
  recordWorkoutSet();
  updateStatuses();
}

function synchronizeRepProgress() {
  if (!setActive) return;
  const completedReps = Math.max(...motors.map((motor) => motor.reps));
  if (completedReps <= currentRep) {
    updateStatuses();
    return;
  }

  currentRep = Math.min(totalReps, completedReps);
  if (currentRep >= totalReps) {
    finishSet();
    return;
  }

  elements.message.textContent = `Set ${currentSet}: rep ${currentRep} complete.`;
  updateStatuses();
}

function recordWorkoutSet(partial = false) {
  if (!currentRep) return;
  const exerciseKey = elements.exerciseSelect.value;
  const exerciseLabel = exerciseCatalog[exerciseKey] || 'Custom';
  const entry = {
    set: currentSet,
    exercise: exerciseLabel,
    reps: currentRep,
    left: Math.round(motors[0].currentResistance),
    right: Math.round(motors[1].currentResistance),
    partial,
  };
  workoutLog.push(entry);

  const item = document.createElement('li');
  const partialBadge = entry.partial
    ? '<span class="log-partial">Partial</span>'
    : '';
  item.innerHTML = `<span class="log-set">Set ${entry.set}${partialBadge}</span><span class="log-exercise">${entry.exercise}</span><span class="log-weight">${entry.left} lb / ${entry.right} lb</span><span class="log-reps">${entry.reps} reps</span>`;
  elements.logList.prepend(item);
}

motors.forEach((motor) => {
  setMotorEngagementDistance(motor, DEFAULT_RETRACTION_BOTTOM, { announce: false });
});

requestAnimationFrame(update);

updateStatuses();

updateForceCurveDescriptions();
updateForceCurveLabel();
redrawForceCurves();
if (elements.eccentricPanel) {
  elements.eccentricPanel.hidden = true;
}
applyPowerState();

requestAnimationFrame(() => {
  syncWaveCanvasSizes();
  syncForceCurveCanvasSizes();
  syncGaugeCanvasSizes();
});

window.addEventListener('resize', () => {
  syncWaveCanvasSizes();
  syncForceCurveCanvasSizes();
  syncGaugeCanvasSizes();
});
