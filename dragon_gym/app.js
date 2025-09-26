import { CoreDataService } from './dataService.js';

const MAX_RESISTANCE = 300;
const MAX_TRAVEL_INCHES = 24;
const TRAIL_LENGTH = 600;
const DEFAULT_REP_TARGET = 12;

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
  engageSlider: document.getElementById('engageDistance'),
  engageDisplay: document.getElementById('engageDisplay'),
  setCableButton: document.getElementById('setCableLength'),
  powerToggle: document.getElementById('powerToggle'),
  motorToggle: document.getElementById('motorToggle'),
  logList: document.getElementById('workoutLogList'),
  exerciseSelect: document.getElementById('exerciseSelect'),
  exerciseTitle: document.getElementById('exerciseTitle'),
  exerciseImagePlaceholder: document.getElementById('exerciseImagePlaceholder'),
  exerciseVideoPlaceholder: document.getElementById('exerciseVideoPlaceholder'),
};

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

function createMotorView(id, refs) {
  const gaugeCanvas = document.getElementById(refs.gaugeId);
  const waveCanvas = document.getElementById(refs.waveId);
  const slider = document.getElementById(refs.sliderId);
  const simSlider = document.getElementById(refs.simId);
  const currentLabel = document.getElementById(refs.currentId);
  const baseLabel = document.getElementById(refs.baseId);
  const repsLabel = document.getElementById(refs.repsId);
  const cableLabel = document.getElementById(refs.cableId);

  const baseResistance = Number(slider.value) || 0;
  const travel = Number(simSlider.value) || 0;
  const normalized = Math.max(0, Math.min(1, travel / MAX_TRAVEL_INCHES));

  const trail = new Float32Array(TRAIL_LENGTH);
  trail.fill(normalized);

  return {
    id,
    gaugeCanvas,
    gaugeCtx: gaugeCanvas.getContext('2d'),
    waveCanvas,
    waveCtx: waveCanvas.getContext('2d'),
    slider,
    simSlider,
    currentLabel,
    baseLabel,
    repsLabel,
    cableLabel,
    baseResistance,
    currentResistance: 0,
    normalized,
    trail,
    trailCursor: 0,
    trailLength: TRAIL_LENGTH,
  };
}

