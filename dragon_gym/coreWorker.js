importScripts('core_messages.js');

const {
  SessionCommand,
  FaultSeverity,
  encodeTelemetry,
  encodeFault,
  decodeSessionControl,
  decodeProfile,
  decodeSetpoint,
} = self.CoreMessageCodec;

const MAX_RESISTANCE = 300;
const MAX_TRAVEL_INCHES = 24;
const ENGAGEMENT_RAMP_INCHES = 1;
const REP_SPAN_THRESHOLD = 3;
const MOVEMENT_EPSILON = 0.05;

const state = {
  powerOn: true,
  motorsEnabled: true,
  workoutActive: false,
  profile: {
    targetReps: 12,
    targetSets: 3,
    engagementInches: 1.5,
    forceMode: 'linear',
    eccentricMode: 'eccentric',
    forceIntensity: 0.2,
  },
  setActive: false,
  totalReps: 0,
  currentSetIndex: 0,
  activeSetIndex: 0,
  completedSetIndex: 0,
  setCompletionFlag: false,
  motors: [createMotorState('left'), createMotorState('right')],
};

let lastTimestamp = performance.now();
let faultPending = null;

function createMotorState(id) {
  return {
    id,
    baseResistance: 120,
    travelInches: 0,
    normalized: 0,
    lastNormalized: 0,
    lastTravel: 0,
    direction: 0,
    engaged: false,
    reps: 0,
    lastPeak: 0,
    lastTrough: 0,
    repCounted: false,
    currentResistance: 0,
    phase: 'idle',
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resetMotorTracking(motor) {
  motor.lastTravel = motor.travelInches;
  motor.lastNormalized = motor.normalized;
  motor.direction = 0;
  motor.engaged = false;
  motor.lastPeak = motor.travelInches;
  motor.lastTrough = motor.travelInches;
  motor.repCounted = false;
  motor.phase = 'idle';
}

function calculateEngagementProgress(travel, engageDistance) {
  const start = clamp(engageDistance, 0, MAX_TRAVEL_INCHES);
  const rampEnd = clamp(start + ENGAGEMENT_RAMP_INCHES, 0, MAX_TRAVEL_INCHES);
  if (travel <= start) return 0;
  if (travel >= rampEnd) return 1;
  const span = Math.max(0.0001, rampEnd - start);
  return clamp((travel - start) / span, 0, 1);
}

function getForceCurveMultiplier(mode, normalized, direction) {
  const clamped = clamp(normalized, 0, 1);
  const descending = direction < 0;
  const intensity = clamp(state.profile.forceIntensity, 0, 1);
  switch (mode) {
    case 'eccentric':
      return descending ? 1 + intensity : 1;
    case 'chain':
      return 1 + clamped * intensity;
    case 'band':
      return 1 + Math.pow(clamped, 2.2) * intensity;
    case 'reverse-chain':
      return 1 + intensity - clamped * intensity;
    case 'linear':
    default:
      return 1;
  }
}

function computeForceMultiplier(motor) {
  const direction = motor.direction < 0 ? -1 : 1;
  let mode = state.profile.forceMode || 'linear';
  if (direction < 0 && state.profile.eccentricMode) {
    mode = state.profile.eccentricMode;
  }
  return getForceCurveMultiplier(mode, motor.normalized, direction);
}

function applySessionControl(message) {
  switch (message.command) {
    case SessionCommand.SESSION_COMMAND_POWER:
      state.powerOn = !!message.active;
      if (!state.powerOn) {
        state.workoutActive = false;
        stopSet(false);
        state.currentSetIndex = 0;
        state.completedSetIndex = 0;
        state.activeSetIndex = 0;
        state.totalReps = 0;
        state.motors.forEach((motor) => {
          motor.reps = 0;
          resetMotorTracking(motor);
        });
      }
      break;
    case SessionCommand.SESSION_COMMAND_WORKOUT:
      state.workoutActive = !!message.active;
      if (!state.workoutActive) {
        stopSet(false);
        state.currentSetIndex = 0;
        state.completedSetIndex = 0;
        state.activeSetIndex = 0;
        state.totalReps = 0;
        state.motors.forEach((motor) => {
          motor.reps = 0;
          resetMotorTracking(motor);
        });
      }
      break;
    case SessionCommand.SESSION_COMMAND_MOTORS:
      state.motorsEnabled = !!message.active;
      if (!state.motorsEnabled) {
        stopSet(false);
      }
      break;
    default:
      break;
  }
}

function applyProfile(profile) {
  if (typeof profile.targetReps === 'number' && !Number.isNaN(profile.targetReps)) {
    state.profile.targetReps = clamp(profile.targetReps, 1, 200);
  }
  if (typeof profile.targetSets === 'number' && !Number.isNaN(profile.targetSets)) {
    state.profile.targetSets = clamp(profile.targetSets, 1, 50);
  }
  if (typeof profile.engagementInches === 'number') {
    state.profile.engagementInches = clamp(profile.engagementInches, 0, MAX_TRAVEL_INCHES);
  }
  if (typeof profile.forceMode === 'string') {
    state.profile.forceMode = profile.forceMode;
  }
  if (typeof profile.eccentricMode === 'string') {
    state.profile.eccentricMode = profile.eccentricMode;
  }
  if (typeof profile.forceIntensity === 'number' && !Number.isNaN(profile.forceIntensity)) {
    state.profile.forceIntensity = clamp(profile.forceIntensity, 0, 1);
  }
}

function applySetpoint(setpoint) {
  const [left, right] = state.motors;
  if (typeof setpoint.leftBaseResistance === 'number') {
    left.baseResistance = clamp(setpoint.leftBaseResistance, 0, MAX_RESISTANCE);
  }
  if (typeof setpoint.rightBaseResistance === 'number') {
    right.baseResistance = clamp(setpoint.rightBaseResistance, 0, MAX_RESISTANCE);
  }
  if (typeof setpoint.leftTravelInches === 'number') {
    left.travelInches = clamp(setpoint.leftTravelInches, 0, MAX_TRAVEL_INCHES);
  }
  if (typeof setpoint.rightTravelInches === 'number') {
    right.travelInches = clamp(setpoint.rightTravelInches, 0, MAX_TRAVEL_INCHES);
  }
  if (typeof setpoint.motorsEnabled === 'boolean') {
    state.motorsEnabled = setpoint.motorsEnabled;
    if (!state.motorsEnabled) {
      stopSet(false);
    }
  }
  if (typeof setpoint.powerOn === 'boolean') {
    state.powerOn = setpoint.powerOn;
    if (!state.powerOn) {
      state.workoutActive = false;
      stopSet(false);
    }
  }
  if (typeof setpoint.setActive === 'boolean') {
    if (setpoint.setActive && !state.setActive) {
      startSet();
    } else if (!setpoint.setActive && state.setActive) {
      stopSet(true);
    }
  }
}

function startSet() {
  if (!state.workoutActive || !state.powerOn || !state.motorsEnabled) {
    faultPending = {
      severity: FaultSeverity.FAULT_SEVERITY_WARNING,
      code: 'set_denied',
      description: 'Cannot start set while system is offline.',
    };
    return;
  }
  state.setActive = true;
  state.totalReps = 0;
  state.currentSetIndex += 1;
  state.activeSetIndex = state.currentSetIndex;
  state.setCompletionFlag = false;
  state.motors.forEach((motor) => {
    motor.reps = 0;
    motor.lastTravel = motor.travelInches;
    motor.lastNormalized = motor.normalized;
    motor.engaged = false;
    motor.repCounted = false;
    motor.lastPeak = motor.travelInches;
    motor.lastTrough = motor.travelInches;
  });
}

function stopSet(emitCompletion) {
  if (!state.setActive && !emitCompletion) {
    return;
  }
  state.setActive = false;
  if (state.activeSetIndex !== 0) {
    state.completedSetIndex = state.activeSetIndex;
    state.activeSetIndex = 0;
    state.setCompletionFlag = !!emitCompletion;
  }
  state.motors.forEach((motor) => {
    motor.engaged = false;
    resetMotorTracking(motor);
  });
}

function markSetComplete() {
  if (!state.setActive) return;
  state.setActive = false;
  state.completedSetIndex = state.activeSetIndex;
  state.activeSetIndex = 0;
  state.setCompletionFlag = true;
  state.motors.forEach((motor) => {
    motor.engaged = false;
    resetMotorTracking(motor);
  });
}

function updateMotor(motor, deltaSeconds) {
  motor.lastNormalized = motor.normalized;
  motor.normalized = motor.travelInches / MAX_TRAVEL_INCHES;
  const deltaNormalized = motor.normalized - motor.lastNormalized;
  const derivative = deltaSeconds > 0 ? deltaNormalized / deltaSeconds : 0;
  if (Math.abs(derivative) > 0.0001) {
    motor.direction = derivative >= 0 ? 1 : -1;
  }

  const rampProgress = calculateEngagementProgress(motor.travelInches, state.profile.engagementInches);
  if (!state.powerOn || !state.motorsEnabled || !state.workoutActive) {
    motor.currentResistance = 0;
  } else if (rampProgress <= 0) {
    motor.currentResistance = 0;
  } else {
    const multiplier = computeForceMultiplier(motor);
    const applied = motor.baseResistance * rampProgress * multiplier;
    motor.currentResistance = clamp(applied, 0, MAX_RESISTANCE);
  }

  if (!state.setActive || !state.powerOn || !state.motorsEnabled || !state.workoutActive) {
    resetMotorTracking(motor);
    if (!state.setActive) {
      motor.reps = 0;
    }
    return;
  }

  const engageThreshold = state.profile.engagementInches / MAX_TRAVEL_INCHES;
  if (!motor.engaged && motor.normalized >= engageThreshold) {
    motor.engaged = true;
    motor.lastPeak = motor.travelInches;
    motor.lastTrough = motor.travelInches;
    motor.repCounted = false;
  }

  if (!motor.engaged) {
    resetMotorTracking(motor);
    return;
  }

  const deltaTravel = motor.travelInches - motor.lastTravel;
  motor.lastTravel = motor.travelInches;
  if (Math.abs(deltaTravel) > MOVEMENT_EPSILON) {
    motor.direction = deltaTravel >= 0 ? 1 : -1;
  }

  if (motor.direction >= 0) {
    if (motor.phase !== 'ascending') {
      motor.phase = 'ascending';
      motor.lastPeak = motor.travelInches;
      motor.lastTrough = motor.travelInches;
      motor.repCounted = false;
    } else {
      motor.lastPeak = Math.max(motor.lastPeak, motor.travelInches);
    }
  } else {
    if (motor.phase !== 'descending') {
      motor.phase = 'descending';
      motor.lastTrough = motor.travelInches;
    } else {
      motor.lastTrough = Math.min(motor.lastTrough, motor.travelInches);
    }
    const span = motor.lastPeak - motor.lastTrough;
    if (!motor.repCounted && span >= REP_SPAN_THRESHOLD) {
      motor.reps += 1;
      motor.repCounted = true;
    }
  }
}

function buildTelemetry(timestamp) {
  const telemetry = {
    timestampMs: timestamp,
    leftResistance: state.motors[0].currentResistance,
    rightResistance: state.motors[1].currentResistance,
    leftTravelInches: state.motors[0].travelInches,
    rightTravelInches: state.motors[1].travelInches,
    leftNormalized: state.motors[0].normalized,
    rightNormalized: state.motors[1].normalized,
    leftReps: state.motors[0].reps >>> 0,
    rightReps: state.motors[1].reps >>> 0,
    totalReps: state.totalReps >>> 0,
    engagementInches: state.profile.engagementInches,
    forceMode: state.profile.forceMode,
    eccentricMode: state.profile.eccentricMode,
    forceIntensity: state.profile.forceIntensity,
    setActive: state.setActive,
    workoutActive: state.workoutActive,
    motorsEnabled: state.motorsEnabled,
    powerOn: state.powerOn,
    setComplete: state.setCompletionFlag,
    setSequence: state.setActive ? state.activeSetIndex : state.completedSetIndex,
  };
  state.setCompletionFlag = false;
  return telemetry;
}

function emitTelemetry(telemetry) {
  const payload = encodeTelemetry(telemetry);
  self.postMessage({ type: 'Telemetry', payload }, [payload]);
}

function emitFault(fault) {
  const payload = encodeFault(fault);
  self.postMessage({ type: 'Fault', payload }, [payload]);
}

function tick() {
  const now = performance.now();
  const deltaSeconds = (now - lastTimestamp) / 1000;
  lastTimestamp = now;

  if (!state.powerOn) {
    state.motors.forEach((motor) => {
      motor.currentResistance = 0;
      motor.travelInches = 0;
      motor.normalized = 0;
      motor.reps = 0;
      resetMotorTracking(motor);
    });
    state.totalReps = 0;
  } else {
    state.motors.forEach((motor) => updateMotor(motor, deltaSeconds));
    state.totalReps = Math.max(state.motors[0].reps, state.motors[1].reps);
    if (state.setActive && state.totalReps >= state.profile.targetReps) {
      markSetComplete();
    }
  }

  const telemetry = buildTelemetry(now);
  emitTelemetry(telemetry);

  if (faultPending) {
    emitFault(faultPending);
    faultPending = null;
  }

  setTimeout(tick, 16);
}

tick();

self.onmessage = (event) => {
  const { data } = event;
  if (!data || !data.type || !data.payload) {
    return;
  }
  try {
    switch (data.type) {
      case 'SessionControl': {
        const message = decodeSessionControl(data.payload);
        applySessionControl(message);
        break;
      }
      case 'Profile': {
        const profile = decodeProfile(data.payload);
        applyProfile(profile);
        break;
      }
      case 'Setpoint': {
        const setpoint = decodeSetpoint(data.payload);
        applySetpoint(setpoint);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    faultPending = {
      severity: FaultSeverity.FAULT_SEVERITY_CRITICAL,
      code: 'worker_error',
      description: error instanceof Error ? error.message : 'Unknown worker error',
    };
  }
};
