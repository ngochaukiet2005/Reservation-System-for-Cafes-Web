<template>
  <div class="manage-page">
    
    <div class="page-header">
      <div class="header-left">
        <h2>Sơ đồ Bàn (Admin)</h2>
        <p class="subtitle">Quản lý thiết lập và trạng thái vận hành bàn</p>
      </div>
      
      <button class="btn-add" @click="openAddModal">
        <span class="plus-icon">+</span> Thêm bàn mới
      </button>
    </div>

    <div v-if="loading" class="loading-text">Đang tải dữ liệu...</div>

    <div v-else class="map-area">
      <div class="tables-grid">
        <div 
          v-for="table in tables" 
          :key="table.id"
          class="table-card"
          :class="`status-${table.status.name.toLowerCase()}`"
          @click="handleAdminAction(table)"
        >
          <div class="table-number">{{ table.name || `Bàn #${table.id}` }}</div>
          <div class="table-capacity">{{ table.capacity }} ghế</div>
          <div class="table-status">{{ getStatusLabel(table.status.name) }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { tableApi, type Table } from '../../api/tableApi';
import TableMap from '../../components/map/TableMap.vue';
import Swal from 'sweetalert2';

const tables = ref<Table[]>([]);
const loading = ref(true);
const statuses = ref<Array<{ id: number; name: string }>>([]);

const loadTables = async () => {
  try {
    loading.value = true;
    const data = await tableApi.getAll();
    tables.value = data;
  } catch (error: any) {
    console.error('Lỗi tải danh sách bàn:', error);
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: error.response?.data?.message || 'Không thể tải danh sách bàn',
    });
  } finally {
    loading.value = false;
  }
};

const loadStatuses = async () => {
  try {
    const data = await tableApi.getStatuses();
    statuses.value = data;
  } catch (error) {
    console.error('Lỗi tải trạng thái:', error);
  }
};

onMounted(() => {
  loadTables();
  loadStatuses();
});

// --- LOGIC BỘ LỌC ---
const filterStatus = ref('ALL');
const filteredTables = computed(() => {
  return tables.value
    .map(t => ({
      id: t.id,
      name: t.name,
      label: t.name,
      capacity: t.capacity,
      seats: t.capacity,
      status: t.status.name,
      type: t.type,
    }))
    .filter(table => {
      return filterStatus.value === 'ALL' || table.status === filterStatus.value;
    });
});

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'AVAILABLE': '🟢 Trống',
    'PENDING': '🟡 Chờ duyệt',
    'RESERVED': '🟠 Đã đặt',
    'OCCUPIED': '🔴 Có khách',
    'DISABLED': '⚫ Bảo trì',
    'MAINTENANCE': '⚫ Bảo trì',
  };
  return labels[status] || status;
};

// --- ACTIONS ---
const openAddModal = async () => {
  const { value: form } = await Swal.fire({
    title: 'Thêm bàn mới',
    html: `
      <input id="swal-name" class="swal2-input" placeholder="Tên bàn (vd: Bàn 01)">
      <input id="swal-seats" type="number" min="1" class="swal2-input" placeholder="Số ghế">
      <input id="swal-type" class="swal2-input" placeholder="Loại bàn (Indoor/Outdoor/VIP - tùy chọn)">
    `,
    showCancelButton: true,
    confirmButtonText: 'Tạo bàn',
    preConfirm: () => {
      const name = (document.getElementById('swal-name') as HTMLInputElement).value.trim();
      const seats = parseInt((document.getElementById('swal-seats') as HTMLInputElement).value);
      const type = (document.getElementById('swal-type') as HTMLInputElement).value.trim();
      if (!name) {
        return Swal.showValidationMessage('Vui lòng nhập tên bàn');
      }
      if (isNaN(seats) || seats < 1) {
        return Swal.showValidationMessage('Vui lòng nhập số ghế lớn hơn 0');
      }
      return { name, seats, type: type || undefined };
    }
  });

  if (form) {
    try {
      await tableApi.create({ name: form.name, capacity: form.seats, type: form.type });
      Swal.fire({ icon: 'success', title: 'Đã thêm bàn!', timer: 1500, showConfirmButton: false });
      await loadTables();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.response?.data?.message || 'Không thể tạo bàn',
      });
    }
  }
};

