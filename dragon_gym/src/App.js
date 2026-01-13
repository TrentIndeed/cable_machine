import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sendCommand } from './api/sendCommand';
import {
  COMMAND_TYPES,
  FONT_OPTIONS,
} from './constants/appConstants';
import BottomNav from './components/BottomNav';
import { useTelemetry } from './hooks/useTelemetry';
import useWorkoutEngine from './hooks/useWorkoutEngine';
import HomePage from './pages/HomePage';
import ProgramsPage from './pages/ProgramsPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

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
  const [motorsSyncedState, setMotorsSyncedState] = useState(false);
  const [syncHidden, setSyncHidden] = useState(false);
  const [commandResistance, setCommandResistance] = useState(1);
  const [commandStatus, setCommandStatus] = useState('idle');
  const [commandMessage, setCommandMessage] = useState('');
  const [activePage, setActivePage] = useState('home');
  const [uiFont, setUiFont] = useState('sf');

  const forceCurveModeRef = useRef(forceCurveMode);
  const forceCurveIntensityRef = useRef(forceCurveIntensity);
  const eccentricModeRef = useRef(eccentricMode);
  const eccentricEnabledRef = useRef(eccentricEnabled);
  const waveScaleMaxRef = useRef(10);
  const waveScaleMinRef = useRef(0);
  const waveScaleSamplesRef = useRef([]);

  const workoutStateRef = useRef(null);
  const startToggleRef = useRef(null);
  const startToggleHomeSlotRef = useRef(null);
  const pauseIconRef = useRef(null);
  const setToggleRef = useRef(null);
  const setControlRowRef = useRef(null);
  const setControlGroupRef = useRef(null);
  const simPanelRef = useRef(null);
  const resetRef = useRef(null);
  const setStatusRef = useRef(null);
  const repStatusRef = useRef(null);
  const waveRepRef = useRef(null);
  const waveRepBounceTimeoutRef = useRef(null);
  const repCurveLabelRef = useRef(null);
  const leftWaveLegendRef = useRef(null);
  const rightWaveLegendRef = useRef(null);
  const leftStatusRepsRef = useRef(null);
  const rightStatusRepsRef = useRef(null);
  const messageRef = useRef(null);
  const forceSelectRef = useRef(null);
  const forceDescriptionRef = useRef(null);
  const forceLabelRef = useRef(null);
  const forceCurveConcentricRef = useRef(null);
  const forceCurveEccentricRef = useRef(null);
  const forceCurveModePillRef = useRef(null);
  const eccentricTogglePillRef = useRef(null);
  const eccentricModePillRef = useRef(null);
  const eccentricToggleRef = useRef(null);
  const eccentricPanelRef = useRef(null);
  const eccentricSelectRef = useRef(null);
  const forceCurveIntensityRefElement = useRef(null);
  const forcePanelRef = useRef(null);
  const forceLockHintRef = useRef(null);
  const setCompleteOverlayRef = useRef(null);
  const setCompleteFireworksRef = useRef(null);
  const setCompleteSuccessRef = useRef(null);
  const powerToggleRef = useRef(null);
  const adsResetRef = useRef(null);
  const syncMotorsRef = useRef(null);
  const axisSelectRef = useRef(null);
  const leftResistanceValueRef = useRef(0);
  const rightResistanceValueRef = useRef(0);
  const motorsSyncedRef = useRef(false);
  const telemetryConnectedRef = useRef(false);
  const telemetryRef = useRef(null);
  const lastSentResistanceRef = useRef({
    left: { value: null, time: 0 },
    right: { value: null, time: 0 },
    both: { value: null, time: 0 },
  });
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

  useEffect(() => {
    const selected = FONT_OPTIONS.find((option) => option.value === uiFont);
    if (selected) {
      document.documentElement.style.setProperty('--ui-font', selected.stack);
    }
  }, [uiFont]);

  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  const telemetryConnected =
    typeof telemetry?.Connected === 'boolean'
      ? telemetry.Connected
      : telemetryStatus === 'connected';
  const telemetryFault = Boolean(telemetry?.Fault);
  const telemetryCmdStatus = Number.isFinite(telemetry?.CmdStatus)
    ? telemetry.CmdStatus
    : '--';
  const resistanceLabel = Number.isFinite(commandResistance)
    ? Math.round(commandResistance)
    : 0;
  const homeRefs = {
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
    messageRef,
    repCurveLabelRef,
    leftStatusRepsRef,
    rightStatusRepsRef,
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
    setCompleteOverlayRef,
    setCompleteFireworksRef,
    setCompleteSuccessRef,
    powerToggleRef,
    adsResetRef,
    syncMotorsRef,
    leftGaugeRef,
    leftSimRef,
    leftCurrentResistanceRef,
    leftBaseResistanceRef,
    leftEngageDisplayRef,
    leftSetCableLengthRef,
    leftRetractCableRef,
    leftCableDistanceRef,
    rightGaugeRef,
    rightSimRef,
    rightCurrentResistanceRef,
    rightBaseResistanceRef,
    rightEngageDisplayRef,
    rightSetCableLengthRef,
    rightRetractCableRef,
    rightCableDistanceRef,
    waveCombinedRef,
    logListRef,
    exerciseSelectRef,
    exerciseTitleRef,
  };
  const engineRefs = {
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
    leftWaveLegendRef,
    rightWaveLegendRef,
    messageRef,
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
    setCompleteOverlayRef,
    setCompleteFireworksRef,
    setCompleteSuccessRef,
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
  };


  const handleAxisChange = (event) => {
    const nextMask = Number(event.target.value);
    setAxisMask(nextMask);
    setCommandResistance(Math.round(getAppliedResistance(nextMask)));
  };

  const handleResistanceChange = (event) => {
    setCommandResistance(Number(event.target.value));
  };

  const getAppliedResistance = (mask) => {
    const left = leftResistanceValueRef.current;
    const right = rightResistanceValueRef.current;
    if (mask === 2) {
      return right;
    }
    if (mask === 3) {
      return (left + right) / 2;
    }
    return left;
  };

  const handleApplyResistance = () => {
    const applied = getAppliedResistance(axisMask);
    setCommandResistance(Math.round(applied));
    handleCommand(COMMAND_TYPES.SET_RESISTANCE, {
      param1: Number.isFinite(applied) ? applied : 0,
    });
  };

  useEffect(() => {
    telemetryConnectedRef.current = telemetryConnected;
  }, [telemetryConnected]);

  useEffect(() => {
    if (!motorsSyncedState) {
      setSyncHidden(false);
      return undefined;
    }
    const hideTimer = setTimeout(() => {
      setSyncHidden(true);
    }, 260);
    return () => {
      clearTimeout(hideTimer);
    };
  }, [motorsSyncedState]);

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

  useWorkoutEngine({
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
    refs: engineRefs,
  });

  return (
    <>
      <svg className="sr-only" width="0" height="0" aria-hidden="true">
        <defs>
          <clipPath id="concaveTopClip" clipPathUnits="objectBoundingBox">
            <path d="M0,0.08 Q0,0 0.08,0 C0.22,0 0.35,0.03 0.5,0.03 S0.78,0 0.92,0 Q1,0 1,0.08 L1,1 L0,1 Z" />
          </clipPath>
        </defs>
      </svg>
      <HomePage
        isActive={activePage === 'home'}
        motorsSyncedState={motorsSyncedState}
        syncHidden={syncHidden}
        telemetryConnected={telemetryConnected}
        forceCurveOpen={forceCurveOpen}
        setForceCurveOpen={setForceCurveOpen}
        selectorOpen={selectorOpen}
        setSelectorOpen={setSelectorOpen}
        exerciseCatalog={exerciseCatalog}
        videoSrc={videoSrc}
        refs={homeRefs}
      />
      <ProgramsPage
        isActive={activePage === 'programs'}
        refs={homeRefs}
        exerciseCatalog={exerciseCatalog}
        selectorOpen={selectorOpen}
        setSelectorOpen={setSelectorOpen}
        videoSrc={videoSrc}
      />
      <SettingsPage
        isActive={activePage === 'settings'}
        uiFont={uiFont}
        onFontChange={(event) => setUiFont(event.target.value)}
        onBack={() => setActivePage('home')}
        telemetryConnected={telemetryConnected}
        telemetryFault={telemetryFault}
        telemetryCmdStatus={telemetryCmdStatus}
        commandStatus={commandStatus}
        commandMessage={commandMessage}
      />
      <BottomNav activePage={activePage} onNavigate={setActivePage} />
    </>
  );
}

export default App;
