import { reactive } from 'vue';

export interface Table {
  id: number;
  name: string;
  capacity: number;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE' | 'PENDING';
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
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' | 'REQUEST_CANCEL' | 'OCCUPIED';
  cancellationReason?: string;
  adminResponse?: string;
}

// --- MOCK DATA: DANH SÁCH BÀN ---
const MOCK_TABLES_DATA: Table[] = [
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
  
  // UPDATE: Đặt bàn 16 ở trạng thái bảo trì để test giao diện
  { id: 116, name: 'Bàn 16', capacity: 4, status: 'MAINTENANCE', type: 'Outdoor' },
  
  { id: 117, name: 'Bàn 17', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 118, name: 'Bàn 18', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 119, name: 'Bàn 19', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
  { id: 120, name: 'Bàn 20', capacity: 6, status: 'AVAILABLE', type: 'Outdoor' },
];

// --- MOCK HISTORY: GIẢ LẬP CÁC TRƯỜNG HỢP ---
const todayStr = new Date().toISOString().split('T')[0];
const MOCK_HISTORY: Reservation[] = [
  // 1. Đơn hoàn thành trong quá khứ
  { id: 901, guestName: 'Nguyễn Văn A', phone: '0901234567', time: '2023-11-20T09:00:00', people: 2, tableId: 105, tableName: 'Bàn 05', status: 'COMPLETED' },
  
  // 2. Đơn sắp đến (Confirmed) - Giả sử là hôm nay lúc 18:00
  { id: 902, guestName: 'Trần Thị B', phone: '0908887777', time: `${todayStr}T18:00:00`, people: 4, tableId: 114, tableName: 'Bàn 14', status: 'CONFIRMED' },
  
  // 3. Đang có khách (Occupied) - Giả sử đang ngồi bàn 01
  { id: 903, guestName: 'Lê C', phone: 'Tại quầy', time: new Date().toISOString(), people: 2, tableId: 101, tableName: 'Bàn 01', status: 'OCCUPIED' },

  // 4. Khách yêu cầu hủy (Request Cancel)
  { id: 904, guestName: 'Phạm D', phone: '0912341234', time: `${todayStr}T20:00:00`, people: 6, tableId: 107, tableName: 'Bàn 07', status: 'REQUEST_CANCEL', cancellationReason: 'Bận đột xuất' },

  // 5. Đơn chờ duyệt (Pending)
  { id: 905, guestName: 'Hoàng E', phone: '0999888777', time: `${todayStr}T19:30:00`, people: 4, tableId: 112, tableName: 'Bàn 12', status: 'PENDING' },
];

export const reservationStore = reactive({
  tables: [] as Table[],
  reservations: [...MOCK_HISTORY] as Reservation[],
  isLoading: false,

  // --- LOGIC: Lấy trạng thái bàn theo giờ ---
  async fetchTablesByTime(date: string, time: string) {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        // Reset về mặc định
        const currentTables = MOCK_TABLES_DATA.map(t => ({ 
          ...t, 
          // Giữ nguyên trạng thái bảo trì nếu có
          status: t.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE' 
        }));

        const selectedTime = new Date(`${date}T${time}`);
        
        // Quét lịch sử đặt bàn
        this.reservations.forEach(res => {
          if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(res.status)) return;
          if (!res.tableId) return;

          const resTime = new Date(res.time);
          // Logic: Nếu giờ chọn nằm trong khoảng [Giờ đặt - 60p, Giờ đặt + 60p]
          const diffMinutes = Math.abs((selectedTime.getTime() - resTime.getTime()) / 60000);
          
          if (diffMinutes < 60) { 
            const tableIndex = currentTables.findIndex(t => t.id === res.tableId);
            if (tableIndex !== -1) {
              // Nếu bàn đang bảo trì thì không ghi đè trạng thái đặt bàn
              if (currentTables[tableIndex].status !== 'MAINTENANCE') {
                  if (res.status === 'OCCUPIED') currentTables[tableIndex].status = 'OCCUPIED';
                  else if (res.status === 'PENDING') currentTables[tableIndex].status = 'PENDING';
                  else currentTables[tableIndex].status = 'RESERVED';
              }
            }
          }
        });

        // @ts-ignore
        this.tables = currentTables;
        this.isLoading = false;
        resolve(this.tables);
      }, 300);
    });
  },

  // --- Các hàm Action (Create, Update) giữ nguyên ---
  async createReservation(payload: any) {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        const newRes: Reservation = {
          id: Date.now(),
          ...payload,
          status: payload.isAdmin ? (payload.initialStatus || 'CONFIRMED') : 'PENDING'
        };
        this.reservations.unshift(newRes); 
        this.updateTableStatusOnUI(newRes.tableId, newRes.status);
        this.isLoading = false;
        resolve(newRes);
      }, 500);
    });
  },
  
  async fetchReservations() { 
    this.isLoading = true;
    return new Promise((resolve) => {
        setTimeout(() => { this.isLoading = false; resolve(this.reservations); }, 300);
    });
  },

  async cancelReservation(id: number, reason: string = '') {
     const target = this.reservations.find(r => r.id === id);
     if (target) {
        if (['PENDING', 'REQUEST_CANCEL'].includes(target.status)) {
            target.status = 'CANCELLED';
            target.cancellationReason = reason;
            this.updateTableStatusOnUI(target.tableId, 'AVAILABLE');
        } else {
            target.status = 'CANCELLED'; 
            target.cancellationReason = reason;
            this.updateTableStatusOnUI(target.tableId, 'AVAILABLE');
        }
     }
  },

  async approveReservation(id: number) {
      const target = this.reservations.find(r => r.id === id);
      if (target) {
          target.status = 'CONFIRMED';
          this.updateTableStatusOnUI(target.tableId, 'RESERVED');
      }
  },

  async checkInReservation(id: number) {
      const target = this.reservations.find(r => r.id === id);
      if (target) {
          target.status = 'OCCUPIED'; 
          this.updateTableStatusOnUI(target.tableId, 'OCCUPIED');
      }
  },

  async checkOutReservation(id: number) {
      const target = this.reservations.find(r => r.id === id);
      if (target) {
          target.status = 'COMPLETED';
          this.updateTableStatusOnUI(target.tableId, 'AVAILABLE');
      }
  },

  updateTableStatusOnUI(tableId: number | null, resStatus: string) {
      if (!tableId) return;
      const table = this.tables.find(t => t.id === tableId);
      if (table && table.status !== 'MAINTENANCE') {
          if (resStatus === 'OCCUPIED') table.status = 'OCCUPIED';
          else if (resStatus === 'PENDING') table.status = 'PENDING';
          else if (['CONFIRMED', 'RESERVED', 'REQUEST_CANCEL'].includes(resStatus)) table.status = 'RESERVED';
          else table.status = 'AVAILABLE';
      }
  }
});