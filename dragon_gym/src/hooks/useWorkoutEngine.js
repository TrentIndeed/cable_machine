import { useEffect } from 'react';
import {
  AUTO_TORQUE_MIN_DELTA,
  AUTO_TORQUE_MIN_MS,
  COMMAND_TYPES,
  DEFAULT_REP_TARGET,
  DEFAULT_RETRACTION_BOTTOM,
  ENGAGEMENT_RAMP_INCHES,
  INITIAL_BASE_RESISTANCE,
  MAX_RESISTANCE,
  MAX_TRAVEL_INCHES,
  MOVEMENT_EPSILON,
  REP_SPAN_THRESHOLD,
  RETRACTION_SPEED_MPH,
  RETRACTION_SPEED_IPS,
  SIM_SLIDER_STEP,
  TRAIL_LENGTH,
  TWO_PI,
  WEIGHT_ENGAGE_OFFSET,
} from '../constants/appConstants';
import {
  computeForceMultiplier,
  drawForceProfile,
  getActiveEccentricMode,
  getForceCurveCopy,
} from '../utils/forceCurveUtils';
import { getGaugeHandlePosition } from '../utils/gaugeUtils';
import { clamp, formatMotorLabel, quantize } from '../utils/mathUtils';
import { getMotorPalette } from '../utils/paletteUtils';
import { getWaveFillContext } from '../utils/waveUtils';

