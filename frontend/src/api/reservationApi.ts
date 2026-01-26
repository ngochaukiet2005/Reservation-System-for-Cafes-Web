// src/api/reservationApi.ts
import { httpClient } from './httpClient';

export interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  reservation_time: string;
  guest_count: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'OCCUPIED' | 'COMPLETED' | 'NO_SHOW' | 'REQUEST_CANCEL' | 'EXPIRED';
  table_id?: string;
  notes?: string;
  cancel_reason?: string;
  expires_at?: string;
  table?: { id: string; name: string };
}

export const reservationApi = {
  getReservations: async (params?: { status?: string; date?: string }) => {
    const res = await httpClient.get<{ message: string; data: Reservation[] }>('/reservations', { params });
    return res.data.data || []; // Extract array from { message, data }
  },

  getTableReservations: async (tableId: string, date?: string) => {
    const params = date ? { date } : {};
    const res = await httpClient.get<{ 
      message: string; 
      data: { 
        reservations: Reservation[]; 
        earliestTime?: string; 
        lockedAfter?: boolean;
      } 
    }>(`/reservations/table/${tableId}`, { params });
    return res.data.data;
  },

  createReservation: async (payload: Partial<Reservation>) => {
    const res = await httpClient.post<{ message: string; data: Reservation }>('/reservations', payload);
    return res.data.data; // Extract single object from wrapper
  },

  confirmReservation: async (id: string) => {
    const res = await httpClient.patch<{ message: string; data: Reservation }>(`/reservations/${id}/confirm`);
    return res.data.data; // Extract single object from wrapper
  },

  cancelReservation: async (id: string, reason?: string) => {
    const res = await httpClient.patch<{ message: string; data: Reservation }>(`/reservations/${id}/cancel`, { reason });
    return res.data.data; // Extract single object from wrapper
  },

  checkIn: async (id: string) => {
    const res = await httpClient.patch<{ message: string; data: Reservation }>(`/reservations/${id}/check-in`);
    return res.data.data; // Extract single object from wrapper
  },

  checkOut: async (id: string) => {
    const res = await httpClient.patch<{ message: string; data: Reservation }>(`/reservations/${id}/check-out`);
    return res.data.data; // Extract single object from wrapper
  },

  getLogs: async (id: string) => {
    const res = await httpClient.get(`/reservations/${id}/logs`);
    return res.data;
  },

  approveCancelRequest: async (id: string) => {
    const res = await httpClient.patch<{ message: string; data: Reservation }>(`/reservations/${id}/approve-cancel`);
    return res.data.data;
  },

  rejectCancelRequest: async (id: string, reason: string) => {
    const res = await httpClient.patch<{ message: string; data: Reservation }>(`/reservations/${id}/reject-cancel`, { reason });
    return res.data.data;
  },
};

export default reservationApi;