const motors = [
  createMotorView('left', {
    gaugeId: 'leftGauge',
    waveId: 'leftWave',
    sliderId: 'leftResistance',
    simId: 'leftSim',
    currentId: 'leftCurrentResistance',
    baseId: 'leftBaseResistance',
    repsId: 'leftRepCount',
    cableId: 'leftCableDistance',
  }),
  createMotorView('right', {
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

motors.forEach((motor) => {
  motor.baseLabel.textContent = `${Math.round(motor.baseResistance)} lb`;
  motor.repsLabel.textContent = '0';
  motor.cableLabel.textContent = (motor.normalized * MAX_TRAVEL_INCHES).toFixed(1);
});

const profileState = {
  targetReps: DEFAULT_REP_TARGET,
  targetSets: 3,
  engagementInches: Number(elements.engageSlider.value) || 1.5,
  forceMode: elements.forceSelect.value || 'linear',
  eccentricMode: elements.forceSelect.value || 'linear',
  forceIntensity: (Number(elements.forceCurveIntensity.value) || 20) / 100,
};

const uiState = {
  powerOn: true,
  motorsEnabled: true,
  workoutActive: false,
  setActive: false,
  currentSet: 0,
  repTarget: profileState.targetReps,
  lastCompletedSequence: 0,
};

let eccentricEnabled = false;
let intensityPercent = Math.round(profileState.forceIntensity * 100);

const service = new CoreDataService();
service.updateProfile(profileState);
service.updateSetpoint({
  leftBaseResistance: motors[0].baseResistance,
  rightBaseResistance: motors[1].baseResistance,
  leftTravelInches: Number(motors[0].simSlider.value) || 0,
  rightTravelInches: Number(motors[1].simSlider.value) || 0,
});

let latestTelemetry = service.getSnapshot();
let telemetryDirty = true;
const completionQueue = [];

service.onTelemetry((telemetry) => {
  latestTelemetry = telemetry;
  telemetryDirty = true;
  if (telemetry.setComplete && telemetry.setSequence && telemetry.setSequence !== uiState.lastCompletedSequence) {
    completionQueue.push({
      sequence: telemetry.setSequence,
      totalReps: telemetry.totalReps,
      leftReps: telemetry.leftReps,
      rightReps: telemetry.rightReps,
      leftResistance: telemetry.leftResistance,
      rightResistance: telemetry.rightResistance,
    });
    uiState.lastCompletedSequence = telemetry.setSequence;
  }
});

service.onFault((fault) => {
  if (!elements.message) return;
  const description = fault.description || 'Core fault reported.';
  elements.message.textContent = description;
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function syncCanvasSize(canvas) {
  if (!canvas) return false;
  const rect = canvas.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  if (!width || !height) return false;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}

function syncMotorCanvases() {
  let updated = false;
  motors.forEach((motor) => {
    updated = syncCanvasSize(motor.gaugeCanvas) || updated;
    updated = syncCanvasSize(motor.waveCanvas) || updated;
  });
  if (updated) {
    motors.forEach((motor) => {
      drawGauge(motor);
      drawWave(motor);
    });
  }
}

function syncForceCanvases() {
  let updated = false;
  if (elements.forceCurveConcentric) {
    updated = syncCanvasSize(elements.forceCurveConcentric) || updated;
  }
  if (elements.forceCurveEccentric) {
    updated = syncCanvasSize(elements.forceCurveEccentric) || updated;
  }
  if (updated) {
    redrawForceCurves();
  }
}

function pushTrailSample(motor, normalized) {
  motor.trail[motor.trailCursor] = normalized;
  motor.trailCursor = (motor.trailCursor + 1) % TRAIL_LENGTH;
  if (motor.trailLength < TRAIL_LENGTH) {
    motor.trailLength += 1;
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
  const strokeWidth = Math.max(8, radius * 0.08);

  ctx.lineCap = 'round';
  ctx.lineWidth = strokeWidth;

  ctx.strokeStyle = 'rgba(40, 54, 82, 0.55)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
  ctx.stroke();

  const progress = clamp(motor.currentResistance / MAX_RESISTANCE, 0, 1);
  if (progress > 0) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(127, 255, 212, 0.95)');
    gradient.addColorStop(1, 'rgba(31, 139, 255, 0.95)');
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + Math.PI * 2 * progress, false);
    ctx.stroke();
  }
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

  const len = motor.trailLength;
  if (len > 0) {
    const startIndex = (motor.trailCursor - len + TRAIL_LENGTH) % TRAIL_LENGTH;
    for (let i = 0; i < len; i += 1) {
      const index = (startIndex + i) % TRAIL_LENGTH;
      const sample = motor.trail[index];
      const progress = len > 1 ? i / (len - 1) : 0;
      const x = progress * availableWidth;
      const y = topPadding + (1 - sample) * usableHeight;
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
  ctx.arc(circleX, headY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(127, 255, 212, 0.85)';
  ctx.stroke();
}

function getForceCurveCopy(mode, intensity) {
  const pct = Math.round(intensity * 100);
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

function drawForceProfile(canvas, mode, direction) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(10, 16, 30, 0.92)';
  ctx.fillRect(0, 0, width, height);

  const intensity = clamp(profileState.forceIntensity, 0, 1);
  const displayIntensity = Math.max(intensity, 0.05);

  const padding = {
    top: 28,
    right: 44,
    bottom: 56,
    left: 68,
  };

  const minForce = -displayIntensity;
  const maxForce = displayIntensity;
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
    const multiplier = (() => {
      const descending = direction < 0;
      switch (mode) {
        case 'eccentric':
          return descending ? 1 + intensity : 1;
        case 'chain':
          return 1 + travel * intensity;
        case 'band':
          return 1 + Math.pow(travel, 2.2) * intensity;
        case 'reverse-chain':
          return 1 + intensity - travel * intensity;
        case 'linear':
        default:
          return 1;
      }
    })();
    const delta = clamp(multiplier - 1, minForce, maxForce);
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
  ctx.translate(22, padding.top + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Force', 0, 0);
  ctx.restore();
}

function redrawForceCurves() {
  drawForceProfile(elements.forceCurveConcentric, profileState.forceMode, 1);
  if (elements.forceCurveEccentric) {
    const eccentricMode = eccentricEnabled ? elements.eccentricSelect.value : profileState.forceMode;
    drawForceProfile(elements.forceCurveEccentric, eccentricMode, -1);
  }
}

function updateForceCurveDescriptions() {
  if (elements.forceDescription) {
    elements.forceDescription.textContent = `Concentric: ${getForceCurveCopy(profileState.forceMode, profileState.forceIntensity)}`;
  }
  if (elements.eccentricSelect && elements.eccentricDescription) {
    const eccentricMode = elements.eccentricSelect.value;
    const description = getForceCurveCopy(eccentricMode, profileState.forceIntensity);
    elements.eccentricDescription.textContent = `Eccentric: ${description}`;
  }
}

function updateForceCurveLabel() {
  if (!elements.forceLabel) return;
  const modeLabel = profileState.forceMode.replace('-', ' ');
  elements.forceLabel.textContent = `${modeLabel.charAt(0).toUpperCase()}${modeLabel.slice(1)} · ${intensityPercent}%`;
}

function updateStatuses() {
  if (elements.setStatus) {
    elements.setStatus.textContent = `${uiState.currentSet}`;
  }
  if (elements.repStatus) {
    const totalReps = latestTelemetry.totalReps || 0;
    const displayReps = Math.min(totalReps, uiState.repTarget);
    elements.repStatus.textContent = `${displayReps} / ${uiState.repTarget}`;
  }
  if (elements.leftStatusReps) {
    elements.leftStatusReps.textContent = `${latestTelemetry.leftReps || 0}`;
  }
  if (elements.rightStatusReps) {
    elements.rightStatusReps.textContent = `${latestTelemetry.rightReps || 0}`;
  }
}

function updateWorkoutStateLabel() {
  if (!elements.workoutState) return;
  let label = 'Workout Not Started';
  if (!uiState.powerOn) {
    label = 'System Offline';
  } else if (uiState.setActive) {
    label = 'Set Active';
  } else if (uiState.workoutActive) {
    label = 'Workout Started';
  }
  elements.workoutState.textContent = label;
  if (uiState.workoutActive) {
    elements.workoutState.classList.add('active');
  } else {
    elements.workoutState.classList.remove('active');
  }
}

function updateWorkoutToggleAppearance() {
  if (!elements.startToggle) return;
  const active = uiState.workoutActive && uiState.powerOn;
  elements.startToggle.textContent = active ? 'Stop Workout' : 'Start Workout';
  elements.startToggle.classList.toggle('is-stop', active);
  elements.startToggle.setAttribute('aria-pressed', active ? 'true' : 'false');
}

function updateSetToggleAppearance() {
  if (!elements.setToggle) return;
  elements.setToggle.disabled = !uiState.workoutActive || !uiState.powerOn;
  if (uiState.setActive) {
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

function updateMotorToggle() {
  if (!elements.motorToggle) return;
  if (!uiState.powerOn) {
    elements.motorToggle.dataset.state = 'offline';
    elements.motorToggle.innerHTML = '<span class="status-line">Motors Offline</span><span class="action-line">Power on required</span>';
    elements.motorToggle.disabled = true;
    elements.motorToggle.setAttribute('aria-pressed', 'false');
    return;
  }

  elements.motorToggle.disabled = false;
  if (uiState.motorsEnabled) {
    elements.motorToggle.dataset.state = 'online';
    elements.motorToggle.innerHTML = '<span class="status-line">Motors Ready</span><span class="action-line">Tap to stop</span>';
    elements.motorToggle.setAttribute('aria-pressed', 'true');
  } else {
    elements.motorToggle.dataset.state = 'offline';
    elements.motorToggle.innerHTML = '<span class="status-line">Motors Offline</span><span class="action-line">Tap to start</span>';
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
    elements.engageSlider,
    elements.setCableButton,
    elements.motorToggle,
  ];

  motors.forEach((motor) => {
    motor.slider.disabled = !uiState.powerOn;
    motor.simSlider.disabled = !uiState.powerOn;
  });

  interactive.forEach((el) => {
    if (!el) return;
    if (!uiState.powerOn) {
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
    elements.powerToggle.textContent = uiState.powerOn ? 'Shutdown' : 'Power On';
    elements.powerToggle.dataset.state = uiState.powerOn ? 'on' : 'off';
    elements.powerToggle.setAttribute('aria-pressed', uiState.powerOn ? 'true' : 'false');
  }

  updateMotorToggle();
  updateSetToggleAppearance();
  updateWorkoutToggleAppearance();
}

function recordWorkoutSet(entry) {
  if (!entry || entry.totalReps === 0) {
    return;
  }
  const exerciseKey = elements.exerciseSelect.value;
  const exerciseLabel = exerciseCatalog[exerciseKey] || 'Custom';
  const partial = entry.totalReps < uiState.repTarget;
  const item = document.createElement('li');
  const partialBadge = partial ? '<span class="log-partial">Partial</span>' : '';
  item.innerHTML = `<span class="log-set">Set ${entry.sequence}${partialBadge}</span><span class="log-exercise">${exerciseLabel}</span><span class="log-weight">${Math.round(entry.leftResistance)} lb / ${Math.round(entry.rightResistance)} lb</span><span class="log-reps">${entry.totalReps} reps</span>`;
  elements.logList.prepend(item);
}

function processCompletionQueue() {
  if (!completionQueue.length) return;
  while (completionQueue.length) {
    const entry = completionQueue.shift();
    recordWorkoutSet(entry);
    const partial = entry.totalReps < uiState.repTarget;
    if (entry.totalReps > 0) {
      elements.message.textContent = partial
        ? `Set ${entry.sequence} stopped at ${entry.totalReps} reps.`
        : `Set ${entry.sequence} complete. Ready for the next round.`;
    } else {
      elements.message.textContent = `Set ${entry.sequence} ended with no reps recorded.`;
    }
    uiState.setActive = false;
  }
}

function updateFromTelemetry() {
  const prevPower = uiState.powerOn;
  const prevMotors = uiState.motorsEnabled;
  uiState.powerOn = latestTelemetry.powerOn;
  uiState.motorsEnabled = latestTelemetry.motorsEnabled;
  uiState.workoutActive = latestTelemetry.workoutActive;
  uiState.setActive = latestTelemetry.setActive;
  uiState.currentSet = latestTelemetry.setSequence || 0;

  motors[0].currentResistance = latestTelemetry.leftResistance || 0;
  motors[0].normalized = clamp(latestTelemetry.leftNormalized || 0, 0, 1);
  motors[0].currentLabel.textContent = `${Math.round(motors[0].currentResistance)} lb`;
  motors[0].repsLabel.textContent = `${latestTelemetry.leftReps || 0}`;
  motors[0].cableLabel.textContent = (latestTelemetry.leftTravelInches || 0).toFixed(1);
  pushTrailSample(motors[0], motors[0].normalized);

  motors[1].currentResistance = latestTelemetry.rightResistance || 0;
  motors[1].normalized = clamp(latestTelemetry.rightNormalized || 0, 0, 1);
  motors[1].currentLabel.textContent = `${Math.round(motors[1].currentResistance)} lb`;
  motors[1].repsLabel.textContent = `${latestTelemetry.rightReps || 0}`;
  motors[1].cableLabel.textContent = (latestTelemetry.rightTravelInches || 0).toFixed(1);
  pushTrailSample(motors[1], motors[1].normalized);

  updateStatuses();
  updateWorkoutToggleAppearance();
  updateSetToggleAppearance();
  updateMotorToggle();
  if (prevPower !== uiState.powerOn) {
    applyPowerState();
  } else if (prevMotors !== uiState.motorsEnabled) {
    updateMotorToggle();
  }
  processCompletionQueue();
  updateWorkoutStateLabel();
}

function update(timestamp) {
  if (telemetryDirty) {
    updateFromTelemetry();
    telemetryDirty = false;
  }

  motors.forEach((motor) => {
    drawGauge(motor);
    drawWave(motor);
  });

  requestAnimationFrame(update);
}

function toggleWorkout() {
  if (!uiState.powerOn) return;
  uiState.workoutActive = !uiState.workoutActive;
  service.setWorkoutState(uiState.workoutActive);
  if (!uiState.workoutActive) {
    uiState.setActive = false;
    service.setSetActive(false);
    uiState.currentSet = 0;
    uiState.lastCompletedSequence = 0;
    elements.message.textContent = 'Workout stopped. Press “Start Workout” to resume.';
    if (elements.forcePanel) {
      elements.forcePanel.hidden = true;
    }
  } else {
    elements.message.textContent = 'Press “Start Set” to begin counting reps.';
    if (elements.forcePanel) {
      elements.forcePanel.hidden = false;
    }
  }
  updateWorkoutToggleAppearance();
  updateSetToggleAppearance();
  updateWorkoutStateLabel();
}

function toggleSet() {
  if (!uiState.powerOn || !uiState.workoutActive) return;
  const nextState = !uiState.setActive;
  uiState.setActive = nextState;
  service.setSetActive(nextState);
  if (nextState) {
    uiState.currentSet += 1;
    elements.message.textContent = `Set ${uiState.currentSet} active. Cable movement will arm the servos.`;
  } else {
    elements.message.textContent = `Set ${uiState.currentSet} stopped.`;
  }
  updateSetToggleAppearance();
  updateStatuses();
  updateWorkoutStateLabel();
}

function resetWorkout() {
  uiState.currentSet = 0;
  uiState.lastCompletedSequence = 0;
  uiState.setActive = false;
  service.setSetActive(false);
  service.setWorkoutState(false);
  uiState.workoutActive = false;
  latestTelemetry.leftReps = 0;
  latestTelemetry.rightReps = 0;
  latestTelemetry.totalReps = 0;
  completionQueue.length = 0;
  elements.logList.innerHTML = '';
  elements.message.textContent = 'Session reset. Tap “Start Workout” to begin again.';
  updateStatuses();
  updateWorkoutToggleAppearance();
  updateSetToggleAppearance();
  updateWorkoutStateLabel();
}

function togglePower() {
  uiState.powerOn = !uiState.powerOn;
  service.setPowerState(uiState.powerOn);
  if (!uiState.powerOn) {
    uiState.workoutActive = false;
    uiState.setActive = false;
    uiState.currentSet = 0;
    uiState.lastCompletedSequence = 0;
    elements.message.textContent = 'Power system off. Enable power to resume control.';
  } else {
    elements.message.textContent = 'Power restored. Tap “Start Workout” to begin.';
  }
  applyPowerState();
  updateWorkoutStateLabel();
}

function toggleMotors() {
  if (!uiState.powerOn) return;
  uiState.motorsEnabled = !uiState.motorsEnabled;
  service.setMotorsEnabled(uiState.motorsEnabled);
  elements.message.textContent = uiState.motorsEnabled
    ? 'Motors ready. Cable engagement will arm resistance.'
    : 'Motors offline. Enable to resume resistance control.';
  updateMotorToggle();
}

function updateEngageDisplay() {
  const value = Number(elements.engageSlider.value) || 0;
  profileState.engagementInches = clamp(value, 0, MAX_TRAVEL_INCHES);
  elements.engageDisplay.textContent = profileState.engagementInches.toFixed(1);
  service.updateProfile({ engagementInches: profileState.engagementInches });
}

function setCableLengthFromTelemetry() {
  const left = latestTelemetry.leftTravelInches || 0;
  const right = latestTelemetry.rightTravelInches || 0;
  const average = clamp((left + right) / 2, 0, MAX_TRAVEL_INCHES);
  const quantized = Math.round(average * 2) / 2;
  elements.engageSlider.value = String(quantized);
  updateEngageDisplay();
  elements.message.textContent = `Engagement distance set to ${quantized.toFixed(1)} in based on cable position.`;
}

function renderExercisePreview() {
  const selection = elements.exerciseSelect.value;
  const label = exerciseCatalog[selection] || 'Custom';
  elements.exerciseTitle.textContent = label;
  elements.exerciseImagePlaceholder.textContent = `${label} image placeholder`;
  elements.exerciseVideoPlaceholder.textContent = `${label} video placeholder`;
}

function handleForceCurveChange() {
  profileState.forceMode = elements.forceSelect.value;
  service.updateProfile({ forceMode: profileState.forceMode });
  updateForceCurveDescriptions();
  updateForceCurveLabel();
  redrawForceCurves();
}

function handleIntensityChange(event) {
  const value = Number(event.target.value) || 0;
  intensityPercent = clamp(value, 0, 100);
  profileState.forceIntensity = intensityPercent / 100;
  service.updateProfile({ forceIntensity: profileState.forceIntensity });
  updateForceCurveDescriptions();
  updateForceCurveLabel();
  redrawForceCurves();
}

function handleEccentricToggle() {
  eccentricEnabled = !eccentricEnabled;
  elements.eccentricToggle.textContent = eccentricEnabled ? 'Disable eccentric profile' : 'Enable eccentric profile';
  elements.eccentricToggle.setAttribute('aria-expanded', eccentricEnabled ? 'true' : 'false');
  if (elements.eccentricPanel) {
    if (eccentricEnabled) {
      elements.eccentricPanel.removeAttribute('hidden');
    } else {
      elements.eccentricPanel.hidden = true;
    }
  }
  const eccentricMode = eccentricEnabled ? elements.eccentricSelect.value : profileState.forceMode;
  profileState.eccentricMode = eccentricMode;
  service.updateProfile({ eccentricMode });
  updateForceCurveDescriptions();
  redrawForceCurves();
}

function handleEccentricSelect() {
  if (!eccentricEnabled) return;
  profileState.eccentricMode = elements.eccentricSelect.value;
  service.updateProfile({ eccentricMode: profileState.eccentricMode });
  updateForceCurveDescriptions();
  redrawForceCurves();
}

function setupEventListeners() {
  elements.startToggle.addEventListener('click', toggleWorkout);
  elements.setToggle.addEventListener('click', toggleSet);
  elements.reset.addEventListener('click', resetWorkout);
  elements.powerToggle.addEventListener('click', togglePower);
  elements.motorToggle.addEventListener('click', toggleMotors);
  elements.forceSelect.addEventListener('change', handleForceCurveChange);
  elements.forceCurveIntensity.addEventListener('input', handleIntensityChange);
  elements.eccentricToggle.addEventListener('click', handleEccentricToggle);
  elements.eccentricSelect.addEventListener('change', handleEccentricSelect);
  elements.engageSlider.addEventListener('input', updateEngageDisplay);
  elements.setCableButton.addEventListener('click', setCableLengthFromTelemetry);
  elements.exerciseSelect.addEventListener('change', renderExercisePreview);

  motors.forEach((motor, index) => {
    motor.slider.addEventListener('input', (event) => {
      const value = Number(event.target.value) || 0;
      motor.baseResistance = clamp(value, 0, MAX_RESISTANCE);
      motor.baseLabel.textContent = `${Math.round(motor.baseResistance)} lb`;
      const payload = index === 0
        ? { leftBaseResistance: motor.baseResistance }
        : { rightBaseResistance: motor.baseResistance };
      service.updateSetpoint(payload);
    });

    motor.simSlider.addEventListener('input', (event) => {
      const value = Number(event.target.value) || 0;
      const payload = index === 0
        ? { leftTravelInches: clamp(value, 0, MAX_TRAVEL_INCHES) }
        : { rightTravelInches: clamp(value, 0, MAX_TRAVEL_INCHES) };
      service.updateSetpoint(payload);
    });
  });
}

function initialize() {
  updateEngageDisplay();
  renderExercisePreview();
  updateForceCurveDescriptions();
  updateForceCurveLabel();
  redrawForceCurves();
  applyPowerState();
  syncMotorCanvases();
  syncForceCanvases();
  setupEventListeners();
  updateStatuses();
  updateWorkoutStateLabel();
  requestAnimationFrame(update);
}

initialize();

window.addEventListener('resize', () => {
  syncMotorCanvases();
  syncForceCanvases();
});
