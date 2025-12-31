// src/api/adminApi.ts
import type { User } from '../store/authStore'; // Tận dụng type nếu đã có, hoặc định nghĩa mới

// Interface cho Thống kê Dashboard
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeTables: number;
  totalStaff: number;
}

// Interface cho Staff (kế thừa hoặc tạo mới tùy structure của bạn)
export interface Staff {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'LOCKED';
  role: 'STAFF';
  createdAt: string;
}

// MOCK DATA
const mockStats: DashboardStats = {
  totalRevenue: 15500000,
  totalOrders: 124,
  activeTables: 8,
  totalStaff: 5,
};

const mockStaffs: Staff[] = [
  { id: 1, fullName: 'Nguyễn Văn A', username: 'staff01', email: 'a@cafe.com', phone: '0901234567', status: 'ACTIVE', role: 'STAFF', createdAt: '2023-10-01' },
  { id: 2, fullName: 'Trần Thị B', username: 'staff02', email: 'b@cafe.com', phone: '0909876543', status: 'ACTIVE', role: 'STAFF', createdAt: '2023-10-05' },
  { id: 3, fullName: 'Lê Văn C', username: 'staff03', email: 'c@cafe.com', phone: '0912345678', status: 'LOCKED', role: 'STAFF', createdAt: '2023-11-20' },
];

export const adminApi = {
  // Lấy thống kê Dashboard
  getDashboardStats(): Promise<DashboardStats> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockStats), 500); // Giả lập delay 500ms
    });
  },

  // Lấy danh sách nhân viên
  getAllStaff(): Promise<Staff[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockStaffs), 500);
    });
  },

  // Tạo nhân viên mới
  createStaff(data: Partial<Staff>): Promise<Staff> {
    return new Promise((resolve) => {
      const newStaff: Staff = {
        id: Math.floor(Math.random() * 1000),
        fullName: data.fullName || 'New Staff',
        username: data.username || 'user' + Date.now(),
        email: data.email || 'mail@test.com',
        phone: data.phone || '',
        status: 'ACTIVE',
        role: 'STAFF',
        createdAt: new Date().toISOString().split('T')[0]
      };
      // Trong thực tế, server sẽ lưu và trả về item mới
      setTimeout(() => resolve(newStaff), 600);
    });
  },

  // Khóa/Mở khóa nhân viên
  toggleStaffStatus(id: number, currentStatus: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'), 400);
    });
  }
};