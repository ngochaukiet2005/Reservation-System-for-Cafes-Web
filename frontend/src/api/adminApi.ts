// src/api/adminApi.ts

// Interface cho Thống kê Dashboard
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeTables: number;
  totalStaff: number;
}

// Interface cho Staff
export interface Staff {
  id: number;
  fullName: string;
  email: string;      // Định danh chính
  username: string;   // Sẽ ẩn đi hoặc để giống email
  phone: string;
  status: 'ACTIVE' | 'LOCKED';
  role: 'STAFF';
  createdAt: string;
}

// DTO khi tạo mới: Chỉ cần Email, không cần Username
export interface CreateStaffDTO {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
}

// MOCK DATA
const mockStats: DashboardStats = {
  totalRevenue: 15500000,
  totalOrders: 124,
  activeTables: 8,
  totalStaff: 5,
};

const mockStaffs: Staff[] = [
  { id: 1, fullName: 'Nguyễn Văn A', email: 'staff1@cafe.com', username: 'staff1@cafe.com', phone: '0901234567', status: 'ACTIVE', role: 'STAFF', createdAt: '2023-10-01' },
  { id: 2, fullName: 'Trần Thị B', email: 'staff2@cafe.com', username: 'staff2@cafe.com', phone: '0909876543', status: 'ACTIVE', role: 'STAFF', createdAt: '2023-10-05' },
  { id: 3, fullName: 'Lê Văn C', email: 'staff3@cafe.com', username: 'staff3@cafe.com', phone: '0912345678', status: 'LOCKED', role: 'STAFF', createdAt: '2023-11-20' },
];

export const adminApi = {
  getDashboardStats(): Promise<DashboardStats> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockStats), 500);
    });
  },

  getAllStaff(): Promise<Staff[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockStaffs), 500);
    });
  },

  // [LOGIC MỚI] Tạo nhân viên
  createStaff(data: CreateStaffDTO): Promise<Staff> {
    return new Promise((resolve) => {
      const newStaff: Staff = {
        id: Math.floor(Math.random() * 1000),
        fullName: data.fullName,
        email: data.email,
        username: data.email, // Gán username bằng email luôn để đồng bộ
        phone: data.phone,
        status: 'ACTIVE',
        role: 'STAFF',
        createdAt: new Date().toISOString().split('T')[0]
      };

      // Sau này Backend sẽ nhận: email, password, fullName, phone
      // console.log("Account created with Email/Pass:", data.email, data.password);

      setTimeout(() => resolve(newStaff), 600);
    });
  },

  toggleStaffStatus(id: number, currentStatus: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'), 400);
    });
  }
};