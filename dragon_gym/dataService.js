const codec = window.CoreMessageCodec;

if (!codec) {
  throw new Error('CoreMessageCodec is required before initializing the data service.');
}

const {
  SessionCommand,
  encodeSessionControl,
  encodeProfile,
  encodeSetpoint,
  decodeTelemetry,
  decodeFault,
  createDefaultTelemetry,
} = codec;

export class CoreDataService {
  constructor(workerPath = 'coreWorker.js') {
    this.worker = new Worker(workerPath);
    this.telemetryListeners = new Set();
    this.faultListeners = new Set();
    this.latestTelemetry = createDefaultTelemetry();
    this.sequence = 0;
    this.profile = {
      targetReps: 12,
      targetSets: 3,
      engagementInches: 1.5,
      forceMode: 'linear',
      eccentricMode: 'eccentric',
      forceIntensity: 0.2,
    };
    this.setpoint = {
      leftBaseResistance: 120,
      rightBaseResistance: 120,
      leftTravelInches: 0,
      rightTravelInches: 0,
      setActive: false,
      motorsEnabled: true,
      powerOn: true,
    };

    this.worker.onmessage = (event) => {
      const { data } = event;
      if (!data || !data.type || !data.payload) {
        return;
      }
      switch (data.type) {
        case 'Telemetry': {
          const message = decodeTelemetry(data.payload);
          Object.assign(this.latestTelemetry, message);
          this.telemetryListeners.forEach((cb) => cb(this.latestTelemetry));
          break;
        }
        case 'Fault': {
          const fault = decodeFault(data.payload);
          this.faultListeners.forEach((cb) => cb(fault));
          break;
        }
        default:
          break;
      }
    };

    this.sendProfile();
    this.sendSetpoint();
    this.setPowerState(true);
    this.setMotorsEnabled(true);
    this.latestTelemetry.powerOn = true;
    this.latestTelemetry.motorsEnabled = true;
  }

  onTelemetry(callback) {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  onFault(callback) {
    this.faultListeners.add(callback);
    return () => this.faultListeners.delete(callback);
  }

  getSnapshot() {
    return this.latestTelemetry;
  }

  setPowerState(active) {
    this.setpoint.powerOn = !!active;
    this.sendSession(SessionCommand.SESSION_COMMAND_POWER, !!active);
    this.sendSetpoint();
  }

  setWorkoutState(active) {
    this.sendSession(SessionCommand.SESSION_COMMAND_WORKOUT, !!active);
  }

  setMotorsEnabled(active) {
    this.setpoint.motorsEnabled = !!active;
    this.sendSession(SessionCommand.SESSION_COMMAND_MOTORS, !!active);
    this.sendSetpoint();
  }

  setSetActive(active) {
    this.setpoint.setActive = !!active;
    this.sendSetpoint();
  }

  updateProfile(partial) {
    Object.assign(this.profile, partial);
    this.sendProfile();
  }

  updateSetpoint(partial) {
    Object.assign(this.setpoint, partial);
    this.sendSetpoint();
  }

  sendSession(command, active) {
    const payload = encodeSessionControl({
      command,
      active,
      sequence: ++this.sequence,
    });
    this.worker.postMessage({ type: 'SessionControl', payload }, [payload]);
  }

  sendProfile() {
    const payload = encodeProfile(this.profile);
    this.worker.postMessage({ type: 'Profile', payload }, [payload]);
  }

  sendSetpoint() {
    const payload = encodeSetpoint(this.setpoint);
    this.worker.postMessage({ type: 'Setpoint', payload }, [payload]);
  }
}
