(function (root, factory) {
  const instance = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = instance;
  }
  if (root) {
    root.CoreMessageCodec = instance;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

  class Writer {
    constructor() {
      this.bytes = [];
    }

    tag(fieldNumber, wireType) {
      const tag = (fieldNumber << 3) | wireType;
      this.writeVarint(tag);
    }

    writeVarint(value) {
      let v = value >>> 0;
      while (v >= 0x80) {
        this.bytes.push((v & 0x7f) | 0x80);
        v >>>= 7;
      }
      this.bytes.push(v);
    }

    writeBool(value) {
      this.writeVarint(value ? 1 : 0);
    }

    writeFloat(value) {
      const buffer = new ArrayBuffer(4);
      new DataView(buffer).setFloat32(0, value, true);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < view.length; i += 1) {
        this.bytes.push(view[i]);
      }
    }

    writeDouble(value) {
      const buffer = new ArrayBuffer(8);
      new DataView(buffer).setFloat64(0, value, true);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < view.length; i += 1) {
        this.bytes.push(view[i]);
      }
    }

    writeString(value) {
      const encoded = textEncoder.encode(value);
      this.writeVarint(encoded.length);
      for (let i = 0; i < encoded.length; i += 1) {
        this.bytes.push(encoded[i]);
      }
    }

    finish() {
      return new Uint8Array(this.bytes).buffer;
    }
  }

  class Reader {
    constructor(buffer) {
      if (buffer instanceof ArrayBuffer) {
        this.bytes = new Uint8Array(buffer);
      } else if (ArrayBuffer.isView(buffer)) {
        this.bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      } else {
        throw new TypeError('Unsupported buffer type for Reader');
      }
      this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
      this.pos = 0;
      this.len = this.bytes.length;
    }

    eof() {
      return this.pos >= this.len;
    }

    readVarint() {
      let shift = 0;
      let result = 0;
      while (true) {
        if (this.pos >= this.len) {
          throw new RangeError('Varint extends beyond buffer length');
        }
        const byte = this.bytes[this.pos];
        this.pos += 1;
        result |= (byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) {
          return result >>> 0;
        }
        shift += 7;
      }
    }

    readBool() {
      return this.readVarint() !== 0;
    }

    readFloat() {
      const value = this.view.getFloat32(this.pos, true);
      this.pos += 4;
      return value;
    }

    readDouble() {
      const value = this.view.getFloat64(this.pos, true);
      this.pos += 8;
      return value;
    }

    readString() {
      const length = this.readVarint();
      const start = this.pos;
      this.pos += length;
      const slice = this.bytes.subarray(start, start + length);
      return textDecoder.decode(slice);
    }

    skipType(wireType) {
      switch (wireType) {
        case 0:
          this.readVarint();
          break;
        case 1:
          this.pos += 8;
          break;
        case 2: {
          const length = this.readVarint();
          this.pos += length;
          break;
        }
        case 5:
          this.pos += 4;
          break;
        default:
          throw new Error(`Unsupported wire type: ${wireType}`);
      }
    }

    readTag() {
      if (this.eof()) {
        return null;
      }
      const tag = this.readVarint();
      return {
        field: tag >>> 3,
        wire: tag & 0x7,
      };
    }
  }

  function hasValue(value) {
    return value !== undefined && value !== null;
  }

  const SessionCommand = {
    SESSION_COMMAND_UNSPECIFIED: 0,
    SESSION_COMMAND_POWER: 1,
    SESSION_COMMAND_WORKOUT: 2,
    SESSION_COMMAND_MOTORS: 3,
  };

  const FaultSeverity = {
    FAULT_SEVERITY_INFO: 0,
    FAULT_SEVERITY_WARNING: 1,
    FAULT_SEVERITY_CRITICAL: 2,
  };

  function encodeSessionControl(message) {
    const writer = new Writer();
    if (hasValue(message.command)) {
      writer.tag(1, 0);
      writer.writeVarint(message.command);
    }
    if (hasValue(message.active)) {
      writer.tag(2, 0);
      writer.writeBool(!!message.active);
    }
    if (hasValue(message.sequence)) {
      writer.tag(3, 0);
      writer.writeVarint(message.sequence >>> 0);
    }
    return writer.finish();
  }

  function decodeSessionControl(buffer) {
    const reader = new Reader(buffer);
    const message = {
      command: SessionCommand.SESSION_COMMAND_UNSPECIFIED,
      active: false,
      sequence: 0,
    };
    while (!reader.eof()) {
      const tag = reader.readTag();
      if (!tag) break;
      switch (tag.field) {
        case 1:
          message.command = reader.readVarint();
          break;
        case 2:
          message.active = reader.readBool();
          break;
        case 3:
          message.sequence = reader.readVarint();
          break;
        default:
          reader.skipType(tag.wire);
      }
    }
    return message;
  }

  function encodeProfile(message) {
    const writer = new Writer();
    if (hasValue(message.targetReps)) {
      writer.tag(1, 0);
      writer.writeVarint(message.targetReps >>> 0);
    }
    if (hasValue(message.targetSets)) {
      writer.tag(2, 0);
      writer.writeVarint(message.targetSets >>> 0);
    }
    if (hasValue(message.engagementInches)) {
      writer.tag(3, 5);
      writer.writeFloat(Number(message.engagementInches));
    }
    if (hasValue(message.forceMode)) {
      writer.tag(4, 2);
      writer.writeString(String(message.forceMode));
    }
    if (hasValue(message.eccentricMode)) {
      writer.tag(5, 2);
      writer.writeString(String(message.eccentricMode));
    }
    if (hasValue(message.forceIntensity)) {
      writer.tag(6, 5);
      writer.writeFloat(Number(message.forceIntensity));
    }
    return writer.finish();
  }

  function decodeProfile(buffer) {
    const reader = new Reader(buffer);
    const message = {
      targetReps: 0,
      targetSets: 0,
      engagementInches: 0,
      forceMode: 'linear',
      eccentricMode: 'eccentric',
      forceIntensity: 0,
    };
    while (!reader.eof()) {
      const tag = reader.readTag();
      if (!tag) break;
      switch (tag.field) {
        case 1:
          message.targetReps = reader.readVarint();
          break;
        case 2:
          message.targetSets = reader.readVarint();
          break;
        case 3:
          message.engagementInches = reader.readFloat();
          break;
        case 4:
          message.forceMode = reader.readString();
          break;
        case 5:
          message.eccentricMode = reader.readString();
          break;
        case 6:
          message.forceIntensity = reader.readFloat();
          break;
        default:
          reader.skipType(tag.wire);
      }
    }
    return message;
  }

  function encodeSetpoint(message) {
    const writer = new Writer();
    if (hasValue(message.leftBaseResistance)) {
      writer.tag(1, 5);
      writer.writeFloat(Number(message.leftBaseResistance));
    }
    if (hasValue(message.rightBaseResistance)) {
      writer.tag(2, 5);
      writer.writeFloat(Number(message.rightBaseResistance));
    }
    if (hasValue(message.leftTravelInches)) {
      writer.tag(3, 5);
      writer.writeFloat(Number(message.leftTravelInches));
    }
    if (hasValue(message.rightTravelInches)) {
      writer.tag(4, 5);
      writer.writeFloat(Number(message.rightTravelInches));
    }
    if (hasValue(message.setActive)) {
      writer.tag(5, 0);
      writer.writeBool(!!message.setActive);
    }
    if (hasValue(message.motorsEnabled)) {
      writer.tag(6, 0);
      writer.writeBool(!!message.motorsEnabled);
    }
    if (hasValue(message.powerOn)) {
      writer.tag(7, 0);
      writer.writeBool(!!message.powerOn);
    }
    return writer.finish();
  }

  function decodeSetpoint(buffer) {
    const reader = new Reader(buffer);
    const message = {
      leftBaseResistance: undefined,
      rightBaseResistance: undefined,
      leftTravelInches: undefined,
      rightTravelInches: undefined,
      setActive: undefined,
      motorsEnabled: undefined,
      powerOn: undefined,
    };
    while (!reader.eof()) {
      const tag = reader.readTag();
      if (!tag) break;
      switch (tag.field) {
        case 1:
          message.leftBaseResistance = reader.readFloat();
          break;
        case 2:
          message.rightBaseResistance = reader.readFloat();
          break;
        case 3:
          message.leftTravelInches = reader.readFloat();
          break;
        case 4:
          message.rightTravelInches = reader.readFloat();
          break;
        case 5:
          message.setActive = reader.readBool();
          break;
        case 6:
          message.motorsEnabled = reader.readBool();
          break;
        case 7:
          message.powerOn = reader.readBool();
          break;
        default:
          reader.skipType(tag.wire);
      }
    }
    return message;
  }

  function encodeTelemetry(message) {
    const writer = new Writer();
    if (hasValue(message.timestampMs)) {
      writer.tag(1, 1);
      writer.writeDouble(Number(message.timestampMs));
    }
    if (hasValue(message.leftResistance)) {
      writer.tag(2, 5);
      writer.writeFloat(Number(message.leftResistance));
    }
    if (hasValue(message.rightResistance)) {
      writer.tag(3, 5);
      writer.writeFloat(Number(message.rightResistance));
    }
    if (hasValue(message.leftTravelInches)) {
      writer.tag(4, 5);
      writer.writeFloat(Number(message.leftTravelInches));
    }
    if (hasValue(message.rightTravelInches)) {
      writer.tag(5, 5);
      writer.writeFloat(Number(message.rightTravelInches));
    }
    if (hasValue(message.leftNormalized)) {
      writer.tag(6, 5);
      writer.writeFloat(Number(message.leftNormalized));
    }
    if (hasValue(message.rightNormalized)) {
      writer.tag(7, 5);
      writer.writeFloat(Number(message.rightNormalized));
    }
    if (hasValue(message.leftReps)) {
      writer.tag(8, 0);
      writer.writeVarint(message.leftReps >>> 0);
    }
    if (hasValue(message.rightReps)) {
      writer.tag(9, 0);
      writer.writeVarint(message.rightReps >>> 0);
    }
    if (hasValue(message.totalReps)) {
      writer.tag(10, 0);
      writer.writeVarint(message.totalReps >>> 0);
    }
    if (hasValue(message.engagementInches)) {
      writer.tag(11, 5);
      writer.writeFloat(Number(message.engagementInches));
    }
    if (hasValue(message.forceMode)) {
      writer.tag(12, 2);
      writer.writeString(String(message.forceMode));
    }
    if (hasValue(message.eccentricMode)) {
      writer.tag(13, 2);
      writer.writeString(String(message.eccentricMode));
    }
    if (hasValue(message.forceIntensity)) {
      writer.tag(14, 5);
      writer.writeFloat(Number(message.forceIntensity));
    }
    if (hasValue(message.setActive)) {
      writer.tag(15, 0);
      writer.writeBool(!!message.setActive);
    }
    if (hasValue(message.workoutActive)) {
      writer.tag(16, 0);
      writer.writeBool(!!message.workoutActive);
    }
    if (hasValue(message.motorsEnabled)) {
      writer.tag(17, 0);
      writer.writeBool(!!message.motorsEnabled);
    }
    if (hasValue(message.powerOn)) {
      writer.tag(18, 0);
      writer.writeBool(!!message.powerOn);
    }
    if (hasValue(message.setComplete)) {
      writer.tag(19, 0);
      writer.writeBool(!!message.setComplete);
    }
    if (hasValue(message.setSequence)) {
      writer.tag(20, 0);
      writer.writeVarint(message.setSequence >>> 0);
    }
    return writer.finish();
  }

  function decodeTelemetry(buffer) {
    const reader = new Reader(buffer);
    const message = {
      timestampMs: 0,
      leftResistance: 0,
      rightResistance: 0,
      leftTravelInches: 0,
      rightTravelInches: 0,
      leftNormalized: 0,
      rightNormalized: 0,
      leftReps: 0,
      rightReps: 0,
      totalReps: 0,
      engagementInches: 0,
      forceMode: 'linear',
      eccentricMode: 'eccentric',
      forceIntensity: 0,
      setActive: false,
      workoutActive: false,
      motorsEnabled: false,
      powerOn: false,
      setComplete: false,
      setSequence: 0,
    };
    while (!reader.eof()) {
      const tag = reader.readTag();
      if (!tag) break;
      switch (tag.field) {
        case 1:
          message.timestampMs = reader.readDouble();
          break;
        case 2:
          message.leftResistance = reader.readFloat();
          break;
        case 3:
          message.rightResistance = reader.readFloat();
          break;
        case 4:
          message.leftTravelInches = reader.readFloat();
          break;
        case 5:
          message.rightTravelInches = reader.readFloat();
          break;
        case 6:
          message.leftNormalized = reader.readFloat();
          break;
        case 7:
          message.rightNormalized = reader.readFloat();
          break;
        case 8:
          message.leftReps = reader.readVarint();
          break;
        case 9:
          message.rightReps = reader.readVarint();
          break;
        case 10:
          message.totalReps = reader.readVarint();
          break;
        case 11:
          message.engagementInches = reader.readFloat();
          break;
        case 12:
          message.forceMode = reader.readString();
          break;
        case 13:
          message.eccentricMode = reader.readString();
          break;
        case 14:
          message.forceIntensity = reader.readFloat();
          break;
        case 15:
          message.setActive = reader.readBool();
          break;
        case 16:
          message.workoutActive = reader.readBool();
          break;
        case 17:
          message.motorsEnabled = reader.readBool();
          break;
        case 18:
          message.powerOn = reader.readBool();
          break;
        case 19:
          message.setComplete = reader.readBool();
          break;
        case 20:
          message.setSequence = reader.readVarint();
          break;
        default:
          reader.skipType(tag.wire);
      }
    }
    return message;
  }

  function encodeFault(message) {
    const writer = new Writer();
    if (hasValue(message.severity)) {
      writer.tag(1, 0);
      writer.writeVarint(message.severity >>> 0);
    }
    if (hasValue(message.code)) {
      writer.tag(2, 2);
      writer.writeString(String(message.code));
    }
    if (hasValue(message.description)) {
      writer.tag(3, 2);
      writer.writeString(String(message.description));
    }
    return writer.finish();
  }

  function decodeFault(buffer) {
    const reader = new Reader(buffer);
    const message = {
      severity: FaultSeverity.FAULT_SEVERITY_INFO,
      code: '',
      description: '',
    };
    while (!reader.eof()) {
      const tag = reader.readTag();
      if (!tag) break;
      switch (tag.field) {
        case 1:
          message.severity = reader.readVarint();
          break;
        case 2:
          message.code = reader.readString();
          break;
        case 3:
          message.description = reader.readString();
          break;
        default:
          reader.skipType(tag.wire);
      }
    }
    return message;
  }

  function createDefaultTelemetry() {
    return {
      timestampMs: performance.now(),
      leftResistance: 0,
      rightResistance: 0,
      leftTravelInches: 0,
      rightTravelInches: 0,
      leftNormalized: 0,
      rightNormalized: 0,
      leftReps: 0,
      rightReps: 0,
      totalReps: 0,
      engagementInches: 0,
      forceMode: 'linear',
      eccentricMode: 'eccentric',
      forceIntensity: 0,
      setActive: false,
      workoutActive: false,
      motorsEnabled: false,
      powerOn: false,
      setComplete: false,
      setSequence: 0,
    };
  }

  return {
    SessionCommand,
    FaultSeverity,
    encodeSessionControl,
    decodeSessionControl,
    encodeProfile,
    decodeProfile,
    encodeSetpoint,
    decodeSetpoint,
    encodeTelemetry,
    decodeTelemetry,
    encodeFault,
    decodeFault,
    createDefaultTelemetry,
  };
});
