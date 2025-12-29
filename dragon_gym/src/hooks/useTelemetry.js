import { useEffect, useRef, useState } from 'react';

function getDefaultWsUrl() {
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }
  if (process.env.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE.replace(/^http/, 'ws') + '/ws';
  }
  if (typeof window === 'undefined') {
    return 'ws://localhost:3001/ws';
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.hostname}:3001/ws`;
}

export function useTelemetry(url = getDefaultWsUrl()) {
  const [telemetry, setTelemetry] = useState({});
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectDelayRef = useRef(500);

  useEffect(() => {
    let canceled = false;

    const cleanupSocket = () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (reconnectTimerRef.current) {
        return;
      }
      const delay = reconnectDelayRef.current;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.7, 8000);
        connect();
      }, delay);
    };

    const connect = () => {
      if (canceled) {
        return;
      }
      cleanupSocket();
      setStatus('connecting');
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectDelayRef.current = 500;
        setStatus('connected');
        setError(null);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          setTelemetry(payload);
        } catch (err) {
          setError('Telemetry parse error');
        }
      };

      socket.onerror = () => {
        setError('WebSocket error');
      };

      socket.onclose = () => {
        if (canceled) {
          return;
        }
        setStatus('disconnected');
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      canceled = true;
      cleanupSocket();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [url]);

  return { telemetry, status, error };
}
