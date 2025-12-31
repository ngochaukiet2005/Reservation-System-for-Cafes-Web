// frontend/src/api/adminApi.ts
export interface Staff {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  status: 'ACTIVE' | 'LOCKED';
}

export interface DashboardStats {
  revenue: number;
  totalBookings: number;
  activeTables: number;
  onlineStaff: number;
}

// DỮ LIỆU MẪU
let mockStaffs: Staff[] = [
  { id: 1, fullName: 'Nguyễn Văn Quản Lý', email: 'admin@cafe.com', role: 'ADMIN', status: 'ACTIVE' },
  { id: 2, fullName: 'Trần Thị Phục Vụ', email: 'staff1@cafe.com', role: 'STAFF', status: 'ACTIVE' },
  { id: 3, fullName: 'Lê Văn Nghỉ', email: 'staff2@cafe.com', role: 'STAFF', status: 'LOCKED' },
  { id: 4, fullName: 'Phạm Văn Mới', email: 'newbie@cafe.com', role: 'STAFF', status: 'ACTIVE' },
];

export const adminApi = {
  // Lấy thống kê Dashboard
  async getDashboardStats() {
    await new Promise(r => setTimeout(r, 600)); // Giả lập mạng chậm
    return {
      revenue: 15450000,
      totalBookings: 48,
      activeTables: 12,
      onlineStaff: 4
    } as DashboardStats;
  },

  // Lấy danh sách nhân viên
  async getStaffList() {
    await new Promise(r => setTimeout(r, 500));
    return [...mockStaffs];
  },

  // Tạo nhân viên mới
  async createStaff(staff: any) {
    await new Promise(r => setTimeout(r, 800));
    const newStaff = { ...staff, id: Date.now(), status: 'ACTIVE' };
    mockStaffs.push(newStaff);
    return newStaff;
  },

  // Xóa nhân viên
  async deleteStaff(id: number) {
    await new Promise(r => setTimeout(r, 500));
    mockStaffs = mockStaffs.filter(s => s.id !== id);
  }
};