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
  { id: 120, name: 'Bàn 20', capacity: 8, status: 'AVAILABLE', type: 'Outdoor' },
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
  
  // Hàm này để sau này dùng cho trang Lịch sử
  async fetchReservations() { return []; }
});