<template>
  <div class="manage-staff-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Quản lý Nhân viên</h1>
        <p class="page-subtitle">Quản lý danh sách và quyền truy cập của nhân viên</p>
      </div>
      <button class="btn-primary" @click="openAddStaffModal">
        <span class="icon">+</span> Thêm Nhân viên
      </button>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th width="5%">ID</th>
              <th width="25%">Họ và Tên</th>
              <th width="30%">Email (Tài khoản)</th>
              <th width="15%">Mật khẩu</th>
              <th width="10%">Số điện thoại</th>
              <th width="8%">Ngày tạo</th>
              <th width="7%">Trạng thái</th>
              <th width="5%" class="text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="loading-cell">
                <div class="spinner"></div> Đang tải dữ liệu...
              </td>
            </tr>
            
            <tr v-else v-for="staff in staffList" :key="staff.id">
              <td class="text-gray">#{{ staff.id }}</td>
              <td>
                <div class="user-info">
                  <div class="avatar-placeholder">
                    {{ staff.fullName.charAt(0).toUpperCase() }}
                  </div>
                  <span class="font-bold text-dark">{{ staff.fullName }}</span>
                </div>
              </td>
              <td>
                <div class="email-text">{{ staff.email }}</div>
              </td>
              <td>
                <div class="password-cell">
                  <code class="pwd-chip">{{ staff.plainPassword || '(chưa lưu)' }}</code>
                </div>
              </td>
              <td>{{ staff.phone }}</td>
              <td class="text-gray">{{ staff.createdAt }}</td>
              <td>
                <span :class="['status-badge', staff.status.toLowerCase()]">
                  {{ staff.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa' }}
                </span>
              </td>
              <td class="text-right">
                <button 
                  class="btn-icon" 
                  :class="staff.status === 'ACTIVE' ? 'text-danger' : 'text-success'"
                  @click="toggleStatus(staff)"
                  :title="staff.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'"
                >
                  <span v-if="staff.status === 'ACTIVE'">🔒</span>
                  <span v-else>🔓</span>
                </button>
                <button 
                  class="btn-icon text-danger" 
                  @click="deleteStaff(staff)"
                  title="Xóa tài khoản"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="!loading && staffList.length === 0" class="empty-state">
        <p>Chưa có nhân viên nào trong hệ thống.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Swal from 'sweetalert2';
import { adminApi, type Staff } from '../../api/adminApi';

const staffList = ref<Staff[]>([]);
const loading = ref(true);

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

const openAddStaffModal = async () => {
  // Logic giữ nguyên như cũ
  const { value: formValues } = await Swal.fire({
    title: '<h2 style="font-size: 1.5rem; color: #2c3e50;">Thêm Nhân viên mới</h2>',
    html:
      '<div class="swal-form-group">' +
        '<label>Họ và tên</label>' +
        '<input id="swal-fullname" class="swal2-input custom-swal-input" placeholder="Ví dụ: Nguyễn Văn A">' +
      '</div>' +
      
      '<div class="swal-form-group">' +
        '<label>Số điện thoại</label>' +
        '<input id="swal-phone" class="swal2-input custom-swal-input" placeholder="090xxxxxxx">' +
      '</div>' +
      
      '<div class="swal-form-group">' +
        '<label>Email (Đăng nhập)</label>' +
        '<input id="swal-email" type="email" class="swal2-input custom-swal-input" placeholder="nhanvien@cafe.com">' +
      '</div>' +
      
      '<div class="swal-form-group">' +
        '<label>Mật khẩu</label>' +
        '<input id="swal-password" type="password" class="swal2-input custom-swal-input" placeholder="******">' +
      '</div>' +
      
      '<div class="swal-form-group">' +
        '<label>Xác nhận mật khẩu</label>' +
        '<input id="swal-confirm-password" type="password" class="swal2-input custom-swal-input" placeholder="******">' +
      '</div>',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Tạo tài khoản',
    cancelButtonText: 'Hủy bỏ',
    confirmButtonColor: '#3498db',
    cancelButtonColor: '#95a5a6',
    customClass: {
      popup: 'custom-swal-popup'
    },
    preConfirm: () => {
      const fullName = (document.getElementById('swal-fullname') as HTMLInputElement).value;
      const phone = (document.getElementById('swal-phone') as HTMLInputElement).value;
      const email = (document.getElementById('swal-email') as HTMLInputElement).value;
      const password = (document.getElementById('swal-password') as HTMLInputElement).value;
      const confirmPassword = (document.getElementById('swal-confirm-password') as HTMLInputElement).value;

      if (!fullName || !phone || !email || !password || !confirmPassword) {
        Swal.showValidationMessage('Vui lòng điền đầy đủ thông tin');
        return false;
      }
      if (!email.includes('@')) {
        Swal.showValidationMessage('Email không hợp lệ');
        return false;
      }
      if (password.length < 6) {
        Swal.showValidationMessage('Mật khẩu phải từ 6 ký tự trở lên');
        return false;
      }
      if (password !== confirmPassword) {
        Swal.showValidationMessage('Mật khẩu xác nhận không khớp');
        return false;
      }

      return { fullName, email, phone, password };
    }
  });

  if (formValues) {
    try {
      const response = await adminApi.createStaff(formValues);
      staffList.value.push(response); 
      
      // Hiển thị mật khẩu để admin copy
      const plainPassword = (response as any).plainPassword || formValues.password;
      await Swal.fire({
        icon: 'success',
        title: 'Tạo tài khoản thành công',
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <p><strong>Email:</strong> ${response.email}</p>
            <p><strong>Họ và tên:</strong> ${response.fullName}</p>
            <div style="background-color: #f8f9fa; padding: 12px; border-radius: 6px; margin: 16px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Mật khẩu:</strong></p>
              <div style="display: flex; gap: 8px; align-items: center;">
                <code style="background: white; padding: 8px 12px; border-radius: 4px; border: 1px solid #e0e0e0; flex: 1;">${plainPassword}</code>
                <button id="copy-password-btn" style="background: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Copy</button>
              </div>
            </div>
            <p style="color: #e74c3c; font-size: 12px; margin: 12px 0 0 0;"><strong>⚠️ Lưu ý:</strong> Hãy ghi lại mật khẩu này. Nó sẽ không hiển thị lại.</p>
          </div>
        `,
        confirmButtonColor: '#3498db',
        confirmButtonText: 'Đã lưu',
        didOpen: () => {
          const copyBtn = document.getElementById('copy-password-btn');
          if (copyBtn) {
            copyBtn.addEventListener('click', () => {
              navigator.clipboard.writeText(plainPassword);
              copyBtn.textContent = '✓ Đã copy';
              setTimeout(() => {
                copyBtn.textContent = 'Copy';
              }, 2000);
            });
          }
        }
      });
    } catch (error) {
      const message = (error as any)?.message || (error as any)?.response?.data?.message || 'Không thể tạo nhân viên';
      Swal.fire('Lỗi', message, 'error');
    }
  }
};

const toggleStatus = async (staff: Staff) => {
  const actionName = staff.status === 'ACTIVE' ? 'khóa' : 'mở khóa';
  const result = await Swal.fire({
    title: 'Xác nhận thay đổi?',
    text: `Bạn có chắc muốn ${actionName} tài khoản ${staff.email}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: staff.status === 'ACTIVE' ? '#e74c3c' : '#27ae60',
    cancelButtonColor: '#95a5a6',
    confirmButtonText: 'Đồng ý',
    cancelButtonText: 'Hủy'
  });

  if (result.isConfirmed) {
    const newStatus = await adminApi.toggleStaffStatus(staff.id, staff.status);
    const index = staffList.value.findIndex(s => s.id === staff.id);
    if (index !== -1) {
      staffList.value[index].status = newStatus as 'ACTIVE' | 'LOCKED';
    }
    Swal.fire('Đã cập nhật!', `Tài khoản đã được ${actionName}.`, 'success');
  }
};

const deleteStaff = async (staff: Staff) => {
  const result = await Swal.fire({
    title: 'Xác nhận xóa?',
    text: `Bạn chắc chắn muốn xóa tài khoản ${staff.email} không? Hành động này không thể hoàn tác.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#95a5a6',
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy'
  });

  if (result.isConfirmed) {
    try {
      await adminApi.deleteStaff(staff.id);
      const index = staffList.value.findIndex(s => s.id === staff.id);
      if (index !== -1) {
        staffList.value.splice(index, 1);
      }
      Swal.fire('Đã xóa!', `Tài khoản ${staff.email} đã được xóa thành công.`, 'success');
    } catch (error) {
      const message = (error as any)?.message || 'Không thể xóa nhân viên';
      Swal.fire('Lỗi', message, 'error');
    }
  }
};

onMounted(() => {
  fetchStaff();
});
</script>

<style scoped>
/* 1. Layout Container */
.manage-staff-container {
  padding: 32px;
  background-color: #f8f9fa; /* Màu nền nhẹ cho toàn trang */
  min-height: 100vh;
}

/* 2. Header Styles */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.page-subtitle {
  color: #718096;
  margin-top: 4px;
  font-size: 0.95rem;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 6px rgba(52, 152, 219, 0.2);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(52, 152, 219, 0.3);
}

/* 3. Table Card Styles */
.table-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
  overflow: hidden; /* Để bo góc */
  border: 1px solid #edf2f7;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.custom-table th {
  background-color: #f7fafc;
  color: #4a5568;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: 16px 24px;
  border-bottom: 2px solid #edf2f7;
}

.custom-table td {
  padding: 16px 24px;
  border-bottom: 1px solid #edf2f7;
  color: #2d3748;
  vertical-align: middle;
  font-size: 0.95rem;
}

.custom-table tr:last-child td {
  border-bottom: none;
}

.custom-table tbody tr {
  transition: background-color 0.2s;
}

.custom-table tbody tr:hover {
  background-color: #f8fafc;
}

.password-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pwd-chip {
  background-color: #f7fafc;
  border: 1px solid #e2e8f0;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #2d3748;
}

/* 4. Cell Components */
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-placeholder {
  width: 36px;
  height: 36px;
  background-color: #ebf8ff;
  color: #3182ce;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.email-text {
  color: #3182ce;
  font-weight: 500;
}

.text-gray {
  color: #a0aec0;
  font-size: 0.85rem;
}

.text-right {
  text-align: right;
}

/* 5. Status Badges - Soft Style */
.status-badge {
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-block;
}

.status-badge.active {
  background-color: #def7ec;
  color: #03543f;
}

.status-badge.locked {
  background-color: #fde8e8;
  color: #9b1c1c;
}

/* 6. Action Buttons */
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s;
  font-size: 1.1rem;
}

.btn-icon:hover {
  background-color: #edf2f7;
}

.text-danger:hover {
  color: #e74c3c;
}

.text-success:hover {
  color: #27ae60;
}

.loading-cell {
  padding: 40px;
  text-align: center;
  color: #718096;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #a0aec0;
}
</style>

<style>
.custom-swal-popup {
  border-radius: 16px !important;
  padding: 24px !important;
}

.swal-form-group {
  text-align: left;
  margin-bottom: 16px;
}

.swal-form-group label {
  display: block;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 6px;
  font-size: 0.9rem;
}

.custom-swal-input {
  margin: 0 !important;
  width: 100% !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  padding: 10px 12px !important;
  box-sizing: border-box !important;
  font-size: 0.95rem !important;
}

.custom-swal-input:focus {
  border-color: #3182ce !important;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1) !important;
}
</style>