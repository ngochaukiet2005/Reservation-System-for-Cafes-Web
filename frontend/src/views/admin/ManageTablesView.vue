<template>
  <div class="manage-page">
    
    <div class="page-header">
      <div class="header-left">
        <h2>Sơ đồ Bàn (Admin)</h2>
        <p class="subtitle">Quản lý thiết lập và trạng thái vận hành bàn</p>
      </div>
      
      <button v-if="!isPastMode" class="btn-add" @click="openAddModal">
        <span class="plus-icon">+</span> Thêm bàn mới
      </button>
    </div>

    <div v-if="isPastMode" class="history-banner">
      ⚠️ Bạn đang xem trạng thái quá khứ. Các chức năng chỉnh sửa đã bị khóa.
    </div>

    <div class="toolbar-container">
      <div class="tool-group time-group">
        <label>🕒 Thời điểm xem:</label>
        <input 
          type="datetime-local" 
          v-model="selectedTime" 
          class="time-input"
          :class="{ 'is-past': isPastMode }"
        >
        <button v-if="isPastMode" class="btn-reset" @click="resetToNow">
          Về hiện tại
        </button>
      </div>

      <div class="tool-group filter-group">
        <label>🌪 Lọc trạng thái:</label>
        <select v-model="filterStatus" class="filter-select">
          <option value="ALL">Tất cả</option>
          <option value="AVAILABLE">Trống</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="RESERVED">Đã đặt</option>
          <option value="OCCUPIED">Có khách</option>
          <option value="DISABLED">Bảo trì</option>
        </select>
      </div>
    </div>

    <div class="status-legend">
      <div class="legend-item available"><span class="dot"></span> Trống</div>
      <div class="legend-item pending"><span class="dot"></span> Chờ duyệt</div>
      <div class="legend-item reserved"><span class="dot"></span> Đã đặt</div>
      <div class="legend-item occupied"><span class="dot"></span> Có khách</div>
      <div class="legend-item disabled"><span class="dot"></span> Bảo trì</div>
    </div>

    <div class="map-area">
      <TableMap 
        :tables="filteredTables" 
        mode="admin" 
        :readOnly="isPastMode"
        @click-table="handleAdminAction" 
      />
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

// --- LOGIC THỜI GIAN ---
const getNowString = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};
const selectedTime = ref(getNowString());
const resetToNow = () => selectedTime.value = getNowString();

const isPastMode = computed(() => {
  const selected = new Date(selectedTime.value).getTime();
  const now = new Date().getTime();
  return selected < (now - 5 * 60 * 1000); 
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
</script>

<style scoped>
.manage-page {
  padding: 24px;
  background-color: #f4f6f8;
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
}
.page-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
}
.header-left h2 { margin: 0; font-size: 1.8rem; color: #2c3e50; }
.subtitle { color: #7f8c8d; margin: 4px 0 0; font-size: 0.95rem; }

.btn-add {
  background: #2ecc71; color: white; border: none; padding: 10px 20px;
  border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;
  transition: transform 0.2s;
}
.btn-add:hover { background: #27ae60; transform: translateY(-2px); }

.toolbar-container {
  background: white; padding: 16px 20px; border-radius: 12px;
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 16px;
}
.tool-group { display: flex; align-items: center; gap: 10px; }
.tool-group label { font-weight: 600; color: #34495e; font-size: 0.9rem; }
.time-input, .filter-select {
  padding: 8px 12px; border: 1px solid #dfe6e9; border-radius: 6px; outline: none;
}
.time-input.is-past { border-color: #e67e22; background: #fff3e0; }
.btn-reset {
  font-size: 0.8rem; color: #e67e22; background: none; border: 1px solid #e67e22; padding: 4px 8px; border-radius: 4px; cursor: pointer;
}

/* UPDATE: LEGEND CSS */
.status-legend {
  display: flex; justify-content: center; gap: 24px; margin-bottom: 20px; flex-wrap: wrap;
}
.legend-item {
  display: flex; align-items: center; gap: 6px; font-size: 0.9rem; font-weight: 500; color: #555;
}
.dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; border: 1px solid rgba(0,0,0,0.1); }

.legend-item.available .dot { background-color: #20c997; } /* Teal */
.legend-item.pending .dot { background-color: #7950f2; }   /* Purple */
.legend-item.reserved .dot { background-color: #fab005; }  /* Yellow */
.legend-item.occupied .dot { background-color: #fa5252; }  /* Red */
.legend-item.disabled .dot { background-color: #868e96; }  /* Grey */

.history-banner {
  background: #fff3cd; color: #856404; text-align: center; padding: 10px;
  border-radius: 8px; margin-bottom: 20px; font-weight: bold; border: 1px solid #ffeeba;
}
.map-area {
  background: white; padding: 20px; border-radius: 16px; min-height: 400px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
</style>

<style>
.swal-custom-actions { gap: 15px !important; margin-top: 25px !important; }
.btn-swal-edit, .btn-swal-delete, .btn-swal-cancel {
    padding: 12px 24px !important; font-weight: 600 !important; border-radius: 10px !important;
    font-size: 1rem !important; border: none !important; cursor: pointer !important;
    transition: all 0.2s ease-in-out !important; box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
    outline: none !important; display: inline-flex !important; align-items: center !important; justify-content: center !important;
}
.btn-swal-edit:hover, .btn-swal-delete:hover, .btn-swal-cancel:hover { transform: translateY(-3px) !important; }
.btn-swal-edit { background: linear-gradient(135deg, #228be6, #1c7ed6) !important; color: white !important; }
.btn-swal-edit:hover { box-shadow: 0 8px 15px rgba(34, 139, 230, 0.3) !important; }
.btn-swal-delete { background: linear-gradient(135deg, #fa5252, #e03131) !important; color: white !important; }
.btn-swal-delete:hover { box-shadow: 0 8px 15px rgba(250, 82, 82, 0.3) !important; }
.btn-swal-cancel { background-color: #e9ecef !important; color: #495057 !important; }
.btn-swal-cancel:hover { background-color: #dee2e6 !important; color: #212529 !important; }
</style>