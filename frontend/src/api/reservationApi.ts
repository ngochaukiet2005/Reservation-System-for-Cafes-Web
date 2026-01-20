// src/api/reservationApi.ts
import { httpClient } from './httpClient';

export interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  reservation_time: string;
  guest_count: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'OCCUPIED' | 'COMPLETED' | 'NO_SHOW' | 'REQUEST_CANCEL';
  table_id?: string;
  notes?: string;
  cancel_reason?: string;
  table?: { id: string; name: string };
}

export const reservationApi = {
  getReservations: async (params?: { status?: string; date?: string }) => {
    const res = await httpClient.get<Reservation[]>('/reservations', { params });
    return res.data;
  },

  createReservation: async (payload: Partial<Reservation>) => {
    const res = await httpClient.post<Reservation>('/reservations', payload);
    return res.data;
  },

  confirmReservation: async (id: string) => {
    const res = await httpClient.patch(`/reservations/${id}/confirm`);
    return res.data;
  },

  cancelReservation: async (id: string, reason?: string) => {
    const res = await httpClient.patch(`/reservations/${id}/cancel`, { reason });
    return res.data;
  },

  checkIn: async (id: string) => {
    const res = await httpClient.patch(`/reservations/${id}/check-in`);
    return res.data;
  },

  checkOut: async (id: string) => {
    const res = await httpClient.patch(`/reservations/${id}/check-out`);
    return res.data;
  },

  getLogs: async (id: string) => {
    const res = await httpClient.get(`/reservations/${id}/logs`);
    return res.data;
  },
};

export default reservationApi;