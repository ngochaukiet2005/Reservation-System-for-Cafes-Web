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
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
}

// --- DỮ LIỆU GIẢ LẬP: 20 BÀN ---
const MOCK_TABLES: Table[] = [
  // Khu vực Trong nhà (Indoor) - 10 bàn
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

  // Khu vực Sân vườn (Outdoor) - 6 bàn
  { id: 111, name: 'Bàn 11', capacity: 2, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 112, name: 'Bàn 12', capacity: 4, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 113, name: 'Bàn 13', capacity: 4, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 114, name: 'Bàn 14', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 115, name: 'Bàn 15', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 116, name: 'Bàn 16', capacity: 4, status: 'MAINTENANCE', type: 'Outdoor' }, // Đang bảo trì

  // Khu vực VIP - 4 bàn
  { id: 117, name: 'Bàn 17', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 118, name: 'Bàn 18', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 119, name: 'Bàn 19', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 120, name: 'Bàn 20', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
];

// [MỚI] Dữ liệu lịch sử giả lập
const MOCK_HISTORY: Reservation[] = [
  { id: 901, guestName: 'Nguyễn Văn A', phone: '0901234567', time: '2023-11-20T09:00:00', people: 2, tableId: 105, tableName: 'Bàn 05', status: 'COMPLETED' },
  { id: 902, guestName: 'Nguyễn Văn A', phone: '0901234567', time: '2023-12-15T14:30:00', people: 4, tableId: 112, tableName: 'Bàn 12', status: 'PENDING' },
  { id: 903, guestName: 'Nguyễn Văn A', phone: '0901234567', time: '2023-12-10T19:00:00', people: 2, tableId: 102, tableName: 'Bàn 02', status: 'CANCELLED' },
  // Thêm một đơn CONFIRMED để test tính năng nhập lý do hủy
  { id: 904, guestName: 'Nguyễn Văn A', phone: '0901234567', time: new Date().toISOString(), people: 4, tableId: 114, tableName: 'Bàn 14', status: 'CONFIRMED' },
];

export const reservationStore = reactive({
  tables: [] as Table[],
  reservations: [] as Reservation[],
  isLoading: false,

  // Giả lập API lấy danh sách bàn theo giờ
  async fetchTablesByTime(date: string, time: string) {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        // 1. Reset trạng thái bàn về AVAILABLE (trừ bàn đang bảo trì)
        const currentTables = MOCK_TABLES.map(t => ({ 
          ...t, 
          status: t.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE' 
        }));

        // 2. Logic Mock: Giả sử giờ cao điểm (19:00, 20:00) sẽ có một số bàn bị đặt
        if (time === '19:00' || time === '20:00') {
           const busyTableIds = [102, 105, 113, 117, 119]; // Danh sách ID bàn bận
           // @ts-ignore
           currentTables.forEach(t => {
             if (busyTableIds.includes(t.id)) t.status = 'RESERVED';
           });
        }
        
        // @ts-ignore
        this.tables = currentTables;
        this.isLoading = false;
        resolve(this.tables);
      }, 500); // Giả lập độ trễ mạng 0.5s
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
        this.reservations.unshift(newRes); // Thêm vào đầu danh sách
        this.isLoading = false;
        resolve(newRes);
      }, 1000);
    });
  },
  
  // Hàm lấy lịch sử đặt bàn
  async fetchReservations() { 
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        // Nếu store chưa có dữ liệu thì mới nạp Mock, tránh bị reset khi thao tác
        if (this.reservations.length === 0) {
            this.reservations = [...MOCK_HISTORY];
        }
        this.isLoading = false;
        resolve(this.reservations);
      }, 500);
    });
  },

  // [UPDATED] Hỗ trợ tham số reason từ FR-7.1
  async cancelReservation(id: number, reason: string = '') {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        const target = this.reservations.find(r => r.id === id);
        if (target) {
          // Logic thực tế: Gửi API reason lên server
          console.log(`[API] Hủy đơn #${id}. Lý do: ${reason || 'Không có'}`);
          
          target.status = 'CANCELLED';
        }
        this.isLoading = false;
        resolve(true);
      }, 500);
    });
  }
});