const handleAdminAction = async (table: any) => {
  const { value: action } = await Swal.fire({
    title: `Quản lý Bàn ${table.name}`,
    text: `Trạng thái: ${getStatusLabel(table.status)} - ${table.capacity} ghế`,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: '📝 Sửa thông tin',
    denyButtonText: '🗑️ Xóa bàn',
    cancelButtonText: 'Đóng',
    customClass: {
      actions: 'swal-custom-actions',
      confirmButton: 'btn-swal-edit',
      denyButton: 'btn-swal-delete',
      cancelButton: 'btn-swal-cancel'
    },
    buttonsStyling: false
  });

  if (action === true) {
    // SỬA BÀN
    const fullTable = tables.value.find(t => t.id === table.id);
    if (!fullTable) return;

    const statusOptions = statuses.value.map(s => {
      const isSelected = String(s.id) === String(fullTable.status_id);
      return `<option value="${s.id}" ${isSelected ? 'selected' : ''}>${getStatusLabel(s.name)}</option>`;
    }).join('');

    const { value: updates } = await Swal.fire({
      title: 'Cập nhật bàn',
      html: `
        <div style="text-align:left; padding: 10px;">
          <label style="display:block; margin-bottom:5px; font-weight:600;">Tên bàn:</label>
          <input id="edit-name" class="swal2-input" value="${fullTable.name || ''}" placeholder="Bàn 01" style="margin-top:0;">

          <label style="display:block; margin-bottom:5px; margin-top:12px; font-weight:600;">Số ghế:</label>
          <input id="edit-seats" type="number" min="1" class="swal2-input" value="${fullTable.capacity}" style="margin-top:0;">

          <label style="display:block; margin-bottom:5px; margin-top:12px; font-weight:600;">Loại bàn:</label>
          <input id="edit-type" class="swal2-input" value="${fullTable.type || ''}" placeholder="Indoor/Outdoor/VIP" style="margin-top:0;">
          
          <label style="display:block; margin-bottom:5px; margin-top:15px; font-weight:600;">Trạng thái:</label>
          <select id="edit-status" class="swal2-select" style="width:90%; padding:10px; border-radius:8px; border: 1px solid #d9d9d9; margin-left:5%;">
            ${statusOptions}
          </select>
          
          <label style="display:block; margin-bottom:5px; margin-top:15px; font-weight:600;">Lý do bảo trì (nếu có):</label>
          <input id="edit-reason" class="swal2-input" value="${fullTable.disabled_reason || ''}" placeholder="Tùy chọn" style="margin-top:0;">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Cập nhật',
      cancelButtonText: 'Hủy',
      focusConfirm: false,
      preConfirm: () => {
        const name = (document.getElementById('edit-name') as HTMLInputElement).value.trim();
        const seats = parseInt((document.getElementById('edit-seats') as HTMLInputElement).value);
        const status_id = (document.getElementById('edit-status') as HTMLSelectElement).value;
        const reason = (document.getElementById('edit-reason') as HTMLInputElement).value;
        const type = (document.getElementById('edit-type') as HTMLInputElement).value.trim();
        
        if (!name) {
          return Swal.showValidationMessage('Tên bàn không được để trống');
        }
        if (isNaN(seats) || seats < 1) {
          return Swal.showValidationMessage('Số ghế không hợp lệ');
        }
        return { name, seats, status_id, reason, type: type || undefined };
      }
    });

    if (updates) {
      try {
        await tableApi.update(Number(fullTable.id), {
          name: updates.name,
          capacity: updates.seats,
          type: updates.type,
          status_id: updates.status_id,
          disabled_reason: updates.reason || undefined,
        });
        
        Swal.fire({ icon: 'success', title: 'Cập nhật thành công', timer: 1500, showConfirmButton: false });
        await loadTables();
      } catch (error: any) {

        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: error.response?.data?.message || 'Không thể cập nhật bàn',
        });
      }
    }
  } else if (action === false) {
    // XÓA BÀN
    const confirmDelete = await Swal.fire({
      title: 'Xác nhận xóa bàn',
      text: `Bạn có chắc chắn muốn xóa ${table.name}? Hành động này không thể hoàn tác!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#d33',
    });

    if (confirmDelete.isConfirmed) {
      try {
        await tableApi.delete(Number(table.id));
        Swal.fire({ icon: 'success', title: 'Đã xóa bàn!', timer: 1500, showConfirmButton: false });
        await loadTables();
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: error.response?.data?.message || 'Không thể xóa bàn',
        });
      }
    }
  }
};

