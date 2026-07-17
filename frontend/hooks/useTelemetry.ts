import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useTelemetry() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);

  useEffect(() => {
    const socketInstance = io(`${SOCKET_URL}/telemetry`);

    socketInstance.on('connect', () => {
      console.log('Connected to telemetry stream');
    });

    socketInstance.on('telemetryUpdate', (data) => {
      setTelemetry(data);
    });

    socketInstance.on('predictionResult', (data) => {
      setPrediction(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const requestPrediction = (assetId: string) => {
    if (socket) {
      socket.emit('requestPrediction', assetId);
    }
  };

  return { telemetry, prediction, requestPrediction };
}
