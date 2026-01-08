// src/api/adminApi.ts
import { httpClient } from './httpClient';

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
const mockStats: DashboardStats = {
  totalRevenue: 15500000,
  totalOrders: 124,
  activeTables: 8,
  totalStaff: 5,
};

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
  // Vẫn mock phần thống kê
  async getDashboardStats(): Promise<DashboardStats> {
    return new Promise((resolve) => setTimeout(() => resolve(mockStats), 300));
  },

  // Lấy danh sách staff từ Backend
  async getAllStaff(): Promise<Staff[]> {
    const res = await httpClient.get('/users/staff');
    const list = res.data?.data || [];
    return list.map(mapUserToStaff);
  },

  // Tạo nhân viên qua Backend
  async createStaff(data: CreateStaffDTO): Promise<Staff> {
    try {
      const payload = {
        email: data.email,
        password: data.password || 'staff123',
        user_name: data.fullName,
        phone_number: data.phone || undefined,
      };
      const res = await httpClient.post('/users/staff', payload);
      const user = res.data?.data;
      return mapUserToStaff(user);
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
};