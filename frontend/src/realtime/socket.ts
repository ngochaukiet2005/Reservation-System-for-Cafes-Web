import { io, Socket } from 'socket.io-client';

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && socket.connected) return socket;

  const token = sessionStorage.getItem('auth_token');
  socket = io(`${API_BASE_URL}/reservations`, {
    transports: ['websocket'],
    auth: { token },
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect_error', err?.message || err);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
