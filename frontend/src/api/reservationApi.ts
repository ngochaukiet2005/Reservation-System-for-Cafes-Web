// src/api/reservationApi.ts
import axiosClient from './httpClient'; // Giả sử bạn có file này, hoặc dùng mock như dưới

export interface Reservation {
  id: number;
  customer_name: string;
  customer_phone: string;
  reservation_time: string;
  guest_count: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'OCCUPIED' | 'COMPLETED' | 'NO_SHOW';
  table_id?: number;
}

// DỮ LIỆU GIẢ (MOCK DATA) ĐỂ TEST
const MOCK_RESERVATIONS: Reservation[] = [
  { id: 1, customer_name: 'Nguyễn Văn A', customer_phone: '0901234567', reservation_time: '2025-12-09T19:30:00', guest_count: 4, status: 'PENDING' },
  { id: 2, customer_name: 'Trần Thị B', customer_phone: '0912345678', reservation_time: '2025-12-09T20:00:00', guest_count: 2, status: 'CONFIRMED', table_id: 5 },
];

export default {
  // 1. Đổi tên từ 'list' thành 'getReservations' để khớp với View
  getReservations(params?: any) {
    // Mock trả về dữ liệu
    return new Promise<{ data: Reservation[] }>((resolve) => {
      setTimeout(() => resolve({ data: MOCK_RESERVATIONS }), 500);
    });
    // Khi có backend thì dùng dòng này:
    // return axiosClient.get('/reservations', { params });
  },

  // 2. Hàm tạo đặt bàn (Giữ nguyên logic của bạn)
  createReservation(data: any) {
    return new Promise<{ data: Reservation }>((resolve) => {
      setTimeout(() => {
        const newReservation: Reservation = {
          id: Math.floor(Math.random() * 10000),
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          reservation_time: data.reservation_time,
          guest_count: data.guest_count,
          status: 'PENDING', // Mặc định là Pending
          table_id: data.table_id
        };
        console.log("[MOCK API] Created:", newReservation);
        resolve({ data: newReservation });
      }, 500);
    });
    // return axiosClient.post('/reservations', data);
  },

  // Các hàm khác (confirm, cancel, check-in...)
  confirmReservation(id: number) { return Promise.resolve({ data: { success: true } }); },
  cancelReservation(id: number, reason?: string) { return Promise.resolve({ data: { success: true } }); },
  checkIn(id: number) { return Promise.resolve({ data: { success: true } }); },
  checkOut(id: number) { return Promise.resolve({ data: { success: true } }); }
};