const http = require('http');
const path = require('path');

const cors = require('cors');
const express = require('express');
const { Client } = require('ads-client');
const { WebSocket, WebSocketServer } = require('ws');

const envPath = process.env.ADS_ENV_PATH || path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('[Server] Unhandled rejection:', error);
});

const {
  AMS_NET_ID,
  ADS_HOST = '127.0.0.1',
  ADS_PORT = '851',
  SERVER_PORT = '3001',
} = process.env;

const COMMAND_TYPE_MAP = {
  Enable: 1,
  Disable: 2,
  Stop: 3,
  SetResistance: 4,
  SetForce: 5,
  Reset: 6,
  Retract: 7,
};

const ADS_CONFIG = {
  targetAmsNetId: AMS_NET_ID,
  targetAdsPort: Number(ADS_PORT),
  routerAddress: ADS_HOST,
  routerTcpPort: 48898,
  timeoutDelay: 2000,
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  console.log('[WS] Upgrade request:', req.url);
  if (req.url !== '/ws') {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

let adsClient = null;
let adsConnecting = false;
let adsConnected = false;
let adsDisconnecting = false;
let reconnectDelay = 500;
let reconnectTimer = null;
let seqCounter = 0;
let telemetrySymbolMissingLogged = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextSeq() {
  seqCounter = (seqCounter + 1) >>> 0;
  return seqCounter;
}

function isAdsConfigured() {
  return Boolean(AMS_NET_ID && ADS_HOST && ADS_PORT);
}

function createAdsClient() {
  return new Client(ADS_CONFIG);
}

function scheduleReconnect() {
  if (reconnectTimer) {
    return;
  }
  const delay = reconnectDelay;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectAds().catch(() => {});
  }, delay);
  reconnectDelay = Math.min(reconnectDelay * 1.7, 8000);
}

function markDisconnected(error) {
  if (adsDisconnecting) {
    return;
  }
  adsConnected = false;
  if (adsClient) {
    adsDisconnecting = true;
    try {
      const disconnectResult = adsClient.disconnect();
      if (disconnectResult && typeof disconnectResult.catch === 'function') {
        disconnectResult.catch(() => {});
      }
    } catch (err) {
      // Best-effort disconnect.
    } finally {
      adsDisconnecting = false;
      adsClient = null;
    }
  }
  if (error) {
    console.error('[ADS] Disconnected:', error.message || error);
  }
  scheduleReconnect();
}

async function connectAds() {
  if (!isAdsConfigured()) {
    console.warn('[ADS] Missing AMS_NET_ID, ADS_HOST, or ADS_PORT.');
    return false;
  }
  if (adsConnected || adsConnecting) {
    return adsConnected;
  }

  adsConnecting = true;
  if (!adsClient) {
    adsClient = createAdsClient();
    if (adsClient.on) {
      adsClient.on('error', markDisconnected);
      adsClient.on('disconnect', markDisconnected);
    }
  }

  try {
    await adsClient.connect();
    adsConnected = true;
    reconnectDelay = 500;
    console.log('[ADS] Connected.');
  } catch (error) {
    markDisconnected(error);
  } finally {
    adsConnecting = false;
  }

  return adsConnected;
}

async function ensureAds() {
  if (adsConnected) {
    return true;
  }
  await connectAds();
  return adsConnected;
}

async function readSymbolValue(symbolName) {
  if (!adsConnected || !adsClient) {
    return null;
  }
  try {
    const result = await adsClient.readSymbol(symbolName);
    if (result && Object.prototype.hasOwnProperty.call(result, 'value')) {
      return result.value;
    }
    return result;
  } catch (error) {
    const message = error?.message || '';
    if (message.includes('Reading symbol info failed')) {
      if (!telemetrySymbolMissingLogged) {
        telemetrySymbolMissingLogged = true;
        console.warn(
          '[ADS] Symbol lookup failed for GVL_UI.Telemetry. Ensure the PLC is in Run and symbols are generated.'
        );
      }
      return null;
    }
    markDisconnected(error);
    return null;
  }
}

async function writeSymbolValue(symbolName, payload) {
  if (!adsConnected || !adsClient) {
    throw new Error('ADS not connected');
  }
  try {
    await adsClient.writeSymbol(symbolName, payload, true);
  } catch (error) {
    markDisconnected(error);
    throw error;
  }
}

