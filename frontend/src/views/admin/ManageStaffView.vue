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
            <th>Kích hoạt</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="text-center">Đang tải dữ liệu...</td>
          </tr>
          
          <tr v-else v-for="staff in staffList" :key="staff.id">
            <td>#{{ staff.id }}</td>
            <td class="font-bold">{{ staff.user_name }}</td>
            <td>
              <div>{{ staff.email }}</div>
              <small class="text-role">{{ staff.role?.name || 'STAFF' }}</small>
            </td>
            <td>
              <div>{{ staff.email }}</div>
              <small>{{ staff.phone_number || 'Chưa có' }}</small>
            </td>
            <td>{{ new Date(staff.created_at).toLocaleDateString('vi-VN') }}</td>
            <td>
              <span :class="['badge', staff.is_locked ? 'locked' : (staff.is_active ? 'active' : 'inactive')]">
                {{ staff.is_locked ? 'Đã khóa' : (staff.is_active ? 'Hoạt động' : 'Tạm dừng') }}
              </span>
            </td>
            <td>
              <label class="switch">
                <input 
                  type="checkbox" 
                  :checked="staff.is_active"
                  :disabled="staff.is_locked"
                  @change="toggleActive(staff)"
                >
                <span class="slider"></span>
              </label>
            </td>
            <td>
              <button 
                class="btn-action" 
                :class="staff.is_locked ? 'btn-unlock' : 'btn-lock'"
                @click="toggleLock(staff)"
              >
                {{ staff.is_locked ? 'Mở khóa' : 'Khóa' }}
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
      '<div style="text-align: left; padding: 0 20px;">' +
      '<label style="display:block;font-weight:600;margin:15px 0 5px;color:#333;">Họ và tên <span style="color:red;">*</span></label>' +
      '<input id="swal-fullname" class="swal2-input" value="" placeholder="Nhập họ tên nhân viên" style="margin:0;width:100%;" required>' +
      '<label style="display:block;font-weight:600;margin:15px 0 5px;color:#333;">Email đăng nhập <span style="color:red;">*</span></label>' +
      '<input id="swal-email" type="email" class="swal2-input" value="" placeholder="Nhập email đăng nhập" style="margin:0;width:100%;" required>' +
      '<label style="display:block;font-weight:600;margin:15px 0 5px;color:#333;">Mật khẩu <span style="color:red;">*</span></label>' +
      '<input id="swal-password" type="password" class="swal2-input" value="" placeholder="Ít nhất 6 ký tự (có chữ và số)" style="margin:0;width:100%;" required>' +
      '<label style="display:block;font-weight:600;margin:15px 0 5px;color:#333;">Số điện thoại</label>' +
      '<input id="swal-phone" type="tel" class="swal2-input" value="" placeholder="Nhập số điện thoại (không bắt buộc)" style="margin:0;width:100%;">' +
      '</div>',
    width: '550px',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: '✓ Tạo tài khoản',
    cancelButtonText: '✕ Hủy',
    confirmButtonColor: '#a67c52',
    cancelButtonColor: '#6c757d',
    didOpen: () => {
      // Đảm bảo tất cả input đều trống
      (document.getElementById('swal-fullname') as HTMLInputElement).value = '';
      (document.getElementById('swal-email') as HTMLInputElement).value = '';
      (document.getElementById('swal-password') as HTMLInputElement).value = '';
      (document.getElementById('swal-phone') as HTMLInputElement).value = '';
    },
    preConfirm: () => {
      const fullName = (document.getElementById('swal-fullname') as HTMLInputElement).value.trim();
      const email = (document.getElementById('swal-email') as HTMLInputElement).value.trim();
      const password = (document.getElementById('swal-password') as HTMLInputElement).value;
      const phone = (document.getElementById('swal-phone') as HTMLInputElement).value.trim();

      // Validation chi tiết
      if (!fullName) {
        Swal.showValidationMessage('⚠️ Vui lòng nhập họ tên nhân viên');
        return false;
      }

      if (fullName.length < 2) {
        Swal.showValidationMessage('⚠️ Họ tên phải có ít nhất 2 ký tự');
        return false;
      }

      if (!email) {
        Swal.showValidationMessage('⚠️ Vui lòng nhập email đăng nhập');
        return false;
      }

      if (!email.includes('@') || !email.includes('.')) {
        Swal.showValidationMessage('⚠️ Email không hợp lệ (phải có @ và tên miền)');
        return false;
      }

      if (!password) {
        Swal.showValidationMessage('⚠️ Vui lòng nhập mật khẩu');
        return false;
      }

      if (password.length < 6) {
        Swal.showValidationMessage('⚠️ Mật khẩu phải có ít nhất 6 ký tự');
        return false;
      }

      if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
        Swal.showValidationMessage('⚠️ Mật khẩu phải chứa cả chữ cái và số');
        return false;
      }

      return {
        user_name: fullName,
        email: email,
        password: password,
        phone_number: phone || undefined,
      }
    }
  });

  if (formValues) {
    try {
      // Gọi API thật
      const newStaff = await adminApi.createStaff(formValues);
      await fetchStaff(); // Reload lại danh sách
      Swal.fire('Thành công', `Đã thêm nhân viên ${newStaff.user_name}`, 'success');
    } catch (error: any) {
      Swal.fire('Lỗi', error.response?.data?.message || 'Không thể tạo nhân viên', 'error');
    }
  }
};