function useWorkoutEngine(params) {
  const {
    exerciseCatalog,
    exerciseVideos,
    forceCurveModeRef,
    forceCurveIntensityRef,
    eccentricModeRef,
    eccentricEnabledRef,
    waveScaleMaxRef,
    waveScaleMinRef,
    waveScaleSamplesRef,
    motorsSyncedRef,
    telemetryRef,
    telemetryConnectedRef,
    lastSentResistanceRef,
    sendCommand,
    handleCommand,
    setCommandResistance,
    setAxisMask,
    setMotorsSyncedState,
    setSyncHidden,
    setForceCurveMode,
    setForceCurveIntensityState,
    setEccentricMode,
    setEccentricEnabled,
    setVideoSrc,
    refs,
  } = params;

  const {
    workoutStateRef,
    startToggleRef,
    startToggleHomeSlotRef,
    pauseIconRef,
    setToggleRef,
    setControlRowRef,
    setControlGroupRef,
    simPanelRef,
    resetRef,
    setStatusRef,
    repStatusRef,
    waveRepRef,
    waveRepBounceTimeoutRef,
    repCurveLabelRef,
    leftStatusRepsRef,
    rightStatusRepsRef,
    messageRef,
    leftWaveLegendRef,
    rightWaveLegendRef,
    forceSelectRef,
    forceDescriptionRef,
    forceLabelRef,
    forceCurveConcentricRef,
    forceCurveEccentricRef,
    forceCurveModePillRef,
    eccentricTogglePillRef,
    eccentricModePillRef,
    eccentricToggleRef,
    eccentricPanelRef,
    eccentricSelectRef,
    eccentricDescriptionRef,
    forceCurveIntensityRefElement,
    forcePanelRef,
    forceLockHintRef,
    powerToggleRef,
    adsResetRef,
    syncMotorsRef,
    axisSelectRef,
    logListRef,
    exerciseSelectRef,
    exerciseTitleRef,
    leftGaugeRef,
    leftSimRef,
    leftCurrentResistanceRef,
    leftBaseResistanceRef,
    leftRepCountRef,
    leftCableDistanceRef,
    leftResistanceValueRef,
    leftEngageDisplayRef,
    leftSetCableLengthRef,
    leftRetractCableRef,
    rightGaugeRef,
    waveCombinedRef,
    rightSimRef,
    rightCurrentResistanceRef,
    rightBaseResistanceRef,
    rightRepCountRef,
    rightCableDistanceRef,
    rightResistanceValueRef,
      rightEngageDisplayRef,
      rightSetCableLengthRef,
      rightRetractCableRef,
      animationFrameRef,
  } = refs;

  useEffect(() => {
    const elements = {
      workoutState: workoutStateRef.current,
      startToggle: startToggleRef.current,
      startToggleHomeSlot: startToggleHomeSlotRef.current,
      pauseIcon: pauseIconRef.current,
      setToggle: setToggleRef.current,
      setControlRow: setControlRowRef.current,
      setControlGroup: setControlGroupRef.current,
      simPanel: simPanelRef.current,
      reset: resetRef.current,
      setStatus: setStatusRef.current,
      repStatus: repStatusRef.current,
      waveRep: waveRepRef.current,
      repCurveLabel: repCurveLabelRef.current,
      leftStatusReps: leftStatusRepsRef.current,
      rightStatusReps: rightStatusRepsRef.current,
      leftWaveLegend: leftWaveLegendRef.current,
      rightWaveLegend: rightWaveLegendRef.current,
      message: messageRef.current,
      forceSelect: forceSelectRef.current,
      forceDescription: forceDescriptionRef.current,
      forceLabel: forceLabelRef.current,
      forceCurveConcentric: forceCurveConcentricRef.current,
      forceCurveEccentric: forceCurveEccentricRef.current,
      forceCurveModePill: forceCurveModePillRef.current,
      eccentricTogglePill: eccentricTogglePillRef.current,
      eccentricModePill: eccentricModePillRef.current,
      eccentricToggle: eccentricToggleRef.current,
      eccentricPanel: eccentricPanelRef.current,
      eccentricSelect: eccentricSelectRef.current,
      forceCurveIntensity: forceCurveIntensityRefElement.current,
      forcePanel: forcePanelRef.current,
      forceLockHint: forceLockHintRef.current,
      powerToggle: powerToggleRef.current,
      adsReset: adsResetRef.current,
      syncMotors: syncMotorsRef.current,
      axisSelect: axisSelectRef.current,
      logList: logListRef.current,
      exerciseSelect: exerciseSelectRef.current,
      exerciseTitle: exerciseTitleRef.current,
      eccentricDescription: eccentricDescriptionRef.current,
    };

    if (!elements.startToggle || !elements.forceSelect) {
      return undefined;
    }

    let pauseActive = false;

    function updatePauseIconAppearance() {
      if (!elements.pauseIcon) return;
      const icon = elements.pauseIcon.querySelector('img');
      if (icon) {
        icon.src = pauseActive ? '/assets/icons/play.png' : '/assets/icons/pause.png';
        icon.alt = pauseActive ? 'Play' : 'Pause';
      }
      elements.pauseIcon.setAttribute('aria-pressed', pauseActive ? 'true' : 'false');
      elements.pauseIcon.classList.remove('is-flash');
      void elements.pauseIcon.offsetWidth;
      elements.pauseIcon.classList.add('is-flash');
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
    let showLeftWave = true;
    let showRightWave = true;

    function updateWaveLegendState() {
      if (elements.leftWaveLegend) {
        elements.leftWaveLegend.classList.toggle('is-off', !showLeftWave);
        elements.leftWaveLegend.setAttribute('aria-pressed', String(showLeftWave));
      }
      if (elements.rightWaveLegend) {
        elements.rightWaveLegend.classList.toggle('is-off', !showRightWave);
        elements.rightWaveLegend.setAttribute('aria-pressed', String(showRightWave));
      }
    }

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

      const initialTravel = simSlider
        ? Number(simSlider.value)
        : DEFAULT_RETRACTION_BOTTOM;
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
    let lastWaveRepLabel = null;

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

    function getTelemetryTravel(motorId) {
      const data = telemetryRef.current;
      if (!data) return null;
      const value = motorId === 'right' ? data.RightPos : data.LeftPos;
      return Number.isFinite(value) ? value : null;
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

    function syncRightSimSlider(value, options = {}) {
      const rightMotor = motors.find((entry) => entry.id === 'right');
      if (!rightMotor || !rightMotor.simSlider) return;
      const { updateTrail = false } = options;
      rightMotor.simSlider.value = Number(value).toFixed(1);
      if (!updateTrail) return;
      const normalized = Math.max(0, Math.min(1, value / MAX_TRAVEL_INCHES));
      const travel = normalized * MAX_TRAVEL_INCHES;
      rightMotor.normalized = normalized;
      rightMotor.trail.push(travel);
      if (rightMotor.trail.length > TRAIL_LENGTH) {
        rightMotor.trail.shift();
      }
      rightMotor.lastForceTravel = value;
      if (rightMotor.cableLabel) {
        rightMotor.cableLabel.textContent = travel.toFixed(1);
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

    function sendAutoResistance(key, axisMaskValue, resistanceValue) {
      if (!telemetryConnectedRef.current) return;
      if (!Number.isFinite(resistanceValue)) return;
      const record = lastSentResistanceRef.current[key];
      const now = Date.now();
      if (record.value !== null) {
        if (Math.abs(resistanceValue - record.value) < AUTO_TORQUE_MIN_DELTA) {
          return;
        }
        if (now - record.time < AUTO_TORQUE_MIN_MS) {
          return;
        }
      }
      record.value = resistanceValue;
      record.time = now;
      sendCommand({
        type: COMMAND_TYPES.SET_RESISTANCE,
        axisMask: axisMaskValue,
        param1: resistanceValue,
      }).catch(() => {});
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
      if (!motor.simSlider) {
        const label = formatMotorLabel(motor.id);
        setStatusMessage(
          `${label} cable length can be set from the live encoder. Retract using the drive controls.`,
          { tone: 'info' }
        );
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
      if (!motor.simSlider) {
        const label = formatMotorLabel(motor.id);
        setStatusMessage(
          `${label} retraction is unavailable without the simulator slider.`,
          { tone: 'info' }
        );
        return false;
      }
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
      const multiplier = computeForceMultiplier(
        mode,
        motor.normalized,
        direction,
        eccentricOverrideEnabled,
        elements.eccentricSelect ? elements.eccentricSelect.value : null,
        forceCurveIntensityValue
      );
      const applied = motor.baseResistance * rampProgress * multiplier;
      return Math.min(MAX_RESISTANCE, Math.max(0, applied));
    }

    function refreshMotorResistance(motor) {
      if (!motor) return;
      const engageDistance = motor.engagementDistance;
      const mode = elements.forceSelect ? elements.forceSelect.value : 'linear';
      motor.currentResistance = resolveMotorResistance(motor, engageDistance, mode);
      if (motor.id === 'left') {
        leftResistanceValueRef.current = motor.currentResistance;
      } else if (motor.id === 'right') {
        rightResistanceValueRef.current = motor.currentResistance;
      }
      drawGauge(motor);
    }

    function getAppliedResistance(mask) {
      const left = leftResistanceValueRef.current;
      const right = rightResistanceValueRef.current;
      if (mask === 2) {
        return right;
      }
      if (mask === 3) {
        return (left + right) / 2;
      }
      return left;
    }

    function refreshAllMotorResistances() {
      motors.forEach((motor) => refreshMotorResistance(motor));
    }

    function setMotorBaseResistance(motor, value, options = {}) {
      if (!motor) return;
      const { skipSync = false } = options;
      const clamped = Math.max(0, Math.min(MAX_RESISTANCE, value));
      motor.baseResistance = clamped;
      if (motor.baseLabel) {
        motor.baseLabel.textContent = `${Math.round(clamped)} lb`;
      }
      if (motorsSyncedRef.current && motor.id === 'left' && !skipSync) {
        const rightMotor = motors.find((entry) => entry.id === 'right');
        if (rightMotor) {
          setMotorBaseResistance(rightMotor, clamped, { skipSync: true });
        }
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
        elements.setToggle.textContent = 'End Set';
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
      elements.setToggle.classList.remove('is-flash');
      void elements.setToggle.offsetWidth;
      elements.setToggle.classList.add('is-flash');

      if (elements.reset) {
        elements.reset.hidden = !setActive;
      }
      if (elements.pauseIcon) {
        elements.pauseIcon.hidden = !setActive;
        if (!setActive) {
          pauseActive = false;
          updatePauseIconAppearance();
        }
      }
    }

    function updateWorkoutToggleAppearance() {
      if (!elements.startToggle) return;
      const isActive = workoutActive && powerOn;
      elements.startToggle.textContent = isActive ? 'End Workout' : 'Start Workout';
      elements.startToggle.classList.toggle('is-stop', isActive);
      elements.startToggle.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      if (elements.startToggleHomeSlot && elements.setControlGroup) {
        if (!isActive) {
          elements.startToggle.hidden = false;
          if (elements.startToggle.parentElement !== elements.startToggleHomeSlot) {
            elements.startToggleHomeSlot.appendChild(elements.startToggle);
          }
        } else if (setActive) {
          elements.startToggle.hidden = true;
        } else {
          elements.startToggle.hidden = false;
          const target = elements.setControlRow || elements.setControlGroup;
          if (target && elements.startToggle.parentElement !== target) {
            target.appendChild(elements.startToggle);
          }
        }
      }
      if (elements.setControlGroup) {
        elements.setControlGroup.hidden = !workoutActive;
      }
      if (elements.simPanel) {
        elements.simPanel.hidden = !workoutActive;
      }
    }

    function toggleWorkout() {
      workoutActive = !workoutActive;
      if (elements.forcePanel) {
        elements.forcePanel.hidden = false;
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
        setStatusMessage('');
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
        setStatusMessage('');
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

    const handlePauseToggle = () => {
      if (!setActive) return;
      pauseActive = !pauseActive;
      updatePauseIconAppearance();
    };

    elements.startToggle.addEventListener('click', handleWorkoutToggle);

    const handleForceSelectChange = (event) => {
      const bypassLock = Boolean(event?.detail?.bypassLock || event?.isTrusted === false);
      if (!bypassLock && updateForceProfileLockState()) {
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

    const handleForceModePill = () => {
      if (!elements.forceSelect) return;
      const optionCount = elements.forceSelect.options.length;
      if (!optionCount) return;
      const nextIndex = (elements.forceSelect.selectedIndex + 1) % optionCount;
      elements.forceSelect.selectedIndex = nextIndex;
      elements.forceSelect.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const handleEccentricPill = () => {
      applyEccentricToggle();
    };

    const handleEccentricModePill = () => {
      if (!eccentricOverrideEnabled) return;
      if (!elements.eccentricSelect) return;
      const optionCount = elements.eccentricSelect.options.length;
      if (!optionCount) return;
      const nextIndex = (elements.eccentricSelect.selectedIndex + 1) % optionCount;
      elements.eccentricSelect.selectedIndex = nextIndex;
      elements.eccentricSelect.dispatchEvent(new Event('change', { bubbles: true }));
    };

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

    const applyEccentricToggle = () => {
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

    const handleEccentricToggle = (event) => {
      const bypassLock = Boolean(event?.detail?.bypassLock || event?.isTrusted === false);
      if (!bypassLock && updateForceProfileLockState()) {
        event.preventDefault();
        notifyForceProfileLock();
        return;
      }

      applyEccentricToggle();
    };

    if (elements.eccentricToggle) {
      elements.eccentricToggle.addEventListener('click', handleEccentricToggle);
    }

    const handleEccentricSelectChange = (event) => {
      const bypassLock = Boolean(event?.detail?.bypassLock || event?.isTrusted === false);
      if (!bypassLock && updateForceProfileLockState()) {
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
      updateWorkoutToggleAppearance();
    }

    function finishSet() {
      setActive = false;
      updateSetToggleAppearance();
      updateWorkoutToggleAppearance();
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
        setStatusMessage('');
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
          if (motor.repsLabel) {
            motor.repsLabel.textContent = '0';
          }
        }
      });
      if (recorded) {
        currentRep = 0;
      }
      updateStatuses();
      updateWorkoutToggleAppearance();
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
        elements.syncMotors,
        elements.forceSelect,
        elements.forceCurveIntensity,
      ];

      motors.forEach((motor) => {
        if (motor.setCableButton) {
          interactive.push(motor.setCableButton);
        }
        if (motor.retractCableButton) {
          interactive.push(motor.retractCableButton);
        }
        if (motor.simSlider) {
          motor.simSlider.disabled = !powerOn;
        }
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

    const handleSyncMotors = () => {
      const nextSynced = !motorsSyncedRef.current;
      motorsSyncedRef.current = nextSynced;
      setMotorsSyncedState(nextSynced);
      setSyncHidden(false);
      if (nextSynced) {
        const leftMotor = motors.find((entry) => entry.id === 'left');
        const rightMotor = motors.find((entry) => entry.id === 'right');
        if (leftMotor && rightMotor) {
          setMotorBaseResistance(rightMotor, leftMotor.baseResistance, {
            skipSync: true,
          });
        }
        setAxisMask(3);
        setCommandResistance(Math.round(getAppliedResistance(3)));
      }
    };

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
    window.addEventListener('dg:forceModeCycle', handleForceModePill);
    window.addEventListener('dg:eccentricToggle', handleEccentricPill);
    window.addEventListener('dg:eccentricModeCycle', handleEccentricModePill);
    if (elements.pauseIcon) {
      elements.pauseIcon.addEventListener('click', handlePauseToggle);
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
      elements.reset.disabled = true;
    }

    const handleAdsReset = () => {
      handleCommand(COMMAND_TYPES.RESET, { axisMask: 3 });
    };

    const handlePowerToggle = () => {
      powerOn = !powerOn;
      motorsRunning = powerOn ? true : false;
      applyPowerState();
      handleCommand(powerOn ? COMMAND_TYPES.ENABLE : COMMAND_TYPES.DISABLE, {
        axisMask: 3,
      });
    };

    if (elements.adsReset) {
      elements.adsReset.addEventListener('click', handleAdsReset);
    }

    if (elements.powerToggle) {
      elements.powerToggle.addEventListener('click', handlePowerToggle);
    }

    if (elements.syncMotors) {
      elements.syncMotors.addEventListener('click', handleSyncMotors);
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
      if (elements.repStatus) {
        elements.repStatus.textContent = `${currentRep} / ${totalReps}`;
      }
      if (elements.waveRep) {
        const isEccentric = motors.some((motor) => motor.phase === 'descending');
        const labelText =
          currentRep > 0
            ? `${isEccentric ? '- ' : ''}${currentRep}`
            : `${currentRep}`;
        elements.waveRep.textContent = labelText;
        if (labelText !== lastWaveRepLabel) {
          lastWaveRepLabel = labelText;
          elements.waveRep.classList.remove('is-bouncing');
          if (elements.repCurveLabel) {
            elements.repCurveLabel.classList.remove('is-bouncing');
          }
          if (waveRepBounceTimeoutRef.current) {
            clearTimeout(waveRepBounceTimeoutRef.current);
          }
          elements.waveRep.classList.add('is-bouncing');
          if (elements.repCurveLabel) {
            elements.repCurveLabel.classList.add('is-bouncing');
          }
          waveRepBounceTimeoutRef.current = setTimeout(() => {
            if (elements.waveRep) {
              elements.waveRep.classList.remove('is-bouncing');
            }
            if (elements.repCurveLabel) {
              elements.repCurveLabel.classList.remove('is-bouncing');
            }
          }, 450);
        }
      }
      if (elements.leftStatusReps) {
        elements.leftStatusReps.textContent = `${motors[0].reps} / ${totalReps}`;
      }
      if (elements.rightStatusReps) {
        elements.rightStatusReps.textContent = `${motors[1].reps} / ${totalReps}`;
      }
    }

    

    

    

    

    

    

    
    

    function redrawForceCurves() {
      const mode = elements.forceSelect.value;
      drawForceProfile(
        elements.forceCurveConcentric,
        mode,
        1,
        forceCurveIntensityValue
      );

      const eccentricModeValue = getActiveEccentricMode(
        eccentricOverrideEnabled,
        elements.eccentricSelect ? elements.eccentricSelect.value : null,
        mode
      );
      drawForceProfile(
        elements.forceCurveEccentric,
        eccentricModeValue,
        -1,
        forceCurveIntensityValue
      );
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
        const eccMode = getActiveEccentricMode(
          eccentricOverrideEnabled,
          elements.eccentricSelect ? elements.eccentricSelect.value : null,
          concentricMode
        );
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
        : 'Disabled';
      const normalizedMode = concentricLabel.trim().toLowerCase().replace(/\s+/g, '-');

      if (elements.forceLabel) {
        if (eccentricOverrideEnabled && elements.eccentricSelect) {
          const eccentricLabel =
            elements.eccentricSelect.options[elements.eccentricSelect.selectedIndex]
              .text;
          elements.forceLabel.textContent = `${concentricLabel} / ${eccentricLabel}`;
        } else {
          elements.forceLabel.textContent = concentricLabel;
        }
      }

      if (elements.forceCurveModePill) {
        elements.forceCurveModePill.textContent = concentricLabel;
        elements.forceCurveModePill.setAttribute('data-mode', normalizedMode);
        elements.forceCurveModePill.classList.toggle(
          'is-active',
          normalizedMode !== 'disabled' && normalizedMode !== 'linear'
        );
      }
      if (elements.eccentricTogglePill) {
        elements.eccentricTogglePill.textContent = 'Eccentric';
        elements.eccentricTogglePill.classList.toggle('is-active', eccentricOverrideEnabled);
        elements.eccentricTogglePill.setAttribute(
          'aria-pressed',
          eccentricOverrideEnabled ? 'true' : 'false'
        );
      }
      if (elements.eccentricModePill) {
        const eccentricLabel = elements.eccentricSelect
          ? elements.eccentricSelect.options[elements.eccentricSelect.selectedIndex].text
          : 'Linear';
        const eccentricMode = eccentricLabel.trim().toLowerCase().replace(/\s+/g, '-');
        elements.eccentricModePill.textContent = eccentricOverrideEnabled
          ? eccentricLabel
          : 'Linear';
        elements.eccentricModePill.setAttribute(
          'data-mode',
          eccentricOverrideEnabled ? eccentricMode : 'linear'
        );
        elements.eccentricModePill.classList.toggle('is-active', eccentricOverrideEnabled);
        elements.eccentricModePill.setAttribute(
          'aria-pressed',
          eccentricOverrideEnabled ? 'true' : 'false'
        );
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
      const baseRadius = Math.min(width, height) / 2 - 2;
      const startAngle = -Math.PI / 2;
      const strokeWidth = Math.max(14, baseRadius * 0.12);
      const radius = Math.max(0, baseRadius - strokeWidth / 2);

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

      const handleProgress = Math.max(
        0,
        Math.min(1, motor.baseResistance / MAX_RESISTANCE)
      );
      const handleAngle = startAngle + TWO_PI * handleProgress;
      const handleX = centerX + Math.cos(handleAngle) * radius;
      const handleY = centerY + Math.sin(handleAngle) * radius;
      const handleRadius = Math.max(10, radius * 0.08);
      ctx.save();
      ctx.globalAlpha = resistanceLocked ? 0.35 : 1;
      ctx.shadowBlur = resistanceLocked ? 0 : 18;
      ctx.shadowColor = palette.glow;
      ctx.fillStyle = palette.primary;
      ctx.beginPath();
      ctx.arc(handleX, handleY, handleRadius, 0, TWO_PI);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = palette.secondary;
      ctx.stroke();
      ctx.restore();

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
      const labelPadding = 60;
      const plotLeft = labelPadding;
      const availableWidth = circleX - circleRadius - plotLeft;
      const axisColor = 'rgba(220, 220, 220, 0.45)';
      const gridColor = 'rgba(220, 220, 220, 0.2)';
      const synced = motorsSyncedRef.current;
      const motorsToPlot = synced
        ? (() => {
            const leftMotor = motors.find((entry) => entry.id === 'left');
            const rightMotor = motors.find((entry) => entry.id === 'right');
            if (!leftMotor || !rightMotor) {
              return motors;
            }
            const len = Math.min(leftMotor.trail.length, rightMotor.trail.length);
            const combinedTrail = [];
            for (let i = 0; i < len; i += 1) {
              combinedTrail.push((leftMotor.trail[i] + rightMotor.trail[i]) / 2);
            }
            const shouldShowCombined = showLeftWave || showRightWave;
            return shouldShowCombined
              ? [
                  {
                    id: 'combined',
                    normalized: (leftMotor.normalized + rightMotor.normalized) / 2,
                    trail: combinedTrail,
                  },
                ]
              : [];
          })()
        : (() => {
            const leftMotor = motors.find((entry) => entry.id === 'left');
            const rightMotor = motors.find((entry) => entry.id === 'right');
            if (!leftMotor || !rightMotor) {
              return motors;
            }
            return [rightMotor, leftMotor].filter((motor) => {
              if (motor.id === 'left') return showLeftWave;
              if (motor.id === 'right') return showRightWave;
              return true;
            });
          })();
      let scaleMin = waveScaleMinRef.current || 0;
      let scaleMax = waveScaleMaxRef.current || MAX_TRAVEL_INCHES;
      const currentMaxTravel = Math.max(
        ...motorsToPlot.map((motor) => motor.normalized * MAX_TRAVEL_INCHES)
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
      const yLabels = Array.from({ length: 6 }, (_, idx) =>
        Number((scaleMin + scaleSpan * (idx / 5)).toFixed(1))
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
      ctx.font = '18px "SF Pro Display", "SF Pro Text", -apple-system, "Segoe UI", sans-serif';
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
        ctx.fillText(`${labelValue.toFixed(1)} in`, 8, y);
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

      motorsToPlot.forEach((motor) => {
        const headY =
          topPadding +
          (1 - scaleValue(motor.normalized * MAX_TRAVEL_INCHES)) *
            usableHeight;
        const palette = getMotorPalette(motor.id === 'combined' ? 'left' : motor.id);
        const fillAlpha =
          motor.id === 'right' ? 0.38 : motor.id === 'combined' ? 0.3 : 0.22;
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

      if (motorsSyncedRef.current) {
        const leftMotor = motors.find((entry) => entry.id === 'left');
        if (leftMotor && leftMotor.simSlider) {
          syncRightSimSlider(Number(leftMotor.simSlider.value));
        }
      }

      const mode = elements.forceSelect ? elements.forceSelect.value : 'linear';

      if (!motorsRunning) {
        lastSentResistanceRef.current.left.value = null;
        lastSentResistanceRef.current.right.value = null;
        lastSentResistanceRef.current.both.value = null;
      }

      motors.forEach((motor) => {
        if (motor.simSlider && motor.retractionActive) {
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

        const telemetryTravel = getTelemetryTravel(motor.id);
        const sliderDistance = Number.isFinite(telemetryTravel)
          ? telemetryTravel
          : motor.simSlider
            ? Number(motor.simSlider.value)
            : motor.normalized * MAX_TRAVEL_INCHES;
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

        const torqueEngaged = motorsRunning && motor.normalized >= engageThreshold;

        if (motorsRunning && setActive && !motor.engaged && torqueEngaged) {
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
        if (motorsRunning && torqueEngaged) {
          if (motorsSyncedRef.current) {
            if (motor.id === 'left') {
              const rightMotor = motors.find((entry) => entry.id === 'right');
              const combinedResistance = rightMotor
                ? (motor.currentResistance + rightMotor.currentResistance) / 2
                : motor.currentResistance;
              sendAutoResistance('both', 3, combinedResistance);
            }
          } else {
            const axis = motor.id === 'left' ? 1 : 2;
            sendAutoResistance(motor.id, axis, motor.currentResistance);
          }
        }

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
        if (motorsSyncedRef.current && motor.id === 'right') {
          const leftMotor = motors.find((entry) => entry.id === 'left');
          if (leftMotor && leftMotor.simSlider) {
            motor.simSlider.value = leftMotor.simSlider.value;
          }
          return;
        }
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
        if (motorsSyncedRef.current && motor.id === 'left') {
          syncRightSimSlider(sliderDistance, { updateTrail: true });
        }
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
      if (motor.simSlider) {
        motor.simSlider.addEventListener('input', handleSimInput);
        motor.simSlider.addEventListener('change', handleSimChange);
      }

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
    updateWaveLegendState();
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

    const handleLeftLegend = () => {
      showLeftWave = !showLeftWave;
      updateWaveLegendState();
      drawWaveCombined();
    };

    const handleRightLegend = () => {
      showRightWave = !showRightWave;
      updateWaveLegendState();
      drawWaveCombined();
    };

    if (elements.leftWaveLegend) {
      elements.leftWaveLegend.addEventListener('click', handleLeftLegend);
    }
    if (elements.rightWaveLegend) {
      elements.rightWaveLegend.addEventListener('click', handleRightLegend);
    }

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
      if (elements.pauseIcon) {
        elements.pauseIcon.removeEventListener('click', handlePauseToggle);
      }
      window.removeEventListener('dg:forceModeCycle', handleForceModePill);
      window.removeEventListener('dg:eccentricToggle', handleEccentricPill);
      window.removeEventListener('dg:eccentricModeCycle', handleEccentricModePill);

      if (elements.reset) {
        elements.reset.disabled = true;
      }

      if (elements.powerToggle) {
        elements.powerToggle.removeEventListener('click', handlePowerToggle);
      }

      if (elements.adsReset) {
        elements.adsReset.removeEventListener('click', handleAdsReset);
      }

      if (elements.syncMotors) {
        elements.syncMotors.removeEventListener('click', handleSyncMotors);
      }

      if (elements.leftWaveLegend) {
        elements.leftWaveLegend.removeEventListener('click', handleLeftLegend);
      }
      if (elements.rightWaveLegend) {
        elements.rightWaveLegend.removeEventListener('click', handleRightLegend);
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
        if (motor.simSlider) {
          motor.simSlider.removeEventListener('input', handler.handleSimInput);
          motor.simSlider.removeEventListener('change', handler.handleSimChange);
        }
        if (motor.setCableButton) {
          motor.setCableButton.removeEventListener('click', handler.handleSetCableClick);
        }
        if (motor.retractCableButton) {
          motor.retractCableButton.removeEventListener('click', handler.handleRetractClick);
        }
      });
    };
  
  }, [exerciseCatalog, exerciseVideos]);
}

export default useWorkoutEngine;