onMounted(() => {
  loadTables();
  loadStatuses();
});
</script>

<style scoped>
.manage-page {
  padding: 24px;
  background-color: #f4f6f8;
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
}
.page-header {
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 20px;
}
.header-left h2 { 
  margin: 0; 
  font-size: 1.8rem; 
  color: #2c3e50; 
}
.subtitle { 
  color: #7f8c8d; 
  margin: 4px 0 0; 
  font-size: 0.95rem; 
}

.btn-add {
  background: #2ecc71; 
  color: white; 
  border: none; 
  padding: 10px 20px;
  border-radius: 8px; 
  font-weight: 600; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  gap: 8px;
  transition: transform 0.2s;
}
.btn-add:hover { 
  background: #27ae60; 
  transform: translateY(-2px); 
}

.loading-text {
  text-align: center;
  padding: 40px;
  font-size: 1.1rem;
  color: #7f8c8d;
}

.map-area {
  background: white; 
  padding: 20px; 
  border-radius: 16px; 
  min-height: 400px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  padding: 10px;
}

.table-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.table-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

.table-card.status-available {
  border-color: #20c997;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
}

.table-card.status-pending {
  border-color: #7950f2;
  background: linear-gradient(135deg, #f3f0ff 0%, #ffffff 100%);
}

.table-card.status-reserved {
  border-color: #fab005;
  background: linear-gradient(135deg, #fff9db 0%, #ffffff 100%);
}

.table-card.status-occupied {
  border-color: #fa5252;
  background: linear-gradient(135deg, #ffe8e8 0%, #ffffff 100%);
}

.table-card.status-disabled {
  border-color: #868e96;
  background: linear-gradient(135deg, #f1f3f5 0%, #ffffff 100%);
}

.table-number {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8px;
}

.table-capacity {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 8px;
}

.table-status {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
}

.status-available .table-status {
  background: #20c997;
  color: white;
}

.status-pending .table-status {
  background: #7950f2;
  color: white;
}

.status-reserved .table-status {
  background: #fab005;
  color: white;
}

.status-occupied .table-status {
  background: #fa5252;
  color: white;
}

.status-disabled .table-status {
  background: #868e96;
  color: white;
}
</style>

<style>
.swal-custom-actions { 
  gap: 15px !important; 
  margin-top: 25px !important; 
}
.btn-swal-edit, .btn-swal-delete, .btn-swal-cancel {
    padding: 12px 24px !important; 
    font-weight: 600 !important; 
    border-radius: 10px !important;
    font-size: 1rem !important; 
    border: none !important; 
    cursor: pointer !important;
    transition: all 0.2s ease-in-out !important; 
    box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
    outline: none !important; 
    display: inline-flex !important; 
    align-items: center !important; 
    justify-content: center !important;
}
.btn-swal-edit:hover, .btn-swal-delete:hover, .btn-swal-cancel:hover { 
  transform: translateY(-3px) !important; 
}
.btn-swal-edit { 
  background: linear-gradient(135deg, #228be6, #1c7ed6) !important; 
  color: white !important; 
}
.btn-swal-edit:hover { 
  box-shadow: 0 8px 15px rgba(34, 139, 230, 0.3) !important; 
}
.btn-swal-delete { 
  background: linear-gradient(135deg, #fa5252, #e03131) !important; 
  color: white !important; 
}
.btn-swal-delete:hover { 
  box-shadow: 0 8px 15px rgba(250, 82, 82, 0.3) !important; 
}
.btn-swal-cancel { 
  background-color: #e9ecef !important; 
  color: #495057 !important; 
}
.btn-swal-cancel:hover { 
  background-color: #dee2e6 !important; 
  color: #212529 !important; 
}
</style>