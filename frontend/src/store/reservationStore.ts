import { reactive } from 'vue';

export interface Reservation {
  id: number;
  guestName: string;
  phone: string;
  time: string;
  people: number;
  tableId: number | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
}

// Dữ liệu mẫu ban đầu
const MOCK_DATA: Reservation[] = [
  { id: 1, guestName: 'Nguyễn Văn A', phone: '0901234567', time: '2025-10-25T09:00', people: 2, tableId: null, status: 'PENDING' },
  { id: 2, guestName: 'Trần Thị B', phone: '0912345678', time: '2025-10-25T10:30', people: 4, tableId: 101, status: 'CONFIRMED' },
  { id: 3, guestName: 'Lê Văn C', phone: '0987654321', time: '2025-10-24T14:00', people: 2, tableId: 102, status: 'COMPLETED' },
];

export const reservationStore = reactive({
  reservations: [...MOCK_DATA] as Reservation[],
  isLoading: false,

  // Giả lập API lấy danh sách (Delay 500ms)
  async fetchReservations() {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        // Trong thực tế sẽ gọi API backend ở đây
        this.isLoading = false;
        resolve(this.reservations);
      }, 500);
    });
  },

  // Giả lập API tạo đặt bàn
  async createReservation(payload: Omit<Reservation, 'id' | 'status' | 'tableId'>) {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        const newId = this.reservations.length + 1;
        const newReservation: Reservation = {
          id: newId,
          ...payload,
          tableId: null, // Chưa gán bàn
          status: 'PENDING',
        };
        this.reservations.unshift(newReservation); // Thêm vào đầu danh sách
        this.isLoading = false;
        resolve(true);
      }, 800);
    });
  }
});