// 3. Xử lý Bật/Tắt trạng thái hoạt động
const toggleActive = async (staff: Staff) => {
  const newStatus = !staff.is_active;
  const actionName = newStatus ? 'kích hoạt' : 'tạm dừng';
  
  const result = await Swal.fire({
    title: `Xác nhận ${actionName} tài khoản`,
    html: `
      <div style="text-align: left; padding: 10px;">
        <p><strong>Nhân viên:</strong> ${staff.user_name}</p>
        <p><strong>Email:</strong> ${staff.email}</p>
        <hr style="margin: 15px 0;">
        <p style="color: #666;">Bạn có chắc chắn muốn <strong>${actionName}</strong> tài khoản này không?</p>
        ${!newStatus ? '<p style="color: orange; font-size: 0.9em;">⚠️ Nhân viên sẽ không thể đăng nhập khi tạm dừng</p>' : '<p style="color: green; font-size: 0.9em;">✓ Nhân viên sẽ có thể đăng nhập trở lại</p>'}
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: newStatus ? '#28a745' : '#f39c12',
    cancelButtonColor: '#6c757d',
    confirmButtonText: `✓ ${actionName}`,
    cancelButtonText: '✕ Hủy'
  });

  if (result.isConfirmed) {
    try {
      await adminApi.toggleActiveStaff(staff.id, newStatus);
      await fetchStaff();
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: `Đã ${actionName} tài khoản ${staff.user_name}`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || `Không thể ${actionName} tài khoản`,
        confirmButtonColor: '#d33'
      });
    }
  }
};

// 4. Xử lý Khóa/Mở khóa tài khoản
const toggleLock = async (staff: Staff) => {
  const isLocked = staff.is_locked;
  const actionName = isLocked ? 'mở khóa' : 'khóa';
  
  const result = await Swal.fire({
    title: `${!isLocked ? '🔒' : '🔓'} Xác nhận ${actionName} tài khoản`,
    html: `
      <div style="text-align: left; padding: 10px;">
        <p><strong>Nhân viên:</strong> ${staff.user_name}</p>
        <p><strong>Email:</strong> ${staff.email}</p>
        <p><strong>Trạng thái:</strong> <span style="color: ${isLocked ? 'red' : 'green'}; font-weight: bold;">${isLocked ? 'Đã khóa' : 'Đang hoạt động'}</span></p>
        <hr style="margin: 15px 0;">
        <p style="color: #666;">Bạn có chắc chắn muốn <strong>${actionName}</strong> tài khoản này không?</p>
        ${!isLocked ? '<p style="color: red; font-size: 0.9em;">⚠️ Tài khoản bị khóa sẽ không thể đăng nhập và tất cả quyền bị vô hiệu hóa</p>' : '<p style="color: green; font-size: 0.9em;">✓ Nhân viên sẽ có thể đăng nhập trở lại</p>'}
      </div>
    `,
    icon: isLocked ? 'question' : 'warning',
    showCancelButton: true,
    confirmButtonColor: isLocked ? '#28a745' : '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: isLocked ? '🔓 Mở khóa' : '🔒 Khóa',
    cancelButtonText: '✕ Hủy'
  });

  if (result.isConfirmed) {
    try {
      Swal.fire({
        title: 'Đang xử lý...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await adminApi.toggleLockStaff(staff.id, !isLocked);
      await fetchStaff();
      
      Swal.fire({
        icon: 'success',
        title: 'Cập nhật thành công!',
        html: `
          <p>Tài khoản <strong>${staff.user_name}</strong> đã được <strong>${actionName}</strong></p>
          <p style="color: #666; font-size: 0.9em; margin-top: 10px;">
            ${!isLocked ? '🔒 Tài khoản không thể đăng nhập' : '🔓 Tài khoản có thể đăng nhập'}
          </p>
        `,
        confirmButtonColor: '#a67c52',
        timer: 2000
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || `Không thể ${actionName} tài khoản`,
        confirmButtonColor: '#d33'
      });
    }
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
.btn-loinactive { background-color: #fef5e7; color: #f39c12; }
.badge.locked { background-color: #fdedec; color: #c0392b; }
.text-center { text-align: center; color: #95a5a6; padding: 30px; }

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}
input:checked + .slider {
  background-color: #27ae60;
}
input:checked + .slider:before {
  transform: translateX(26px);
}
input:disabled + .slider {
  background-color: #e0e0e0;
  cursor: not-allowed;
}
input:disabled + .slider:before {
  background-color: #bbb;
}

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