function normalizeCommandType(type) {
  if (typeof type === 'number' && Number.isFinite(type)) {
    return Math.trunc(type);
  }
  if (typeof type === 'string' && COMMAND_TYPE_MAP[type]) {
    return COMMAND_TYPE_MAP[type];
  }
  return null;
}

function validateCommand(body) {
  const errors = [];
  const normalizedType = normalizeCommandType(body?.type);
  if (normalizedType === null) {
    errors.push('Invalid command type.');
  }
  const axisMask = body?.axisMask;
  if (!Number.isInteger(axisMask) || axisMask < 0 || axisMask > 255) {
    errors.push('Axis mask must be a byte (0-255).');
  }
  const param1 = body?.param1;
  const param2 = body?.param2;
  if (param1 !== undefined && !Number.isFinite(param1)) {
    errors.push('Param1 must be a number when provided.');
  }
  if (param2 !== undefined && !Number.isFinite(param2)) {
    errors.push('Param2 must be a number when provided.');
  }
  return {
    errors,
    normalizedType,
    axisMask,
    param1: Number.isFinite(param1) ? param1 : 0,
    param2: Number.isFinite(param2) ? param2 : 0,
  };
}

async function readAckState() {
  const ackSeqDirect = await readSymbolValue('GVL_UI.Cmd.AckSeq');
  const statusDirect = await readSymbolValue('GVL_UI.Cmd.Status');
  if (Number.isFinite(ackSeqDirect)) {
    return { ackSeq: ackSeqDirect, status: statusDirect };
  }

  const cmdStruct = await readSymbolValue('GVL_UI.Cmd');
  if (cmdStruct && typeof cmdStruct === 'object') {
    const ackSeq = cmdStruct.AckSeq;
    const status = cmdStruct.Status;
    if (Number.isFinite(ackSeq)) {
      return { ackSeq, status };
    }
  }

  const telemetry = await readSymbolValue('GVL_UI.Telemetry');
  if (telemetry && typeof telemetry === 'object') {
    const ackSeq = telemetry.AckSeq;
    const status = telemetry.CmdStatus || telemetry.Status;
    if (Number.isFinite(ackSeq)) {
      return { ackSeq, status };
    }
  }

  return { ackSeq: null, status: null };
}

async function waitForAck(seq, timeoutMs = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { ackSeq, status } = await readAckState();
    if (Number.isFinite(ackSeq) && ackSeq >= seq) {
      return { ackSeq, status, timedOut: false };
    }
    await sleep(50);
  }
  return { ackSeq: null, status: null, timedOut: true };
}

app.post('/api/cmd', async (req, res) => {
  const validation = validateCommand(req.body);
  if (validation.errors.length) {
    res.status(400).json({ ok: false, errors: validation.errors });
    return;
  }

  const isReady = await ensureAds();
  if (!isReady) {
    res.status(503).json({ ok: false, error: 'ADS not connected' });
    return;
  }

  const seq = nextSeq();
  const payload = {
    Seq: seq,
    CmdType: validation.normalizedType,
    AxisMask: validation.axisMask,
    Param1: validation.param1,
    Param2: validation.param2,
  };

  try {
    await writeSymbolValue('GVL_UI.Cmd', payload);
    const ack = await waitForAck(seq);
    res.json({ ok: true, seq, ack });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || 'Command failed' });
  }
});

wss.on('connection', (socket, req) => {
  console.log('[WS] Client connected:', req?.url || '');
  socket.send(JSON.stringify({ Connected: adsConnected }));
});

const TELEMETRY_INTERVAL_MS = 1000 / 30;

setInterval(async () => {
  if (wss.clients.size === 0) {
    return;
  }
  if (!adsConnected) {
    await connectAds();
  }
  const telemetry = (await readSymbolValue('GVL_UI.Telemetry')) || { Connected: false };
  const payload = JSON.stringify(telemetry);
  wss.clients.forEach((clientSocket) => {
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(payload);
    }
  });
}, TELEMETRY_INTERVAL_MS);

setInterval(() => {
  if (!adsConnected && !adsConnecting) {
    connectAds().catch(() => {});
  }
}, 2000);

const serverPortNumber = Number(SERVER_PORT) || 3001;

server.listen(serverPortNumber, () => {
  console.log(`[Server] Listening on http://localhost:${serverPortNumber}`);
});
