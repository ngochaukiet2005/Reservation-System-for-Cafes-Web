import { reactive } from 'vue';
import { reservationApi, Reservation as ApiReservation } from '../api/reservationApi';
import { tableApi } from '../api/tableApi';

export interface Table {
  id: number;
  name: string;
  capacity: number;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE' | 'PENDING' | 'DISABLED';
  type?: string;
}

export interface Reservation {
  id: number;
  guestName: string;
  phone: string;
  time: string;
  people: number;
  tableId: number | null;
  tableName?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' | 'REQUEST_CANCEL' | 'OCCUPIED';
  cancellationReason?: string;
  raw?: any;
}

const mapReservation = (r: any): Reservation => ({
  id: Number(r.id),
  guestName: r.customer_name,
  phone: r.customer_phone,
  time: r.reservation_time,
  people: r.guest_count,
  tableId: r.table_id ? Number(r.table_id) : null,
  tableName: r.table?.name,
  status: (r.status?.name || r.status) as Reservation['status'],
  cancellationReason: r.cancel_reason,
  raw: r,
});

const mapTable = (t: any): Table => ({
  id: Number(t.id),
  name: t.name,
  capacity: t.capacity,
  status: (t.status?.name || t.status) as Table['status'],
  type: t.type,
});

// --- MOCK DATA XÓA HẾT ---
const MOCK_TABLES_DATA: Table[] = [
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
  reservations: [] as Reservation[],
  isLoading: false,

  async fetchTables() {
    this.isLoading = true;
    try {
      const data = await tableApi.getAll();
      this.tables = data.map(mapTable);
    } finally {
      this.isLoading = false;
    }
    return this.tables;
  },

  async fetchTablesByTime(date: string, time: string) {
    this.isLoading = true;
    try {
      const iso = `${date}T${time}`;
      await Promise.all([
        this.fetchTables(),
        this.fetchReservations({ date }),
      ]);

      const target = new Date(iso);
      const updated = this.tables.map((t) => ({ ...t }));

      this.reservations.forEach((res) => {
        if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(res.status)) return;
        if (!res.tableId) return;

        const resTime = new Date(res.time);
        const diffMinutes = Math.abs((target.getTime() - resTime.getTime()) / 60000);
        if (diffMinutes >= 60) return;

        const tableIdx = updated.findIndex((tb) => tb.id === res.tableId);
        if (tableIdx === -1) return;
        if (updated[tableIdx].status === 'MAINTENANCE') return;

        if (res.status === 'OCCUPIED') updated[tableIdx].status = 'OCCUPIED';
        else if (res.status === 'PENDING') updated[tableIdx].status = 'PENDING';
        else updated[tableIdx].status = 'RESERVED';
      });

      this.tables = updated;
    } finally {
      this.isLoading = false;
    }
    return this.tables;
  },

  async fetchReservations(params?: { status?: string; date?: string }) {
    this.isLoading = true;
    try {
      const data = await reservationApi.getReservations(params);
      this.reservations = (data as any[]).map(mapReservation);
    } finally {
      this.isLoading = false;
    }
    return this.reservations;
  },

  async createReservation(payload: {
    customer_name: string;
    customer_phone: string;
    reservation_time: string;
    guest_count: number;
    table_id?: string;
    notes?: string;
  }) {
    this.isLoading = true;
    try {
      const created = await reservationApi.createReservation(payload);
      const mapped = mapReservation(created);
      this.reservations.unshift(mapped);
      if (mapped.tableId) {
        await this.fetchTables();
      }
      return mapped;
    } finally {
      this.isLoading = false;
    }
  },

  async approveReservation(id: number) {
    const res = await reservationApi.confirmReservation(String(id));
    await this.fetchReservations();
    await this.fetchTables();
    return res;
  },

  async cancelReservation(id: number, reason = '') {
    const res = await reservationApi.cancelReservation(String(id), reason);
    await this.fetchReservations();
    await this.fetchTables();
    return res;
  },

  async checkInReservation(id: number) {
    const res = await reservationApi.checkIn(String(id));
    await this.fetchReservations();
    await this.fetchTables();
    return res;
  },

  async checkOutReservation(id: number) {
    const res = await reservationApi.checkOut(String(id));
    await this.fetchReservations();
    await this.fetchTables();
    return res;
  },
});