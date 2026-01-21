import { reactive } from 'vue';
import { reservationApi, Reservation as ApiReservation } from '../api/reservationApi';
import { tableApi } from '../api/tableApi';

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE' | 'PENDING' | 'DISABLED';
  type?: string;
}

export interface Reservation {
  id: string;
  guestName: string;
  phone: string;
  time: string;
  people: number;
  tableId: string | null;
  tableName?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' | 'REQUEST_CANCEL' | 'OCCUPIED';
  cancellationReason?: string;
  raw?: any;
}

const mapReservation = (r: any): Reservation => {
  // Xử lý status từ nhiều nguồn khác nhau
  let status = 'PENDING';
  if (typeof r.status === 'string') {
    status = r.status;
  } else if (r.status && typeof r.status === 'object' && r.status.name) {
    status = r.status.name;
  }

  // Xử lý customer name từ nhiều nguồn
  const guestName = r.customer_name || r.customer?.name || r.guestName || 'N/A';
  const phone = r.customer_phone || r.customer?.phone || r.phone || 'N/A';

  return {
    id: String(r.id) || '0',
    guestName,
    phone,
    time: r.start_time || r.reservation_time || '',
    people: r.num_guests || r.guest_count || 0,
    tableId: r.table_id ? String(r.table_id) : null,
    tableName: r.table?.name || r.tableName || 'Bàn ngẫu nhiên',
    status: status as Reservation['status'],
    cancellationReason: r.cancel_reason,
    raw: r,
  };
};

const mapTable = (t: any): Table => ({
  id: String(t.id),
  name: t.name,
  capacity: t.capacity,
  status: (t.status?.name || t.status) as Table['status'],
  type: t.type,
});



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
      this.reservations = (Array.isArray(data) ? data : []).map(mapReservation);
    } finally {
      this.isLoading = false;
    }
    return this.reservations;
  },

  async createReservation(payload: any) {
    this.isLoading = true;
    try {
      const created = await reservationApi.createReservation({
        customer_name: payload.guestName || payload.customer_name,
        customer_phone: payload.phone || payload.customer_phone,
        reservation_time: payload.reservation_time || `${payload.date}T${payload.time}`,
        guest_count: payload.people || payload.guest_count || 2,
        table_id: payload.tableId ? String(payload.tableId) : undefined,
        notes: payload.notes,
      });
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

  async approveReservation(id: string) {
    this.isLoading = true;
    try {
      console.log(`[FRONTEND] Approving reservation #${id}`);
      const res = await reservationApi.confirmReservation(id);
      console.log(`[FRONTEND] Received response:`, res);
      console.log(`[FRONTEND] Response status:`, res.status);
      
      // Cập nhật trực tiếp reservation trong store
      const index = this.reservations.findIndex(r => r.id === id);
      if (index !== -1) {
        const mapped = mapReservation(res);
        console.log(`[FRONTEND] Mapped reservation status:`, mapped.status);
        this.reservations[index] = mapped;
      }
      
      // Fetch lại để đồng bộ với server
      await this.fetchReservations();
      await this.fetchTables();
      return res;
    } catch (error) {
      console.error(`[FRONTEND] Error approving reservation:`, error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  },

  async cancelReservation(id: string, reason = '') {
    this.isLoading = true;
    try {
      const res = await reservationApi.cancelReservation(id, reason);
      // Cập nhật trực tiếp reservation trong store
      const index = this.reservations.findIndex(r => r.id === id);
      if (index !== -1) {
        this.reservations[index] = mapReservation(res);
      }
      // Fetch lại để đồng bộ với server
      await this.fetchReservations();
      await this.fetchTables();
      return res;
    } finally {
      this.isLoading = false;
    }
  },

  async checkInReservation(id: string) {
    this.isLoading = true;
    try {
      const res = await reservationApi.checkIn(id);
      // Cập nhật trực tiếp reservation trong store
      const index = this.reservations.findIndex(r => r.id === id);
      if (index !== -1) {
        this.reservations[index] = mapReservation(res);
      }
      // Fetch lại để đồng bộ với server
      await this.fetchReservations();
      await this.fetchTables();
      return res;
    } finally {
      this.isLoading = false;
    }
  },

  async checkOutReservation(id: string) {
    this.isLoading = true;
    try {
      const res = await reservationApi.checkOut(id);
      // Cập nhật trực tiếp reservation trong store
      const index = this.reservations.findIndex(r => r.id === id);
      if (index !== -1) {
        this.reservations[index] = mapReservation(res);
      }
      // Fetch lại để đồng bộ với server
      await this.fetchReservations();
      await this.fetchTables();
      return res;
    } finally {
      this.isLoading = false;
    }
  },

  async approveCancelRequest(id: string) {
    this.isLoading = true;
    try {
      const res = await reservationApi.approveCancelRequest(id);
      // Cập nhật trực tiếp reservation trong store
      const index = this.reservations.findIndex(r => r.id === id);
      if (index !== -1) {
        this.reservations[index] = mapReservation(res);
      }
      // Fetch lại để đồng bộ với server
      await this.fetchReservations();
      await this.fetchTables();
      return res;
    } finally {
      this.isLoading = false;
    }
  },

  async rejectCancelRequest(id: string, reason: string) {
    this.isLoading = true;
    try {
      const res = await reservationApi.rejectCancelRequest(id, reason);
      // Cập nhật trực tiếp reservation trong store
      const index = this.reservations.findIndex(r => r.id === id);
      if (index !== -1) {
        this.reservations[index] = mapReservation(res);
      }
      // Fetch lại để đồng bộ với server
      await this.fetchReservations();
      await this.fetchTables();
      return res;
    } finally {
      this.isLoading = false;
    }
  },
});