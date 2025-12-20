import { reactive } from 'vue';

export interface Table {
  id: number;
  name: string;
  capacity: number;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE';
  type: 'Indoor' | 'Outdoor' | 'VIP';
}

export interface Reservation {
  id: number;
  guestName: string;
  phone: string;
  time: string; // ISO String
  people: number;
  tableId: number | null;
  tableName?: string;
  // [CẬP NHẬT] Thêm trạng thái REQUEST_CANCEL
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' | 'REQUEST_CANCEL';
  // [MỚI] Các trường lưu lý do
  cancellationReason?: string; // Lý do khách hủy
  adminResponse?: string;      // Phản hồi từ Staff (ví dụ: Từ chối hủy vì đã lên món)
}

// --- DỮ LIỆU GIẢ LẬP: 20 BÀN (GIỮ NGUYÊN) ---
const MOCK_TABLES: Table[] = [
  { id: 101, name: 'Bàn 01', capacity: 2, status: 'AVAILABLE', type: 'Indoor' },
  { id: 102, name: 'Bàn 02', capacity: 2, status: 'AVAILABLE', type: 'Indoor' },
  { id: 103, name: 'Bàn 03', capacity: 4, status: 'AVAILABLE', type: 'Indoor' },
  { id: 104, name: 'Bàn 04', capacity: 4, status: 'AVAILABLE', type: 'Indoor' },
  { id: 105, name: 'Bàn 05', capacity: 4, status: 'AVAILABLE', type: 'Indoor' },
  { id: 106, name: 'Bàn 06', capacity: 6, status: 'AVAILABLE', type: 'Indoor' },
  { id: 107, name: 'Bàn 07', capacity: 6, status: 'AVAILABLE', type: 'Indoor' },
  { id: 108, name: 'Bàn 08', capacity: 6, status: 'AVAILABLE', type: 'Indoor' },
  { id: 109, name: 'Bàn 09', capacity: 2, status: 'AVAILABLE', type: 'Indoor' },
  { id: 110, name: 'Bàn 10', capacity: 6, status: 'AVAILABLE', type: 'Indoor' },
  { id: 111, name: 'Bàn 11', capacity: 2, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 112, name: 'Bàn 12', capacity: 4, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 113, name: 'Bàn 13', capacity: 4, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 114, name: 'Bàn 14', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 115, name: 'Bàn 15', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 116, name: 'Bàn 16', capacity: 4, status: 'MAINTENANCE', type: 'Outdoor' },
  { id: 117, name: 'Bàn 17', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 118, name: 'Bàn 18', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 119, name: 'Bàn 19', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 120, name: 'Bàn 20', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
];

// [MỚI] Dữ liệu lịch sử giả lập phong phú hơn để test
const MOCK_HISTORY: Reservation[] = [
  { id: 901, guestName: 'Nguyễn Văn A', phone: '0901234567', time: '2023-11-20T09:00:00', people: 2, tableId: 105, tableName: 'Bàn 05', status: 'COMPLETED' },
  { id: 902, guestName: 'Trần Thị B', phone: '0901234567', time: '2023-12-15T14:30:00', people: 4, tableId: 112, tableName: 'Bàn 12', status: 'PENDING' },
  { id: 903, guestName: 'Lê Văn C', phone: '0901234567', time: '2023-12-10T19:00:00', people: 2, tableId: 102, tableName: 'Bàn 02', status: 'CANCELLED' },
  // Đơn đã xác nhận (Test Request Cancel)
  { id: 904, guestName: 'Phạm Văn D', phone: '0901234567', time: new Date().toISOString(), people: 4, tableId: 114, tableName: 'Bàn 14', status: 'CONFIRMED' },
  // Đơn đang chờ Staff duyệt hủy
  { id: 905, guestName: 'Hoàng Thị E', phone: '0933111222', time: '2023-12-25T18:00:00', people: 6, tableId: 111, tableName: 'Bàn 11', status: 'REQUEST_CANCEL', cancellationReason: 'Bận đột xuất' },
  // Đơn Staff từ chối hủy (Vẫn giữ status cũ hoặc CONFIRMED, có kèm adminResponse)
  { id: 906, guestName: 'Nguyễn F', phone: '0911222333', time: '2023-12-24T20:00:00', people: 2, tableId: 101, tableName: 'Bàn 01', status: 'CONFIRMED', adminResponse: 'Đã chuẩn bị nguyên liệu tiệc, không thể hủy sát giờ.' },
];

export const reservationStore = reactive({
  tables: [] as Table[],
  reservations: [] as Reservation[],
  isLoading: false,

  // --- CÁC HÀM CŨ GIỮ NGUYÊN ---
  async fetchTablesByTime(date: string, time: string) {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentTables = MOCK_TABLES.map(t => ({ 
          ...t, 
          status: t.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE' 
        }));

        if (time === '19:00' || time === '20:00') {
           const busyTableIds = [102, 105, 113, 117, 119]; 
           // @ts-ignore
           currentTables.forEach(t => {
             if (busyTableIds.includes(t.id)) t.status = 'RESERVED';
           });
        }
        
        // @ts-ignore
        this.tables = currentTables;
        this.isLoading = false;
        resolve(this.tables);
      }, 500); 
    });
  },

  async createReservation(payload: any) {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        const newRes: Reservation = {
          id: Date.now(),
          ...payload,
          status: 'PENDING'
        };
        this.reservations.unshift(newRes); 
        this.isLoading = false;
        resolve(newRes);
      }, 1000);
    });
  },
  
  async fetchReservations() { 
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.reservations.length === 0) {
            this.reservations = [...MOCK_HISTORY];
        }
        this.isLoading = false;
        resolve(this.reservations);
      }, 500);
    });
  },

  // --- [UPDATED] LOGIC HỦY MỚI ---
  async cancelReservation(id: number, reason: string = '') {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        const target = this.reservations.find(r => r.id === id);
        if (target) {
          // 1. Nếu đơn PENDING -> Hủy luôn
          if (target.status === 'PENDING') {
            target.status = 'CANCELLED';
            target.cancellationReason = reason;
          } 
          // 2. Nếu đơn CONFIRMED -> Chuyển sang REQUEST_CANCEL
          else if (target.status === 'CONFIRMED') {
            target.status = 'REQUEST_CANCEL';
            target.cancellationReason = reason;
            console.log(`[STORE] Đã gửi yêu cầu hủy cho đơn #${id}. Lý do: ${reason}`);
          }
        }
        this.isLoading = false;
        resolve(true);
      }, 800);
    });
  }
});