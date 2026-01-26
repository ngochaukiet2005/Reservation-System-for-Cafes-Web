import { io, Socket } from 'socket.io-client';

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  // Nếu socket đã kết nối, trả về luôn
  if (socket?.connected) {
    return socket;
  }

  // Nếu socket tồn tại nhưng không connected, disconnect và tạo mới
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  const token = sessionStorage.getItem('auth_token');
  socket = io(`${API_BASE_URL}/reservations`, {
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err?.message || err);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
