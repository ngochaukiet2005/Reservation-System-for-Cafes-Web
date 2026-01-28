// src/api/adminApi.ts
import { httpClient } from './httpClient';
import { tableApi } from './tableApi';

// Interface cho Thống kê Dashboard (placeholder)
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeTables: number;
  totalStaff: number;
}

// Interface hiển thị Staff trên UI
export interface Staff {
  id: number;
  fullName: string;
  email: string;
  username: string;
  phone: string;
  status: 'ACTIVE' | 'LOCKED';
  role: 'STAFF';
  createdAt: string;
}

// DTO từ form tạo mới
export interface CreateStaffDTO {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
}

// Tạm thời giữ mock cho dashboard

function mapUserToStaff(user: any): Staff {
  return {
    id: Number(user.id),
    fullName: user.user_name,
    email: user.email,
    username: user.email,
    phone: user.phone_number || '',
    status: user.is_locked ? 'LOCKED' : 'ACTIVE',
    role: 'STAFF',
    createdAt: (user.created_at || '').toString().substring(0, 10),
  };
}

export const adminApi = {
  // Thống kê dashboard: lấy thật từ backend
  async getDashboardStats(): Promise<DashboardStats> {
    const [tables, staff] = await Promise.all([
      tableApi.getAll(),
      httpClient.get('/users/staff').then((res) => res.data?.data || []),
    ]);

    // Bàn đang phục vụ: status = 'OCCUPIED'
    const occupiedTables = tables.filter((t: any) => t.status?.name === 'OCCUPIED').length;

    return {
      totalRevenue: 0,      // Chưa có dữ liệu doanh thu
      totalOrders: 0,       // Chưa có dữ liệu đơn
      activeTables: tables.length, // Hiển thị tổng số bàn
      totalStaff: staff.length,
    };
  },

  // Lấy danh sách staff từ Backend
  async getAllStaff(): Promise<Staff[]> {
    const res = await httpClient.get('/users/staff');
    const list = res.data?.data || [];
    return list.map(mapUserToStaff);
  },

  // Tạo nhân viên qua Backend
  async createStaff(data: CreateStaffDTO): Promise<Staff & { plainPassword?: string }> {
    try {
      const payload = {
        email: data.email,
        password: data.password || 'staff123',
        user_name: data.fullName,
        phone_number: data.phone || undefined,
      };
      const res = await httpClient.post('/users/staff', payload);
      const user = res.data?.data;
      const staff = mapUserToStaff(user);
      return staff;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể tạo nhân viên';
      throw new Error(Array.isArray(msg) ? msg.join('\n') : msg);
    }
  },

  // Đổi trạng thái: dùng updateStaff để toggle khóa/mở khóa
  async toggleStaffStatus(id: number, currentStatus: string): Promise<string> {
    try {
      const payload = { is_locked: currentStatus === 'ACTIVE' };
      const res = await httpClient.put(`/users/staff/${id}`, payload);
      const user = res.data?.data;
      return user?.is_locked ? 'LOCKED' : 'ACTIVE';
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể cập nhật trạng thái';
      throw new Error(Array.isArray(msg) ? msg.join('\n') : msg);
    }
  },

  // Xóa nhân viên
  async deleteStaff(id: number): Promise<void> {
    try {
      await httpClient.delete(`/users/staff/${id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể xóa nhân viên';
      throw new Error(Array.isArray(msg) ? msg.join('\n') : msg);
    }
  },
};