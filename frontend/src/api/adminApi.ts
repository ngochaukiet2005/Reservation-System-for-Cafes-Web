// src/api/adminApi.ts
import { httpClient } from './httpClient';

// Interface cho Thống kê Dashboard
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeTables: number;
  totalStaff: number;
}

// Interface cho Staff - khớp với backend
export interface Staff {
  id: string;
  email: string;
  user_name: string;
  phone_number?: string;
  role: {
    id: string;
    name: string;
  };
  is_active: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

// Interface cho request tạo staff
export interface CreateStaffRequest {
  email: string;
  password: string;
  user_name: string;
  phone_number?: string;
}

// Interface cho request cập nhật staff
export interface UpdateStaffRequest {
  user_name?: string;
  phone_number?: string;
  is_active?: boolean;
  is_locked?: boolean;
}

export const adminApi = {
  // Lấy thống kê Dashboard (mock)
  getDashboardStats(): Promise<DashboardStats> {
    // Mock data - có thể thay bằng API thật sau
    return Promise.resolve({
      totalRevenue: 15500000,
      totalOrders: 124,
      activeTables: 8,
      totalStaff: 5,
    });
  },

  // Lấy danh sách nhân viên (API thật)
  async getAllStaff(): Promise<Staff[]> {
    const response = await httpClient.get('/users/staff');
    return response.data.data;
  },

  // Tạo nhân viên mới (API thật)
  async createStaff(data: CreateStaffRequest): Promise<Staff> {
    const response = await httpClient.post('/users/staff', data);
    return response.data.data;
  },

  // Cập nhật thông tin staff (API thật)
  async updateStaff(id: string, data: UpdateStaffRequest): Promise<Staff> {
    const response = await httpClient.put(`/users/staff/${id}`, data);
    return response.data.data;
  },

  // Xóa staff (API thật)
  async deleteStaff(id: string): Promise<void> {
    await httpClient.delete(`/users/staff/${id}`);
  },

  // Khóa/mở khóa tài khoản staff
  async toggleLockStaff(id: string, isLocked: boolean): Promise<Staff> {
    const response = await httpClient.put(`/users/staff/${id}`, { is_locked: isLocked });
    return response.data.data;
  },

  // Kích hoạt/vô hiệu hóa tài khoản staff
  async toggleActiveStaff(id: string, isActive: boolean): Promise<Staff> {
    const response = await httpClient.put(`/users/staff/${id}`, { is_active: isActive });
    return response.data.data;
  },
};