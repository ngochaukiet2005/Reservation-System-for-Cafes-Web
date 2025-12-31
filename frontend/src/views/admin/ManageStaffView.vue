<template>
  <div class="manage-staff">
    <div class="header-actions">
      <h1 class="page-title">Quản lý Nhân viên</h1>
      <button class="btn-add" @click="openAddStaffModal">
        + Thêm Nhân viên
      </button>
    </div>

    <div class="table-container">
      <table class="staff-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Họ và Tên</th>
            <th>Tài khoản</th>
            <th>Liên hệ</th>
            <th>Ngày tạo</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="text-center">Đang tải dữ liệu...</td>
          </tr>
          
          <tr v-else v-for="staff in staffList" :key="staff.id">
            <td>#{{ staff.id }}</td>
            <td class="font-bold">{{ staff.fullName }}</td>
            <td>
              <div>{{ staff.username }}</div>
              <small class="text-role">{{ staff.role }}</small>
            </td>
            <td>
              <div>{{ staff.email }}</div>
              <small>{{ staff.phone }}</small>
            </td>
            <td>{{ staff.createdAt }}</td>
            <td>
              <span :class="['badge', staff.status.toLowerCase()]">
                {{ staff.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa' }}
              </span>
            </td>
            <td>
              <button 
                class="btn-action" 
                :class="staff.status === 'ACTIVE' ? 'btn-lock' : 'btn-unlock'"
                @click="toggleStatus(staff)"
              >
                {{ staff.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Swal from 'sweetalert2'; // Thư viện popup xịn xò có sẵn
import { adminApi, type Staff } from '../../api/adminApi';

const staffList = ref<Staff[]>([]);
const loading = ref(true);

// 1. Tải danh sách
const fetchStaff = async () => {
  loading.value = true;
  try {
    staffList.value = await adminApi.getAllStaff();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// 2. Xử lý Thêm nhân viên (Dùng Swal để làm form nhanh)
const openAddStaffModal = async () => {
  const { value: formValues } = await Swal.fire({
    title: 'Thêm Nhân viên mới',
    html:
      '<input id="swal-fullname" class="swal2-input" placeholder="Họ tên">' +
      '<input id="swal-username" class="swal2-input" placeholder="Tên đăng nhập">' +
      '<input id="swal-email" class="swal2-input" placeholder="Email">',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Tạo',
    cancelButtonText: 'Hủy',
    preConfirm: () => {
      return {
        fullName: (document.getElementById('swal-fullname') as HTMLInputElement).value,
        username: (document.getElementById('swal-username') as HTMLInputElement).value,
        email: (document.getElementById('swal-email') as HTMLInputElement).value,
      }
    }
  });

  if (formValues) {
    // Gọi API giả lập
    const newStaff = await adminApi.createStaff(formValues);
    staffList.value.push(newStaff); // Cập nhật UI ngay lập tức (Real-time feel)
    Swal.fire('Thành công', `Đã thêm nhân viên ${newStaff.fullName}`, 'success');
  }
};

// 3. Xử lý Khóa/Mở khóa
const toggleStatus = async (staff: Staff) => {
  const actionName = staff.status === 'ACTIVE' ? 'khóa' : 'mở khóa';
  
  const result = await Swal.fire({
    title: `Xác nhận ${actionName}?`,
    text: `Bạn có chắc muốn ${actionName} tài khoản ${staff.username}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: staff.status === 'ACTIVE' ? '#d33' : '#3085d6',
    confirmButtonText: 'Đồng ý'
  });

  if (result.isConfirmed) {
    // Gọi API giả lập
    const newStatus = await adminApi.toggleStaffStatus(staff.id, staff.status);
    
    // Cập nhật UI ngay lập tức
    const index = staffList.value.findIndex(s => s.id === staff.id);
    if (index !== -1) {
      staffList.value[index].status = newStatus as 'ACTIVE' | 'LOCKED';
    }
    
    Swal.fire('Đã cập nhật!', `Tài khoản đã được ${actionName}.`, 'success');
  }
};

onMounted(() => {
  fetchStaff();
});
</script>

<style scoped>
.manage-staff { padding: 20px; }
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title { margin: 0; font-size: 1.8rem; color: #2c3e50; }

/* Buttons */
.btn-add {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}
.btn-add:hover { background: #2980b9; }

.btn-action {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  color: white;
}
.btn-lock { background: #e74c3c; }
.btn-lock:hover { background: #c0392b; }
.btn-unlock { background: #27ae60; }
.btn-unlock:hover { background: #219150; }

/* Table Styling */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  overflow: hidden;
}
.staff-table {
  width: 100%;
  border-collapse: collapse;
}
.staff-table th, .staff-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}
.staff-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}
.font-bold { font-weight: 600; }
.text-role { 
  display: block; 
  font-size: 0.75rem; 
  color: #7f8c8d; 
  background: #eee; 
  width: fit-content; 
  padding: 2px 6px; 
  border-radius: 4px; 
}

/* Badge Status */
.badge {
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}
.badge.active { background-color: #eafaf1; color: #27ae60; }
.badge.locked { background-color: #fdedec; color: #c0392b; }
.text-center { text-align: center; color: #95a5a6; padding: 30px; }
</style>