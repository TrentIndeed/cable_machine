import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sendCommand } from './api/sendCommand';
import { useTelemetry } from './hooks/useTelemetry';
import './App.css';

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
const INITIAL_BASE_RESISTANCE = 120;
const WEIGHT_ENGAGE_OFFSET = 1;
const COMMAND_TYPES = {
  ENABLE: 'Enable',
  DISABLE: 'Disable',
  STOP: 'Stop',
  SET_RESISTANCE: 'SetResistance',
};
const AXIS_OPTIONS = [
  { value: 1, label: 'Left' },
  { value: 2, label: 'Right' },
  { value: 3, label: 'Both' },
];

function pickTelemetryNumber(source, keys) {
  if (!source) {
    return null;
  }
  for (const key of keys) {
    const value = source[key];
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function formatTelemetryValue(value) {
  if (!Number.isFinite(value)) {
    return '--';
  }
  return value.toFixed(2);
}

function App() {
  const [forceCurveMode, setForceCurveMode] = useState('linear');
  const [forceCurveIntensity, setForceCurveIntensityState] = useState(20);
  const [eccentricMode, setEccentricMode] = useState('eccentric');
  const [eccentricEnabled, setEccentricEnabled] = useState(false);
  const [forceCurveOpen, setForceCurveOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [videoSrc, setVideoSrc] = useState('/assets/dragon_incline_bench.mp4');
  const { telemetry, status: telemetryStatus } = useTelemetry();
  const [axisMask, setAxisMask] = useState(3);
  const [commandResistance, setCommandResistance] = useState(120);
  const [commandStatus, setCommandStatus] = useState('idle');
  const [commandMessage, setCommandMessage] = useState('');

  const forceCurveModeRef = useRef(forceCurveMode);
  const forceCurveIntensityRef = useRef(forceCurveIntensity);
  const eccentricModeRef = useRef(eccentricMode);
  const eccentricEnabledRef = useRef(eccentricEnabled);
  const waveScaleMaxRef = useRef(10);
  const waveScaleMinRef = useRef(0);
  const waveScaleSamplesRef = useRef([]);

  const workoutStateRef = useRef(null);
  const startToggleRef = useRef(null);
  const setToggleRef = useRef(null);
  const resetRef = useRef(null);
  const setStatusRef = useRef(null);
  const repStatusRef = useRef(null);
  const waveRepRef = useRef(null);
  const waveRepBounceTimeoutRef = useRef(null);
  const leftStatusRepsRef = useRef(null);
  const rightStatusRepsRef = useRef(null);
  const messageRef = useRef(null);
  const forceSelectRef = useRef(null);
  const forceDescriptionRef = useRef(null);
  const forceLabelRef = useRef(null);
  const forceCurveConcentricRef = useRef(null);
  const forceCurveEccentricRef = useRef(null);
  const eccentricToggleRef = useRef(null);
  const eccentricPanelRef = useRef(null);
  const eccentricSelectRef = useRef(null);
  const forceCurveIntensityRefElement = useRef(null);
  const forcePanelRef = useRef(null);
  const forceLockHintRef = useRef(null);
  const powerToggleRef = useRef(null);
  const motorToggleRef = useRef(null);
  const logListRef = useRef(null);
  const exerciseSelectRef = useRef(null);
  const exerciseTitleRef = useRef(null);

  const leftGaugeRef = useRef(null);
  const leftSimRef = useRef(null);
  const leftCurrentResistanceRef = useRef(null);
  const leftBaseResistanceRef = useRef(null);
  const leftRepCountRef = useRef(null);
  const leftCableDistanceRef = useRef(null);
  const leftEngageDisplayRef = useRef(null);
  const leftSetCableLengthRef = useRef(null);
  const leftRetractCableRef = useRef(null);

  const rightGaugeRef = useRef(null);
  const waveCombinedRef = useRef(null);
  const rightSimRef = useRef(null);
  const rightCurrentResistanceRef = useRef(null);
  const rightBaseResistanceRef = useRef(null);
  const rightRepCountRef = useRef(null);
  const rightCableDistanceRef = useRef(null);
  const rightEngageDisplayRef = useRef(null);
  const rightSetCableLengthRef = useRef(null);
  const rightRetractCableRef = useRef(null);

  const eccentricDescriptionRef = useRef(null);
  const animationFrameRef = useRef(null);

  const exerciseCatalog = useMemo(
    () => ({
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
    }),
    []
  );

  const exerciseVideos = useMemo(
    () => [
      '/assets/cable_broll.mp4',
      '/assets/design_broll.mp4',
      '/assets/dragon_chilling.mp4',
      '/assets/dragon_incline_bench.mp4',
      '/assets/dragon_loading_screen.mp4',
      '/assets/dragon_pullups.mp4',
      '/assets/spool_broll.mp4',
    ],
    []
  );

  const telemetryConnected =
    typeof telemetry?.Connected === 'boolean'
      ? telemetry.Connected
      : telemetryStatus === 'connected';
  const telemetryFault = Boolean(telemetry?.Fault);
  const resistanceLabel = Number.isFinite(commandResistance)
    ? Math.round(commandResistance)
    : 0;

  const leftPos = pickTelemetryNumber(telemetry, ['LeftPos', 'LeftPosition']);
  const rightPos = pickTelemetryNumber(telemetry, ['RightPos', 'RightPosition']);
  const leftVel = pickTelemetryNumber(telemetry, ['LeftVel', 'LeftVelocity']);
  const rightVel = pickTelemetryNumber(telemetry, ['RightVel', 'RightVelocity']);
  const leftForce = pickTelemetryNumber(telemetry, ['LeftForce', 'LeftTorque', 'LeftLoad']);
  const rightForce = pickTelemetryNumber(telemetry, ['RightForce', 'RightTorque', 'RightLoad']);

  const handleAxisChange = (event) => {
    setAxisMask(Number(event.target.value));
  };

  const handleResistanceChange = (event) => {
    setCommandResistance(Number(event.target.value));
  };

  const handleCommand = async (type, overrides = {}) => {
    setCommandStatus('sending');
    setCommandMessage('');
    try {
      const response = await sendCommand({
        type,
        axisMask,
        ...overrides,
      });
      const ackMessage = response?.ack?.timedOut
        ? 'Ack timed out'
        : response?.seq !== undefined
          ? `Seq ${response.seq}`
          : 'Command sent';
      setCommandStatus('sent');
      setCommandMessage(ackMessage);
    } catch (error) {
      setCommandStatus('error');
      setCommandMessage(error.message || 'Command failed');
    }
  };

  useEffect(() => {
    forceCurveModeRef.current = forceCurveMode;
  }, [forceCurveMode]);

  useEffect(() => {
    forceCurveIntensityRef.current = forceCurveIntensity;
  }, [forceCurveIntensity]);

  useEffect(() => {
    eccentricModeRef.current = eccentricMode;
  }, [eccentricMode]);

  useEffect(() => {
    eccentricEnabledRef.current = eccentricEnabled;
  }, [eccentricEnabled]);

  useEffect(() => {
    const elements = {
      workoutState: workoutStateRef.current,
      startToggle: startToggleRef.current,
      setToggle: setToggleRef.current,
      reset: resetRef.current,
      setStatus: setStatusRef.current,
      repStatus: repStatusRef.current,
      waveRep: waveRepRef.current,
      leftStatusReps: leftStatusRepsRef.current,
      rightStatusReps: rightStatusRepsRef.current,
      message: messageRef.current,
      forceSelect: forceSelectRef.current,
      forceDescription: forceDescriptionRef.current,
      forceLabel: forceLabelRef.current,
      forceCurveConcentric: forceCurveConcentricRef.current,
      forceCurveEccentric: forceCurveEccentricRef.current,
      eccentricToggle: eccentricToggleRef.current,
      eccentricPanel: eccentricPanelRef.current,
      eccentricSelect: eccentricSelectRef.current,
      forceCurveIntensity: forceCurveIntensityRefElement.current,
      forcePanel: forcePanelRef.current,
      forceLockHint: forceLockHintRef.current,
      powerToggle: powerToggleRef.current,
      motorToggle: motorToggleRef.current,
      logList: logListRef.current,
      exerciseSelect: exerciseSelectRef.current,
      exerciseTitle: exerciseTitleRef.current,
      eccentricDescription: eccentricDescriptionRef.current,
    };

    if (!elements.startToggle || !elements.forceSelect) {
      return undefined;
    }

    function setStatusMessage(message, options = {}) {
      if (!elements.message) return;
      const { tone = 'info' } = options;
      elements.message.textContent = message;
      if (tone === 'error') {
        elements.message.classList.add('is-error');
      } else {
        elements.message.classList.remove('is-error');
      }
    }

    function motorBeyondEngagement(motor) {
      if (!motor) {
        return false;
      }
      const travel = motor.normalized * MAX_TRAVEL_INCHES;
      return travel > motor.engagementDistance + MOVEMENT_EPSILON;
    }

    let forceProfileLockHintVisible = false;

    function updateForceProfileLockState() {
      const locked = motors.some((motor) => motorBeyondEngagement(motor));

      if (elements.forcePanel) {
        elements.forcePanel.classList.toggle('is-locked', locked);
      }

      if (elements.forceLockHint) {
        if (!locked) {
          forceProfileLockHintVisible = false;
        }
        elements.forceLockHint.hidden = !(locked && forceProfileLockHintVisible);
      }

      const controls = [
        elements.forceSelect,
        elements.forceCurveIntensity,
        elements.eccentricToggle,
        elements.eccentricSelect,
      ];
      controls.forEach((control) => {
        if (!control) return;
        if (locked) {
          control.setAttribute('aria-disabled', 'true');
        } else {
          control.removeAttribute('aria-disabled');
        }
      });

      return locked;
    }

    function notifyForceProfileLock() {
      forceProfileLockHintVisible = true;
      updateForceProfileLockState();
    }

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
    function createMotor(id, refs, initialResistance) {
      const gaugeCanvas = refs.gaugeCanvas;
      const gaugeCtx = gaugeCanvas ? gaugeCanvas.getContext('2d') : null;

      const simSlider = refs.simSlider;
      const currentLabel = refs.currentLabel;
      const baseLabel = refs.baseLabel;
      const repsLabel = refs.repsLabel;
      const cableLabel = refs.cableLabel;
      const engageDisplay = refs.engageDisplay;
      const setCableButton = refs.setCableButton;
      const retractCableButton = refs.retractCableButton;

      const initialTravel = Number(simSlider.value);
      const normalized = Math.max(0, Math.min(1, initialTravel / MAX_TRAVEL_INCHES));
      const travelInches = normalized * MAX_TRAVEL_INCHES;

      return {
        id,
        gaugeCanvas,
        gaugeCtx,
        simSlider,
        currentLabel,
        baseLabel,
        repsLabel,
        cableLabel,
        engageDisplay,
        setCableButton,
        retractCableButton,
        baseResistance: initialResistance,
        currentResistance: 0,
        reps: 0,
        engaged: false,
        engagementDistance: Math.max(DEFAULT_RETRACTION_BOTTOM, travelInches),
        setArmed: false,
        retractionActive: false,
        retractionTarget: DEFAULT_RETRACTION_BOTTOM,
        retractionSpeed: RETRACTION_SPEED_IPS,
        normalized,
        direction: 1,
        trail: new Array(TRAIL_LENGTH).fill(travelInches),
        lastTravel: travelInches,
        phase: 'idle',
        lastPeak: travelInches,
        lastTrough: travelInches,
        repCounted: false,
        resistanceSuspended: false,
        armedTravelStart: null,
        forceDirection: 1,
        lastForceTravel: travelInches,
      };
    }

    const motors = [
      createMotor('left', {
        gaugeCanvas: leftGaugeRef.current,
        simSlider: leftSimRef.current,
        currentLabel: leftCurrentResistanceRef.current,
        baseLabel: leftBaseResistanceRef.current,
        repsLabel: leftRepCountRef.current,
        cableLabel: leftCableDistanceRef.current,
        engageDisplay: leftEngageDisplayRef.current,
        setCableButton: leftSetCableLengthRef.current,
        retractCableButton: leftRetractCableRef.current,
      }, INITIAL_BASE_RESISTANCE),
      createMotor('right', {
        gaugeCanvas: rightGaugeRef.current,
        simSlider: rightSimRef.current,
        currentLabel: rightCurrentResistanceRef.current,
        baseLabel: rightBaseResistanceRef.current,
        repsLabel: rightRepCountRef.current,
        cableLabel: rightCableDistanceRef.current,
        engageDisplay: rightEngageDisplayRef.current,
        setCableButton: rightSetCableLengthRef.current,
        retractCableButton: rightRetractCableRef.current,
      }, INITIAL_BASE_RESISTANCE),
    ];

    const updateWaveScale = () => {
      const avgPeak =
        motors.reduce((sum, motor) => sum + (motor.lastPeak || 0), 0) /
        (motors.length || 1);
      const now = Date.now();
      const windowMs = 3000;
      const samples = waveScaleSamplesRef.current;
      samples.push({ time: now, value: avgPeak });
      waveScaleSamplesRef.current = samples.filter(
        (sample) => now - sample.time <= windowMs
      );

      const values = waveScaleSamplesRef.current.map((sample) => sample.value);
      const minValue = values.length ? Math.min(...values) : 0;
      const maxValue = values.length ? Math.max(...values) : 10;
      const rangeSpan = maxValue - minValue;
      const targetSpan = rangeSpan > 0 ? rangeSpan / 0.8 : 10;
      const scaleSpan = Math.max(10, targetSpan);
      const center = (maxValue + minValue) / 2;
      const scaleMin = Math.max(0, center - scaleSpan / 2);
      const scaleMax = scaleMin + scaleSpan;

      waveScaleMinRef.current = scaleMin;
      waveScaleMaxRef.current = scaleMax;
    };

    let workoutActive = false;
    let setActive = false;
    let currentSet = 0;
    let currentRep = 0;
    let totalReps = DEFAULT_REP_TARGET;
    let lastTimestamp = performance.now();
    let powerOn = true;
    let motorsRunning = true;
    let eccentricOverrideEnabled = eccentricEnabledRef.current;
    let forceCurveIntensityValue = forceCurveIntensityRef.current;
    const workoutLog = [];

    let lastForceCurveMode = elements.forceSelect
      ? elements.forceSelect.value
      : 'linear';
    let lastEccentricMode = elements.eccentricSelect
      ? elements.eccentricSelect.value
      : 'eccentric';

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
      const resized = resizeCanvasToDisplaySize(waveCombinedRef.current);
      if (resized) {
        drawWaveCombined();
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
      motor.lastForceTravel = travel;
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

    function toggleButtonPulse(button, active) {
      if (!button) return;
      const shouldPulse = Boolean(active);
      button.classList.toggle('is-pulsing', shouldPulse);
      if (shouldPulse) {
        button.setAttribute('aria-busy', 'true');
      } else {
        button.removeAttribute('aria-busy');
      }
    }

    function setMotorResistanceSuspended(motor, suspended) {
      if (!motor) return;
      motor.resistanceSuspended = Boolean(suspended);
      if (motor.resistanceSuspended) {
        motor.currentResistance = 0;
        drawGauge(motor);
      } else {
        refreshMotorResistance(motor);
      }
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
      if (motor.engageDisplay) {
        motor.engageDisplay.textContent = formatted;
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
      setStatusMessage(message);
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

      updateForceProfileLockState();

      return quantized;
    }

    function disarmMotorCableSet(motor, options = {}) {
      if (!motor || !motor.setArmed) return;
      const { silent = false } = options;
      motor.setArmed = false;
      motor.armedTravelStart = null;
      setMotorResistanceSuspended(motor, false);
      toggleButtonPulse(motor.setCableButton, false);
      if (!silent) {
        const label = formatMotorLabel(motor.id);
        setStatusMessage(`${label} cable length arming canceled.`);
      }
    }

    function toggleMotorCableSet(motor) {
      if (!motor || !powerOn) return;
      if (motor.setArmed) {
        disarmMotorCableSet(motor);
        return;
      }
      const label = formatMotorLabel(motor.id);
      if (motor.retractionActive) {
        setStatusMessage(
          `${label} cable is retracting. Wait for it to reach ${DEFAULT_RETRACTION_BOTTOM.toFixed(
            1
          )} in before arming.`,
          { tone: 'error' }
        );
        return;
      }
      const current = Number(motor.simSlider.value || 0);
      const tolerance = SIM_SLIDER_STEP / 2;
      if (current > DEFAULT_RETRACTION_BOTTOM + tolerance) {
        setStatusMessage(
          `${label} cable must be fully retracted to ${DEFAULT_RETRACTION_BOTTOM.toFixed(
            1
          )} in before setting length.`,
          { tone: 'error' }
        );
        return;
      }

      motor.setArmed = true;
      motor.armedTravelStart = current;
      setMotorResistanceSuspended(motor, true);
      toggleButtonPulse(motor.setCableButton, true);
      setStatusMessage(
        `${label} cable length armed. Adjust the motor travel slider and release after at least 1.0 in of travel to lock it.`,
        { tone: 'info' }
      );
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
        const label = formatMotorLabel(motor.id);
        setStatusMessage(
          `${label} control reports cable already at the retraction stop.`,
          { tone: 'info' }
        );
        return false;
      }

      motor.retractionActive = true;
      motor.retractionTarget = DEFAULT_RETRACTION_BOTTOM;
      motor.retractionSpeed = RETRACTION_SPEED_IPS;
      markRetractActive(motor, true);

      const label = formatMotorLabel(motor.id);
      setStatusMessage(
        `${label} cable retracting to ${motor.retractionTarget.toFixed(1)} in at ${RETRACTION_SPEED_MPH.toFixed(
          1
        )} mph.`,
        { tone: 'info' }
      );

      return true;
    }
    function resolveMotorResistance(motor, engageDistance, mode) {
      if (!powerOn || !motorsRunning || motor.resistanceSuspended) {
        return 0;
      }

      const travel = motor.normalized * MAX_TRAVEL_INCHES;
      const rampProgress = calculateEngagementProgress(travel, engageDistance);
      if (rampProgress <= 0) {
        return 0;
      }

      const direction = motor.forceDirection || motor.direction || 1;
      const multiplier = computeForceMultiplier(mode, motor.normalized, direction);
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

    function setMotorBaseResistance(motor, value) {
      if (!motor) return;
      const clamped = Math.max(0, Math.min(MAX_RESISTANCE, value));
      motor.baseResistance = clamped;
      if (motor.baseLabel) {
        motor.baseLabel.textContent = `${Math.round(clamped)} lb`;
      }
      refreshMotorResistance(motor);
    }

    function updateResistanceFromGauge(motor, clientX, clientY) {
      if (!motor || !motor.gaugeCanvas || !powerOn) return;
      const rect = motor.gaugeCanvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const angle = Math.atan2(dy, dx);
      const normalized = (angle + Math.PI / 2 + TWO_PI) % TWO_PI;
      const value = (normalized / TWO_PI) * MAX_RESISTANCE;
      setMotorBaseResistance(motor, value);
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
      if (elements.reset) {
        elements.reset.disabled = !workoutActive;
      }

      if (!workoutActive) {
        stopSet();
        currentSet = 0;
        currentRep = 0;
        totalReps = DEFAULT_REP_TARGET;
        if (elements.workoutState) {
          elements.workoutState.classList.remove('active');
          elements.workoutState.textContent = 'Workout Not Started';
        }
        setStatusMessage('Tap Start Workout to arm the set controls.');
        eccentricOverrideEnabled = false;
        eccentricEnabledRef.current = false;
        setEccentricEnabled(false);
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
        setStatusMessage('Press Start Set to begin counting reps.');
        updateStatuses();
        requestAnimationFrame(() => {
          syncForceCurveCanvasSizes();
          redrawForceCurves();
        });
      }

      updateForceCurveDescriptions();
      updateForceCurveLabel();
    }

    const handleWorkoutToggle = () => {
      toggleWorkout();
    };

    elements.startToggle.addEventListener('click', handleWorkoutToggle);

    const handleForceSelectChange = (event) => {
      if (updateForceProfileLockState()) {
        event.target.value = lastForceCurveMode;
        notifyForceProfileLock();
        return;
      }

      lastForceCurveMode = elements.forceSelect.value;
      forceCurveModeRef.current = lastForceCurveMode;
      setForceCurveMode(lastForceCurveMode);
      updateForceCurveDescriptions();
      updateForceCurveLabel();
      redrawForceCurves();
      refreshAllMotorResistances();
    };

    elements.forceSelect.addEventListener('change', handleForceSelectChange);

    function setForceCurveIntensity(value) {
      const numeric = Number(value);
      const sanitized = Number.isFinite(numeric)
        ? Math.max(0, Math.min(100, numeric))
        : forceCurveIntensityValue;
      forceCurveIntensityValue = sanitized;
      forceCurveIntensityRef.current = sanitized;
      setForceCurveIntensityState(sanitized);
      if (elements.forceCurveIntensity) {
        elements.forceCurveIntensity.value = String(sanitized);
      }
      updateForceCurveDescriptions();
      updateForceCurveLabel();
      redrawForceCurves();
      refreshAllMotorResistances();
    }

    const handleForceIntensityInput = (event) => {
      if (updateForceProfileLockState()) {
        event.target.value = String(forceCurveIntensityValue);
        notifyForceProfileLock();
        return;
      }
      setForceCurveIntensity(event.target.value);
    };

    if (elements.forceCurveIntensity) {
      setForceCurveIntensity(elements.forceCurveIntensity.value || forceCurveIntensityValue);
      elements.forceCurveIntensity.addEventListener('input', handleForceIntensityInput);
      elements.forceCurveIntensity.addEventListener('change', handleForceIntensityInput);
    }

    const handleEccentricToggle = (event) => {
      if (updateForceProfileLockState()) {
        event.preventDefault();
        notifyForceProfileLock();
        return;
      }

      eccentricOverrideEnabled = !eccentricOverrideEnabled;
      eccentricEnabledRef.current = eccentricOverrideEnabled;
      setEccentricEnabled(eccentricOverrideEnabled);
      if (elements.eccentricToggle) {
        elements.eccentricToggle.textContent = eccentricOverrideEnabled
          ? 'Disable eccentric profile'
          : 'Enable eccentric profile';
        elements.eccentricToggle.setAttribute(
          'aria-expanded',
          eccentricOverrideEnabled ? 'true' : 'false'
        );
      }

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
    };

    if (elements.eccentricToggle) {
      elements.eccentricToggle.addEventListener('click', handleEccentricToggle);
    }

    const handleEccentricSelectChange = (event) => {
      if (updateForceProfileLockState()) {
        event.target.value = lastEccentricMode;
        notifyForceProfileLock();
        return;
      }

      lastEccentricMode = elements.eccentricSelect.value;
      eccentricModeRef.current = lastEccentricMode;
      setEccentricMode(lastEccentricMode);
      updateForceCurveDescriptions();
      updateForceCurveLabel();
      redrawForceCurves();
      refreshAllMotorResistances();
    };

    if (elements.eccentricSelect) {
      elements.eccentricSelect.addEventListener('change', handleEccentricSelectChange);
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
      setStatusMessage(`Set ${currentSet} active. Cable movement will arm the servos.`);
      updateStatuses();
      updateSetToggleAppearance();
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
      setStatusMessage(
        `Set ${currentSet} complete. Press Start Set when you are ready for the next round.`
      );
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

      updateWaveScale();
      drawWaveCombined();
      setStatusMessage(`Set ${currentSet}: rep ${currentRep} complete.`);
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
    function stopSet(partial = true) {
      if (!setActive) return;

      setActive = false;
      updateSetToggleAppearance();
      const recorded = !partial ? false : currentRep > 0;
      if (recorded) {
        recordWorkoutSet(true);
        if (elements.workoutState) {
          elements.workoutState.textContent = partial ? 'Set Logged' : 'Set Complete';
        }
        setStatusMessage(
          partial
            ? `Set ${currentSet} logged with ${currentRep} reps.`
            : `Set ${currentSet} complete. Press Start Set when you are ready for the next round.`
        );
      } else {
        if (elements.workoutState) {
          elements.workoutState.textContent = workoutActive
            ? 'Workout Started'
            : 'Workout Not Started';
        }
        setStatusMessage(
          currentRep >= totalReps
            ? 'Set complete. Press Start Set for the next round.'
            : 'Set paused. Press Start Set to resume.'
        );
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
        setStatusMessage('Power system on to resume control.');
        motorsRunning = false;
        updateMotorToggle();
      } else {
        updateMotorToggle();
        if (elements.workoutState) {
          elements.workoutState.textContent = workoutActive
            ? 'Workout Started'
            : 'Workout Not Started';
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

    const handleSetToggle = () => {
      if (!workoutActive || !powerOn) return;
      if (setActive) {
        stopSet();
      } else {
        startSet();
      }
    };

    if (elements.setToggle) {
      elements.setToggle.addEventListener('click', handleSetToggle);
    }

    const handleReset = () => {
      if (!workoutActive || !powerOn) return;
      if (currentRep > 0) {
        recordWorkoutSet(true);
      }
      currentSet = 0;
      currentRep = 0;
      totalReps = DEFAULT_REP_TARGET;
      motors.forEach((motor) => {
        motor.reps = 0;
        motor.engaged = false;
        const travel = motor.normalized * MAX_TRAVEL_INCHES;
        resetMotorTracking(motor, travel);
      });
      if (elements.workoutState) {
        elements.workoutState.textContent = 'Workout Reset';
        elements.workoutState.classList.remove('active');
      }
      setStatusMessage('Workout reset. Press Start Workout to begin again.');
      updateStatuses();
      setActive = false;
      updateSetToggleAppearance();
      refreshAllMotorResistances();
    };

    if (elements.reset) {
      elements.reset.addEventListener('click', handleReset);
    }

    const handlePowerToggle = () => {
      powerOn = !powerOn;
      motorsRunning = powerOn ? true : false;
      applyPowerState();
    };

    if (elements.powerToggle) {
      elements.powerToggle.addEventListener('click', handlePowerToggle);
    }

    if (elements.motorToggle) {
      elements.motorToggle.addEventListener('click', toggleMotors);
    }

    function pickVideoForSelection(selection) {
      const list = exerciseVideos;
      if (!list.length) return '';
      let hash = 0;
      for (let i = 0; i < selection.length; i += 1) {
        hash = (hash * 31 + selection.charCodeAt(i)) >>> 0;
      }
      return list[hash % list.length];
    }

    function renderExercisePreview() {
      const selection = elements.exerciseSelect.value;
      const label = exerciseCatalog[selection] || 'Custom';
      if (elements.exerciseTitle) {
        elements.exerciseTitle.textContent = label;
      }
      setVideoSrc(pickVideoForSelection(selection));
    }

    const handleExerciseChange = () => {
      renderExercisePreview();
    };

    if (elements.exerciseSelect) {
      elements.exerciseSelect.addEventListener('change', handleExerciseChange);
    }
    renderExercisePreview();

    function updateStatuses() {
      elements.setStatus.textContent = `${currentSet}`;
      elements.repStatus.textContent = `${currentRep} / ${totalReps}`;
      if (elements.waveRep) {
        elements.waveRep.textContent = `${currentRep}`;
        elements.waveRep.classList.remove('is-bouncing');
        if (waveRepBounceTimeoutRef.current) {
          clearTimeout(waveRepBounceTimeoutRef.current);
        }
        elements.waveRep.classList.add('is-bouncing');
        waveRepBounceTimeoutRef.current = setTimeout(() => {
          if (elements.waveRep) {
            elements.waveRep.classList.remove('is-bouncing');
          }
        }, 450);
      }
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
      const intensity = Math.max(0, Math.min(100, forceCurveIntensityValue)) / 100;

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

    function getActiveEccentricMode(fallbackMode) {
      if (!elements.eccentricSelect) {
        return fallbackMode;
      }
      return eccentricOverrideEnabled
        ? elements.eccentricSelect.value
        : fallbackMode;
    }

    function getMotorPalette(motorId) {
      if (motorId === 'right') {
        return {
          primary: 'rgba(255, 88, 140, 0.95)',
          secondary: 'rgba(220, 55, 110, 0.95)',
          glow: 'rgba(255, 88, 140, 0.85)',
          waveFade: 'rgba(255, 88, 140, 0.6)',
          waveDot: 'rgba(255, 88, 140, 0.35)',
        };
      }
      return {
        primary: 'rgba(72, 170, 255, 0.95)',
        secondary: 'rgba(45, 140, 230, 0.95)',
        glow: 'rgba(72, 170, 255, 0.85)',
        waveFade: 'rgba(72, 170, 255, 0.6)',
        waveDot: 'rgba(72, 170, 255, 0.35)',
      };
    }

    function computeForceMultiplier(mode, normalized, directionHint) {
      const direction = directionHint < 0 ? -1 : 1;
      const descending = direction < 0;
      const eccentricModeValue = getActiveEccentricMode(mode);
      const activeMode = descending ? eccentricModeValue : mode;
      return getForceCurveMultiplier(activeMode, normalized, direction);
    }

    function getGaugeGeometry(canvas) {
      if (!canvas) {
        return null;
      }
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const radius = Math.min(rect.width, rect.height) / 2 - 10;
      return { rect, centerX, centerY, radius };
    }

    function getGaugeHandlePosition(motor) {
      if (!motor || !motor.gaugeCanvas) return null;
      const geometry = getGaugeGeometry(motor.gaugeCanvas);
      if (!geometry) return null;
      const baseProgress = Math.max(
        0,
        Math.min(1, motor.baseResistance / MAX_RESISTANCE)
      );
      const angle = -Math.PI / 2 + TWO_PI * baseProgress;
      const x = geometry.centerX + Math.cos(angle) * geometry.radius;
      const y = geometry.centerY + Math.sin(angle) * geometry.radius;
      const handleRadius = Math.max(10, geometry.radius * 0.08);
      return { x, y, handleRadius };
    }

    function getWaveFillContext(canvas, width, height) {
      if (!canvas) return null;
      if (!canvas._waveFillCanvas) {
        canvas._waveFillCanvas = document.createElement('canvas');
        canvas._waveFillCtx = canvas._waveFillCanvas.getContext('2d');
      }
      const fillCanvas = canvas._waveFillCanvas;
      const fillCtx = canvas._waveFillCtx;
      if (!fillCtx) return null;
      if (fillCanvas.width !== width || fillCanvas.height !== height) {
        fillCanvas.width = width;
        fillCanvas.height = height;
      }
      return { fillCanvas, fillCtx };
    }
    function drawForceProfile(canvas, mode, direction) {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(10, 16, 30, 0.92)';
      ctx.fillRect(0, 0, width, height);

      const intensity = Math.max(0, Math.min(100, forceCurveIntensityValue)) / 100;
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
        const y =
          padding.top +
          ((maxForce - value) / (maxForce - minForce || 1)) * plotHeight;
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

      const zeroY =
        padding.top + ((maxForce - 0) / (maxForce - minForce || 1)) * plotHeight;
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
        const py =
          padding.top +
          ((maxForce - delta) / (maxForce - minForce || 1)) * plotHeight;
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
        const y =
          padding.top +
          ((maxForce - value) / (maxForce - minForce || 1)) * plotHeight;
        const offset = value === minForce ? 12 : value === maxForce ? -4 : 4;
        const percentLabel = `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`;
        ctx.fillText(percentLabel, padding.left - 8, y + offset);
      });
    }

    function redrawForceCurves() {
      const mode = elements.forceSelect.value;
      drawForceProfile(elements.forceCurveConcentric, mode, 1);

      const eccentricModeValue = getActiveEccentricMode(mode);
      drawForceProfile(elements.forceCurveEccentric, eccentricModeValue, -1);
    }

    function updateForceCurveDescriptions() {
      const concentricMode = elements.forceSelect.value;
      const intensity = forceCurveIntensityValue;
      if (elements.forceDescription) {
        elements.forceDescription.textContent = `Force curve: ${getForceCurveCopy(
          concentricMode,
          intensity
        )}`;
      }

      if (elements.eccentricDescription) {
        const eccMode = getActiveEccentricMode(concentricMode);
        const prefix = eccentricOverrideEnabled ? 'Eccentric override' : 'Eccentric';
        elements.eccentricDescription.textContent = `${prefix}: ${getForceCurveCopy(
          eccMode,
          intensity
        )}`;
      }
    }

    function updateForceCurveLabel() {
      const concentricLabel = elements.forceSelect
        ? elements.forceSelect.options[elements.forceSelect.selectedIndex].text
        : 'Linear';

      if (eccentricOverrideEnabled && elements.eccentricSelect) {
        const eccentricLabel =
          elements.eccentricSelect.options[elements.eccentricSelect.selectedIndex]
            .text;
        elements.forceLabel.textContent = `${concentricLabel} / ${eccentricLabel}`;
      } else {
        elements.forceLabel.textContent = concentricLabel;
      }
    }

    function ensureWaveScaleForTravel(travelInches) {
      let scaleMin = waveScaleMinRef.current || 0;
      let scaleMax = waveScaleMaxRef.current || MAX_TRAVEL_INCHES;
      const scaleSpan = Math.max(1, scaleMax - scaleMin);

      if (travelInches > scaleMax) {
        scaleMax = travelInches;
        scaleMin = Math.max(0, scaleMax - scaleSpan);
      } else if (travelInches < scaleMin) {
        scaleMin = travelInches;
        scaleMax = scaleMin + scaleSpan;
      } else {
        return;
      }

      waveScaleMinRef.current = scaleMin;
      waveScaleMaxRef.current = scaleMax;
    }

    function drawGauge(motor) {
      const ctx = motor.gaugeCtx;
      if (!ctx || !motor.gaugeCanvas) return;
      const { width, height } = motor.gaugeCanvas;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 10;
      const startAngle = -Math.PI / 2;
      const strokeWidth = Math.max(14, radius * 0.12);

      ctx.lineCap = 'round';
      ctx.lineWidth = strokeWidth;

      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(180, 180, 180, 0.28)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, TWO_PI, false);
      ctx.stroke();

      const progress = Math.max(
        0,
        Math.min(1, motor.currentResistance / MAX_RESISTANCE)
      );
      const palette = getMotorPalette(motor.id);
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, palette.primary);
      gradient.addColorStop(1, palette.secondary);

      const resistanceLocked = motorBeyondEngagement(motor);

      if (motor.baseResistance > 0) {
        const baseProgress = Math.max(
          0,
          Math.min(1, motor.baseResistance / MAX_RESISTANCE)
        );
        ctx.save();
        ctx.strokeStyle = gradient;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          radius,
          startAngle,
          startAngle + TWO_PI * baseProgress,
          false
        );
        ctx.stroke();
        ctx.restore();
      }

      if (progress > 0) {
        ctx.strokeStyle = gradient;
        ctx.shadowBlur = 24;
        ctx.shadowColor = palette.glow;
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          radius,
          startAngle,
          startAngle + TWO_PI * progress,
          false
        );
        ctx.stroke();
      }

      if (!resistanceLocked) {
        const handleProgress = Math.max(
          0,
          Math.min(1, motor.baseResistance / MAX_RESISTANCE)
        );
        const handleAngle = startAngle + TWO_PI * handleProgress;
        const handleX = centerX + Math.cos(handleAngle) * radius;
        const handleY = centerY + Math.sin(handleAngle) * radius;
        const handleRadius = Math.max(10, radius * 0.08);
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = palette.glow;
        ctx.fillStyle = palette.primary;
        ctx.beginPath();
        ctx.arc(handleX, handleY, handleRadius, 0, TWO_PI);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = palette.secondary;
        ctx.stroke();
        ctx.restore();
      }

      if (motor.currentLabel) {
        motor.currentLabel.textContent = `${Math.round(motor.currentResistance)}`;
      }
      if (motor.repsLabel) {
        motor.repsLabel.textContent = `${motor.reps}`;
      }
    }

    function drawWaveCombined() {
      const canvas = waveCombinedRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const topPadding = 20;
      const bottomPadding = 24;
      const usableHeight = height - topPadding - bottomPadding;
      const circleRadius = 16;
      const circleX = width - 46;
      const labelPadding = 36;
      const plotLeft = labelPadding;
      const availableWidth = circleX - circleRadius - plotLeft;
      const axisColor = 'rgba(220, 220, 220, 0.45)';
      const gridColor = 'rgba(220, 220, 220, 0.2)';
      let scaleMin = waveScaleMinRef.current || 0;
      let scaleMax = waveScaleMaxRef.current || MAX_TRAVEL_INCHES;
      const currentMaxTravel = Math.max(
        ...motors.map((motor) => motor.normalized * MAX_TRAVEL_INCHES)
      );
      const scaleSpan = Math.max(1, scaleMax - scaleMin);
      if (currentMaxTravel > scaleMax) {
        scaleMax = currentMaxTravel;
        scaleMin = Math.max(0, scaleMax - scaleSpan);
        waveScaleMaxRef.current = scaleMax;
        waveScaleMinRef.current = scaleMin;
      }
      if (currentMaxTravel < scaleMin) {
        scaleMin = currentMaxTravel;
        scaleMax = scaleMin + scaleSpan;
        waveScaleMaxRef.current = scaleMax;
        waveScaleMinRef.current = Math.max(0, scaleMin);
      }
      const scaleValue = (inches) =>
        Math.min(1, Math.max(0, (inches - scaleMin) / scaleSpan));
      const yLabels = Array.from({ length: 5 }, (_, idx) =>
        Number((scaleMin + scaleSpan * (idx / 4)).toFixed(1))
      );
      const yLineCount = yLabels.length - 1;

      ctx.save();
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotLeft, height - bottomPadding);
      ctx.lineTo(circleX - circleRadius, height - bottomPadding);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(plotLeft, topPadding);
      ctx.lineTo(plotLeft, height - bottomPadding);
      ctx.stroke();

      ctx.fillStyle = 'rgba(220, 220, 220, 0.85)';
      ctx.font = '12px "Roboto", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      for (let i = 0; i <= yLineCount; i += 1) {
        const y = height - bottomPadding - (usableHeight / yLineCount) * i;
        ctx.strokeStyle = i === 0 ? axisColor : gridColor;
        ctx.beginPath();
        ctx.moveTo(plotLeft, y);
        ctx.lineTo(circleX - circleRadius, y);
        ctx.stroke();
        const labelValue = yLabels[i] ?? 0;
        ctx.fillText(`${labelValue.toFixed(1)} in`, 6, y);
      }

      ctx.strokeStyle = gridColor;
      for (let i = 1; i < yLineCount; i += 1) {
        const x = plotLeft + (availableWidth / yLineCount) * i;
        ctx.beginPath();
        ctx.moveTo(x, topPadding);
        ctx.lineTo(x, height - bottomPadding);
        ctx.stroke();
      }
      ctx.restore();

      motors.forEach((motor) => {
        const headY =
          topPadding +
          (1 - scaleValue(motor.normalized * MAX_TRAVEL_INCHES)) *
            usableHeight;
        const palette = getMotorPalette(motor.id);
        const fillAlpha = motor.id === 'right' ? 0.38 : 0.22;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        const gradient = ctx.createLinearGradient(0, 0, circleX - circleRadius, 0);
        gradient.addColorStop(0, palette.primary);
        gradient.addColorStop(1, palette.primary);
        ctx.strokeStyle = gradient;
        ctx.beginPath();

        const points = motor.trail;
        const len = points.length;
        if (len > 0) {
          for (let i = 0; i < len; i += 1) {
            const progress = i / (len - 1 || 1);
            const x = plotLeft + progress * availableWidth;
            const y = topPadding + (1 - scaleValue(points[i])) * usableHeight;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        } else {
          ctx.moveTo(plotLeft, headY);
        }
        ctx.lineTo(circleX - circleRadius, headY);
        ctx.lineTo(circleX - circleRadius, height - bottomPadding);
        ctx.lineTo(plotLeft, height - bottomPadding);
        ctx.closePath();
        const fillLayer = getWaveFillContext(canvas, width, height);
        if (fillLayer) {
          const { fillCanvas, fillCtx } = fillLayer;
          fillCtx.clearRect(0, 0, width, height);
          fillCtx.beginPath();
          if (len > 0) {
            for (let i = 0; i < len; i += 1) {
              const progress = i / (len - 1 || 1);
              const x = plotLeft + progress * availableWidth;
              const y = topPadding + (1 - scaleValue(points[i])) * usableHeight;
              if (i === 0) {
                fillCtx.moveTo(x, y);
              } else {
                fillCtx.lineTo(x, y);
              }
            }
          } else {
            fillCtx.moveTo(plotLeft, headY);
          }
          fillCtx.lineTo(circleX - circleRadius, headY);
          fillCtx.lineTo(circleX - circleRadius, height - bottomPadding);
          fillCtx.lineTo(plotLeft, height - bottomPadding);
          fillCtx.closePath();
          const fillGradient = fillCtx.createLinearGradient(0, 0, circleX - circleRadius, 0);
          fillGradient.addColorStop(0, palette.waveFade);
          fillGradient.addColorStop(1, palette.waveFade);
          fillCtx.globalAlpha = fillAlpha;
          fillCtx.fillStyle = fillGradient;
          fillCtx.fill();
          fillCtx.globalAlpha = 1;
          fillCtx.globalCompositeOperation = 'destination-in';
          const verticalFade = fillCtx.createLinearGradient(
            0,
            topPadding,
            0,
            height - bottomPadding
          );
          verticalFade.addColorStop(0, 'rgba(0, 0, 0, 1)');
          verticalFade.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
          verticalFade.addColorStop(1, 'rgba(0, 0, 0, 0)');
          fillCtx.fillStyle = verticalFade;
          fillCtx.fillRect(0, topPadding, width, height - topPadding - bottomPadding);
          fillCtx.globalCompositeOperation = 'source-over';
          ctx.drawImage(fillCanvas, 0, 0);
        }
        ctx.beginPath();
        if (len > 0) {
          for (let i = 0; i < len; i += 1) {
            const progress = i / (len - 1 || 1);
            const x = plotLeft + progress * availableWidth;
            const y = topPadding + (1 - scaleValue(points[i])) * usableHeight;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        } else {
          ctx.moveTo(plotLeft, headY);
        }
        ctx.lineTo(circleX - circleRadius, headY);
        ctx.stroke();

        ctx.fillStyle = palette.waveDot;
        ctx.beginPath();
        ctx.arc(circleX, headY, circleRadius, 0, TWO_PI);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = palette.primary;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    }
    function update(timestamp) {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (!powerOn) {
        motors.forEach((motor) => {
          motor.currentResistance = 0;
          motor.normalized = 0;
          motor.trail.fill(0);
        if (motor.cableLabel) {
          motor.cableLabel.textContent = '0.0';
        }
          drawGauge(motor);
        });
        drawWaveCombined();
        updateForceProfileLockState();
        animationFrameRef.current = requestAnimationFrame(update);
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
        const normalized = Math.max(
          0,
          Math.min(1, sliderDistance / MAX_TRAVEL_INCHES)
        );
        motor.normalized = normalized;
        const travel = motor.normalized * MAX_TRAVEL_INCHES;
        ensureWaveScaleForTravel(travel);
        const forceDelta = travel - motor.lastForceTravel;
        if (Math.abs(forceDelta) > MOVEMENT_EPSILON) {
          motor.forceDirection = forceDelta > 0 ? 1 : -1;
          motor.lastForceTravel = travel;
        }

        const engageDistance = motor.engagementDistance;
        const engageThresholdDistance = Math.min(
          MAX_TRAVEL_INCHES,
          engageDistance + WEIGHT_ENGAGE_OFFSET
        );
        const engageThreshold = Math.min(
          0.98,
          engageThresholdDistance / MAX_TRAVEL_INCHES
        );

        if (motorsRunning && setActive && !motor.engaged && motor.normalized >= engageThreshold) {
          motor.engaged = true;
          const label = formatMotorLabel(motor.id);
          setStatusMessage(
            `${label} motor engaged at ${engageThresholdDistance.toFixed(
              1
            )} in. Rep tracking armed.`
          );
        }

        const resistance = resolveMotorResistance(motor, engageDistance, mode);

        if (!setActive) {
          motor.engaged = false;
          motor.reps = 0;
          resetMotorTracking(motor, travel);
        } else if (!motorsRunning) {
          motor.engaged = false;
          resetMotorTracking(motor, travel);
        }

        motor.currentResistance = resistance;

        if (motor.cableLabel) {
          motor.cableLabel.textContent = travel.toFixed(1);
        }

        motor.trail.push(travel);
        if (motor.trail.length > TRAIL_LENGTH) {
          motor.trail.shift();
        }

        if (motorsRunning && setActive && motor.engaged) {
          const deltaTravel = travel - motor.lastTravel;
          motor.lastTravel = travel;
          if (Math.abs(deltaTravel) > MOVEMENT_EPSILON) {
            motor.direction = deltaTravel > 0 ? 1 : -1;
            motor.forceDirection = motor.direction;
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
      });

      drawWaveCombined();
      updateForceProfileLockState();

      animationFrameRef.current = requestAnimationFrame(update);
    }

    motors.forEach((motor) => {
      setMotorEngagementDistance(motor, DEFAULT_RETRACTION_BOTTOM, { announce: false });
    });

    const motorHandlers = motors.map((motor) => {
      const handleGaugePointer = (event) => {
        if (!powerOn) return;
        updateResistanceFromGauge(motor, event.clientX, event.clientY);
      };

      const handleGaugePointerDown = (event) => {
        if (motorBeyondEngagement(motor)) {
          return;
        }
        const handle = getGaugeHandlePosition(motor);
        if (!handle) return;
        const dx = event.clientX - handle.x;
        const dy = event.clientY - handle.y;
        const distance = Math.hypot(dx, dy);
        if (distance > handle.handleRadius + 10) {
          return;
        }
        motor.gaugeDragging = true;
        motor.gaugePointerId = event.pointerId;
        motor.gaugeCanvas.setPointerCapture(event.pointerId);
        handleGaugePointer(event);
      };

      const handleGaugePointerMove = (event) => {
        if (!motor.gaugeDragging) return;
        updateResistanceFromGauge(motor, event.clientX, event.clientY);
      };

      const handleGaugePointerUp = () => {
        if (motor.gaugePointerId !== undefined) {
          try {
            motor.gaugeCanvas.releasePointerCapture(motor.gaugePointerId);
          } catch (err) {
            // Ignore if capture is already released.
          }
        }
        motor.gaugeDragging = false;
        motor.gaugePointerId = undefined;
      };

      const handleSimInput = () => {
        const sliderDistance = Number(motor.simSlider.value);
        const normalized = Math.max(
          0,
          Math.min(1, sliderDistance / MAX_TRAVEL_INCHES)
        );
        const previous = motor.normalized;
        const previousDistance = previous * MAX_TRAVEL_INCHES;
        if (sliderDistance > previousDistance + SIM_SLIDER_STEP / 2) {
          motor.direction = 1;
          motor.forceDirection = 1;
        } else if (sliderDistance < previousDistance - SIM_SLIDER_STEP / 2) {
          motor.direction = -1;
          motor.forceDirection = -1;
        }
        motor.normalized = normalized;
        const travel = normalized * MAX_TRAVEL_INCHES;
        ensureWaveScaleForTravel(travel);
        motor.trail.push(travel);
        if (motor.trail.length > TRAIL_LENGTH) {
          motor.trail.shift();
        }
        if (motor.cableLabel) {
          motor.cableLabel.textContent = (normalized * MAX_TRAVEL_INCHES).toFixed(1);
        }
        motor.lastForceTravel = sliderDistance;
        drawWaveCombined();
        refreshMotorResistance(motor);
        updateForceProfileLockState();
      };

      const handleSimChange = () => {
        const distance = Number(motor.simSlider.value || 0);
        if (motor.setArmed) {
          const start = motor.armedTravelStart ?? DEFAULT_RETRACTION_BOTTOM;
          const required = start + 1;
          const tolerance = SIM_SLIDER_STEP / 2;
          if (distance < required - tolerance) {
            const label = formatMotorLabel(motor.id);
            setStatusMessage(
              `${label} cable must be pulled at least 1.0 in before locking the length.`,
              { tone: 'error' }
            );
            return;
          }
          setMotorEngagementDistance(motor, distance, { source: 'set-button' });
          disarmMotorCableSet(motor, { silent: true });
        }
        updateForceProfileLockState();
      };

      motor.gaugeCanvas.addEventListener('pointerdown', handleGaugePointerDown);
      motor.gaugeCanvas.addEventListener('pointermove', handleGaugePointerMove);
      motor.gaugeCanvas.addEventListener('pointerup', handleGaugePointerUp);
      motor.gaugeCanvas.addEventListener('pointerleave', handleGaugePointerUp);
      motor.simSlider.addEventListener('input', handleSimInput);
      motor.simSlider.addEventListener('change', handleSimChange);

      motor.baseLabel.textContent = `${motor.baseResistance} lb`;
      refreshMotorResistance(motor);

      const handleSetCableClick = () => {
        toggleMotorCableSet(motor);
      };
      const handleRetractClick = () => {
        startMotorRetraction(motor);
      };

      if (motor.setCableButton) {
        motor.setCableButton.addEventListener('click', handleSetCableClick);
      }
      if (motor.retractCableButton) {
        motor.retractCableButton.addEventListener('click', handleRetractClick);
      }

      return {
        motor,
        handleGaugePointerDown,
        handleGaugePointerMove,
        handleGaugePointerUp,
        handleSimInput,
        handleSimChange,
        handleSetCableClick,
        handleRetractClick,
      };
    });

    function updateForceCurveLabelState() {
      updateForceCurveDescriptions();
      updateForceCurveLabel();
      redrawForceCurves();
    }

    function updateStatusesInitial() {
      updateStatuses();
      updateForceCurveLabelState();
      if (elements.eccentricPanel) {
        elements.eccentricPanel.hidden = true;
      }
    }

    updateStatusesInitial();
    updateWaveScale();
    applyPowerState();
    updateForceProfileLockState();

    animationFrameRef.current = requestAnimationFrame(update);

    requestAnimationFrame(() => {
      syncWaveCanvasSizes();
      syncForceCurveCanvasSizes();
      syncGaugeCanvasSizes();
    });

    const handleResize = () => {
      syncWaveCanvasSizes();
      syncForceCurveCanvasSizes();
      syncGaugeCanvasSizes();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      window.removeEventListener('resize', handleResize);
      elements.startToggle.removeEventListener('click', handleWorkoutToggle);
      elements.forceSelect.removeEventListener('change', handleForceSelectChange);

      if (elements.forceCurveIntensity) {
        elements.forceCurveIntensity.removeEventListener('input', handleForceIntensityInput);
        elements.forceCurveIntensity.removeEventListener('change', handleForceIntensityInput);
      }

      if (elements.eccentricToggle) {
        elements.eccentricToggle.removeEventListener('click', handleEccentricToggle);
      }

      if (elements.eccentricSelect) {
        elements.eccentricSelect.removeEventListener('change', handleEccentricSelectChange);
      }

      if (elements.setToggle) {
        elements.setToggle.removeEventListener('click', handleSetToggle);
      }

      if (elements.reset) {
        elements.reset.removeEventListener('click', handleReset);
      }

      if (elements.powerToggle) {
        elements.powerToggle.removeEventListener('click', handlePowerToggle);
      }

      if (elements.motorToggle) {
        elements.motorToggle.removeEventListener('click', toggleMotors);
      }

      if (elements.exerciseSelect) {
        elements.exerciseSelect.removeEventListener('change', handleExerciseChange);
      }

      motorHandlers.forEach((handler) => {
        const motor = handler.motor;
        motor.gaugeCanvas.removeEventListener('pointerdown', handler.handleGaugePointerDown);
        motor.gaugeCanvas.removeEventListener('pointermove', handler.handleGaugePointerMove);
        motor.gaugeCanvas.removeEventListener('pointerup', handler.handleGaugePointerUp);
        motor.gaugeCanvas.removeEventListener('pointerleave', handler.handleGaugePointerUp);
        motor.simSlider.removeEventListener('input', handler.handleSimInput);
        motor.simSlider.removeEventListener('change', handler.handleSimChange);
        if (motor.setCableButton) {
          motor.setCableButton.removeEventListener('click', handler.handleSetCableClick);
        }
        if (motor.retractCableButton) {
          motor.retractCableButton.removeEventListener('click', handler.handleRetractClick);
        }
      });
    };
  }, [exerciseCatalog, exerciseVideos]);

  return (
    <main className="app-shell">
      <header className="app-header" aria-label="System header">
        <div className="header-brand" aria-label="Dragon Gym logo">
          <img
            src="/assets/dragonai-logo.png"
            alt="DragonAI neon dragon"
            className="logo-image"
          />
        </div>
        <div className="header-center" aria-label="Dragon Gym overview">
          <h1 className="header-title">Dragon Gym</h1>
        </div>
        <div className="header-actions" aria-label="Power controls">
          <button
            className="status-toggle"
            id="motorToggle"
            ref={motorToggleRef}
            type="button"
            aria-pressed="false"
            data-state="offline"
          >
            <span className="status-line">Motors Offline</span>
            <span className="action-line">Tap to start</span>
          </button>
          <button
            className="power-toggle"
            id="powerToggle"
            ref={powerToggleRef}
            type="button"
          >
            Power On
          </button>
        </div>
      </header>

      <section className="resistance-overview" aria-label="Resistance overview">
        <article className="status-card" aria-label="Workout status" aria-live="polite">
          <header className="status-header">
            <span className="status-pill sr-only" id="workoutState" ref={workoutStateRef}>
              Workout Not Started
            </span>
          </header>
          <div className="status-controls" aria-label="Workout controls">
            <div className="workout-toggle">
              <button
                className="primary"
                id="toggleWorkout"
                ref={startToggleRef}
                type="button"
                aria-pressed="false"
              >
                Start Workout
              </button>
            </div>
            <div className="set-control-group" aria-label="Set controls">
              <button
                className="accent"
                id="setToggle"
                ref={setToggleRef}
                type="button"
                disabled
                aria-pressed="false"
              >
                Start Set
              </button>
              <button
                className="ghost"
                id="resetWorkout"
                ref={resetRef}
                type="button"
                disabled
              >
                Reset
              </button>
            </div>
          </div>
          <div className="status-stack">
            <div>
              <span className="label">Set</span>
              <span className="value" id="setStatus" ref={setStatusRef}>
                0
              </span>
            </div>
            <div>
              <span className="label">Reps</span>
              <span className="value" id="repStatus" ref={repStatusRef}>
                0 / 12
              </span>
            </div>
            <div>
              <span className="label">Left reps</span>
              <span className="value" id="leftStatusReps" ref={leftStatusRepsRef}>
                0
              </span>
            </div>
            <div>
              <span className="label">Right reps</span>
              <span className="value" id="rightStatusReps" ref={rightStatusRepsRef}>
                0
              </span>
            </div>
            <div>
              <span className="label">Force curve</span>
              <span className="value" id="forceCurveLabel" ref={forceLabelRef}>
                Linear
              </span>
            </div>
          </div>
          <p className="status-message" id="workoutMessage" ref={messageRef}>
            Tap Start Workout to arm the set controls.
          </p>
        </article>
        <article className="telemetry-card" aria-label="Live controls">
          <header className="telemetry-header">
            <div>
              <h2>Live Control</h2>
              <p className="telemetry-subtitle">TwinCAT ADS</p>
            </div>
            <div className="telemetry-status">
              <span
                className={`telemetry-connection ${telemetryConnected ? 'is-online' : 'is-offline'}`}
              >
                {telemetryConnected ? 'Connected' : 'Disconnected'}
              </span>
              {telemetryFault ? <span className="telemetry-fault">Fault</span> : null}
            </div>
          </header>
          <div className="telemetry-grid">
            <div className="telemetry-block">
              <h3>Left Motor</h3>
              <div className="telemetry-row">
                <span>Pos</span>
                <span>{formatTelemetryValue(leftPos)}</span>
              </div>
              <div className="telemetry-row">
                <span>Vel</span>
                <span>{formatTelemetryValue(leftVel)}</span>
              </div>
              <div className="telemetry-row">
                <span>Force</span>
                <span>{formatTelemetryValue(leftForce)}</span>
              </div>
            </div>
            <div className="telemetry-block">
              <h3>Right Motor</h3>
              <div className="telemetry-row">
                <span>Pos</span>
                <span>{formatTelemetryValue(rightPos)}</span>
              </div>
              <div className="telemetry-row">
                <span>Vel</span>
                <span>{formatTelemetryValue(rightVel)}</span>
              </div>
              <div className="telemetry-row">
                <span>Force</span>
                <span>{formatTelemetryValue(rightForce)}</span>
              </div>
            </div>
          </div>
          <div className="command-controls">
            <div className="command-buttons">
              <button
                type="button"
                className="accent"
                onClick={() => handleCommand(COMMAND_TYPES.ENABLE)}
                disabled={!telemetryConnected || commandStatus === 'sending'}
              >
                Enable
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => handleCommand(COMMAND_TYPES.DISABLE)}
                disabled={!telemetryConnected || commandStatus === 'sending'}
              >
                Disable
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => handleCommand(COMMAND_TYPES.STOP)}
                disabled={!telemetryConnected || commandStatus === 'sending'}
              >
                Stop
              </button>
            </div>
            <div className="command-inputs">
              <label>
                <span>Axis</span>
                <select value={axisMask} onChange={handleAxisChange}>
                  {AXIS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Resistance</span>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="1"
                  value={commandResistance}
                  onChange={handleResistanceChange}
                />
              </label>
              <div className="command-apply">
                <span>{resistanceLabel} lb</span>
                <button
                  type="button"
                  className="primary"
                  onClick={() =>
                    handleCommand(COMMAND_TYPES.SET_RESISTANCE, {
                      param1: Number.isFinite(commandResistance) ? commandResistance : 0,
                    })
                  }
                  disabled={!telemetryConnected || commandStatus === 'sending'}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
          <p className="command-status" data-state={commandStatus}>
            {commandMessage || 'Ready to send commands.'}
          </p>
        </article>
        <article className="motor-card" data-motor="left">
          <div className="motor-engagement" aria-label="Left motor cable engagement">
            <div className="engagement-readout" aria-live="polite">
              <span className="label">Engagement distance</span>
              <span className="value" id="leftEngageDisplay" ref={leftEngageDisplayRef}>
                1.0 in
              </span>
            </div>
            <div className="engagement-actions">
              <button
                type="button"
                className="ghost"
                id="leftSetCableLength"
                ref={leftSetCableLengthRef}
              >
                Set Cable Length
              </button>
              <button
                type="button"
                className="ghost"
                id="leftRetractCable"
                ref={leftRetractCableRef}
              >
                Retract Cable
              </button>
            </div>
          </div>
          <div className="gauge-wrapper">
            <canvas
              className="resistance-gauge"
              id="leftGauge"
              ref={leftGaugeRef}
              width="540"
              height="540"
              aria-hidden="true"
            ></canvas>
            <div className="gauge-center">
              <span className="current-resistance">
                <span
                  className="current-resistance-value"
                  id="leftCurrentResistance"
                  ref={leftCurrentResistanceRef}
                >
                  0
                </span>
                <span className="current-resistance-unit">LB</span>
              </span>
            </div>
          </div>
          <dl className="motor-meta">
            <div>
              <dt>Base resistance</dt>
              <dd id="leftBaseResistance" ref={leftBaseResistanceRef}>
                0 lb
              </dd>
            </div>
            <div>
              <dt>Left Reps</dt>
              <dd id="leftRepCount" ref={leftRepCountRef}>
                0
              </dd>
            </div>
          </dl>
        </article>

        <article className="motor-card" data-motor="right">
          <div className="motor-engagement" aria-label="Right motor cable engagement">
            <div className="engagement-readout" aria-live="polite">
              <span className="label">Engagement distance</span>
              <span className="value" id="rightEngageDisplay" ref={rightEngageDisplayRef}>
                1.0 in
              </span>
            </div>
            <div className="engagement-actions">
              <button
                type="button"
                className="ghost"
                id="rightSetCableLength"
                ref={rightSetCableLengthRef}
              >
                Set Cable Length
              </button>
              <button
                type="button"
                className="ghost"
                id="rightRetractCable"
                ref={rightRetractCableRef}
              >
                Retract Cable
              </button>
            </div>
          </div>
          <div className="gauge-wrapper">
            <canvas
              className="resistance-gauge"
              id="rightGauge"
              ref={rightGaugeRef}
              width="540"
              height="540"
              aria-hidden="true"
            ></canvas>
            <div className="gauge-center">
              <span className="current-resistance">
                <span
                  className="current-resistance-value"
                  id="rightCurrentResistance"
                  ref={rightCurrentResistanceRef}
                >
                  0
                </span>
                <span className="current-resistance-unit">LB</span>
              </span>
            </div>
          </div>
          <dl className="motor-meta">
            <div>
              <dt>Base resistance</dt>
              <dd id="rightBaseResistance" ref={rightBaseResistanceRef}>
                0 lb
              </dd>
            </div>
            <div>
              <dt>Right Reps</dt>
              <dd id="rightRepCount" ref={rightRepCountRef}>
                0
              </dd>
            </div>
          </dl>
        </article>
      </section>
      <section className="workspace">
        <section className="visual-panel" aria-label="Cable travel visualizations">
          <div className="wave-grid">
            <article className="wave-card" data-motor="combined">
              <header>
                <span className="wave-rep-label">
                <span className="wave-rep-count" ref={waveRepRef}>0</span>
                </span>
              </header>
              <canvas
                className="wave-canvas"
                id="combinedWave"
                ref={waveCombinedRef}
                width="960"
                height="260"
                aria-hidden="true"
              ></canvas>
            </article>
          </div>
          <section className="simulator-panel" aria-label="Motor travel simulator">
            <h3>Motor Travel Simulation</h3>
            <div className="sim-slider-group">
              <label className="sim-slider">
                <span>Left cable length</span>
                <input
                  type="range"
                  id="leftSim"
                  ref={leftSimRef}
                  min="1"
                  max="24"
                  step="0.1"
                  defaultValue="1"
                />
              </label>
              <label className="sim-slider">
                <span>Right cable length</span>
                <input
                  type="range"
                  id="rightSim"
                  ref={rightSimRef}
                  min="1"
                  max="24"
                  step="0.1"
                  defaultValue="1"
                />
              </label>
            </div>
          </section>
        </section>
        <section
          className="force-panel"
          aria-label="Force curve profiles"
          id="forceCurvePanel"
          ref={forcePanelRef}
          hidden
        >
          <button
            className="card-toggle"
            type="button"
            aria-expanded={forceCurveOpen}
            aria-controls="forceCurveBody"
            onClick={() => setForceCurveOpen((prev) => !prev)}
          >
            <span>Force Curve Profiles</span>
          </button>
          <div id="forceCurveBody" className="card-body" hidden={!forceCurveOpen}>
            <p
              className="hint lock-hint"
              id="forceCurveLockHint"
              ref={forceLockHintRef}
              hidden
              aria-live="polite"
            >
              Retract both cables to or below their engagement distance to adjust these settings.
            </p>
            <div className="force-curve-group">
              <div className="force-curve-header">
                <div className="force-curve-inputs">
                  <label>
                    <span>Force curve mode</span>
                    <select id="forceCurve" ref={forceSelectRef} defaultValue="linear">
                      <option value="linear">Linear</option>
                      <option value="chain">Chain mode</option>
                      <option value="band">Band mode</option>
                      <option value="reverse-chain">Reverse chain</option>
                    </select>
                  </label>
                  <label>
                    <span>Force curve intensity (%)</span>
                    <input
                      type="number"
                      id="forceCurveIntensity"
                      ref={forceCurveIntensityRefElement}
                      min="0"
                      max="100"
                      step="1"
                      defaultValue="20"
                    />
                  </label>
                </div>
                <button
                  className="ghost eccentric-toggle"
                  id="eccentricToggle"
                  ref={eccentricToggleRef}
                  type="button"
                  aria-expanded="false"
                >
                  Enable eccentric profile
                </button>
              </div>
              <canvas
                className="force-curve-graph"
                id="forceCurveConcentric"
                ref={forceCurveConcentricRef}
                width="640"
                height="220"
                aria-hidden="true"
              ></canvas>
              <p className="hint" id="forceCurveDescription" ref={forceDescriptionRef}>
                Force curve: Equal load through the pull and return.
              </p>
              <div className="eccentric-panel" id="eccentricPanel" ref={eccentricPanelRef} hidden>
                <label>
                  <span>Eccentric force curve</span>
                  <select id="eccentricCurve" ref={eccentricSelectRef} defaultValue="eccentric">
                    <option value="eccentric">Eccentric mode</option>
                    <option value="chain">Chain mode</option>
                    <option value="band">Band mode</option>
                    <option value="reverse-chain">Reverse chain</option>
                  </select>
                </label>
                <canvas
                  className="force-curve-graph"
                  id="forceCurveEccentric"
                  ref={forceCurveEccentricRef}
                  width="640"
                  height="220"
                  aria-hidden="true"
                ></canvas>
                <p className="hint" id="eccentricCurveDescription" ref={eccentricDescriptionRef}>
                  Eccentric: +20% load on the lowering phase.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="log-panel" aria-label="Workout log">
          <h3>Workout Log</h3>
          <p className="panel-intro">
            Completed sets appear here with recorded resistance and reps.
          </p>
          <ul className="log-list" id="workoutLogList" ref={logListRef}></ul>
        </section>
        <section className="selector-panel" aria-label="Workout selector">
          <button
            className="card-toggle"
            type="button"
            aria-expanded={selectorOpen}
            aria-controls="selectorBody"
            onClick={() => setSelectorOpen((prev) => !prev)}
          >
            <span>Workout Selector</span>
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
      </section>
    </main>
  );
}

export default App;
