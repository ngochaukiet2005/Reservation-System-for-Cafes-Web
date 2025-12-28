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
import { useTableStore } from '../../store/tableStore'; // Import tương đối
import TableMap from '../../components/map/TableMap.vue'; // Import tương đối
import Swal from 'sweetalert2';

const store = useTableStore();
onMounted(() => store.initRealTimeListener());

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
  return store.tables.filter(table => {
    return filterStatus.value === 'ALL' || table.status === filterStatus.value;
  });
});

// --- ACTIONS ---

// 1. Thêm bàn mới
const openAddModal = async () => {
  const { value: form } = await Swal.fire({
    title: 'Thêm bàn mới',
    html: `
      <input id="swal-label" class="swal2-input" placeholder="Tên bàn">
      <input id="swal-seats" type="number" min="1" class="swal2-input" placeholder="Số ghế">
    `,
    showCancelButton: true,
    confirmButtonText: 'Tạo bàn',
    preConfirm: () => {
      const label = (document.getElementById('swal-label') as HTMLInputElement).value;
      const seats = parseInt((document.getElementById('swal-seats') as HTMLInputElement).value);
      if (!label || isNaN(seats) || seats < 1) {
        return Swal.showValidationMessage('Vui lòng nhập tên và số ghế lớn hơn 0');
      }
      return { label, seats };
    }
  });

  if (form) {
    store.addTable(form);
    Swal.fire({ icon: 'success', title: 'Đã thêm bàn!', timer: 1000, showConfirmButton: false });
  }
};

// 2. Logic Admin click bàn (Xử lý chặt chẽ)
const handleAdminAction = async (table: any) => {
  // CHỈ CHO PHÉP SỬA NẾU LÀ 'AVAILABLE' HOẶC 'DISABLED'
  const editableStatus = ['AVAILABLE', 'DISABLED'];
  
  if (!editableStatus.includes(table.status)) {
    return Swal.fire({
      icon: 'warning',
      title: 'Không thể can thiệp',
      text: `Bàn đang ở trạng thái "${table.status}". Chỉ bàn Trống hoặc Bảo trì mới có thể thay đổi thiết lập.`,
      confirmButtonText: 'Đã hiểu'
    });
  }

  // Mở Popup chọn hành động
  const { value: action } = await Swal.fire({
    title: `Quản lý ${table.label}`,
    text: `Trạng thái hiện tại: ${table.status}`,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: '📝 Sửa thông tin',
    denyButtonText: '🗑️ Xóa bàn',
    cancelButtonText: 'Đóng',
    
    // Custom Class cho đẹp
    customClass: {
      actions: 'swal-custom-actions',
      confirmButton: 'btn-swal-edit',
      denyButton: 'btn-swal-delete',
      cancelButton: 'btn-swal-cancel'
    },
    buttonsStyling: false // Tắt style mặc định
  });

  if (action === true) {
    // Popup Sửa (Chỉ cho chọn Trống hoặc Bảo trì)
    const { value: updates } = await Swal.fire({
      title: 'Cập nhật bàn',
      html: `
        <div style="text-align:left">
          <label>Tên bàn:</label>
          <input id="edit-label" class="swal2-input" value="${table.label}">
          <label>Số ghế:</label>
          <input id="edit-seats" type="number" min="1" class="swal2-input" value="${table.seats}">
          <label>Trạng thái:</label>
          <select id="edit-status" class="swal2-select" style="width:100%; margin-top:5px;">
            <option value="AVAILABLE" ${table.status === 'AVAILABLE' ? 'selected' : ''}>🟢 Trống (Available)</option>
            <option value="DISABLED" ${table.status === 'DISABLED' ? 'selected' : ''}>⚫ Bảo trì (Disabled)</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const label = (document.getElementById('edit-label') as HTMLInputElement).value;
        const seats = parseInt((document.getElementById('edit-seats') as HTMLInputElement).value);
        const status = (document.getElementById('edit-status') as HTMLSelectElement).value;
        
        if (!label || isNaN(seats) || seats < 1) {
          return Swal.showValidationMessage('Thông tin không hợp lệ');
        }
        return { label, seats, status };
      }
    });

    if (updates) {
      store.updateTable(table.id, updates);
      Swal.fire({ icon: 'success', title: 'Cập nhật thành công', timer: 1000, showConfirmButton: false });
    }

  } else if (action === false) {
    // Xóa bàn
    Swal.fire({
      title: 'Xóa bàn này?',
      text: "Hành động này không thể hoàn tác!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa luôn!',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        store.deleteTable(table.id);
        Swal.fire('Đã xóa!', '', 'success');
      }
    });
  }
};
</script>

<style scoped>
/* CSS CỤC BỘ (Layout, Toolbar, Legend...) */
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

.status-legend {
  display: flex; justify-content: center; gap: 24px; margin-bottom: 20px; flex-wrap: wrap;
}
.legend-item {
  display: flex; align-items: center; gap: 6px; font-size: 0.9rem; font-weight: 500; color: #555;
}
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.legend-item.available .dot { background-color: #20c997; }
.legend-item.pending .dot { background-color: #7950f2; }
.legend-item.occupied .dot { background-color: #fa5252; }
.legend-item.reserved .dot { background-color: #fab005; }
.legend-item.disabled .dot { background-color: #868e96; }

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
.swal-custom-actions {
    gap: 15px !important; margin-top: 25px !important;
}
.btn-swal-edit, .btn-swal-delete, .btn-swal-cancel {
    padding: 12px 24px !important; font-weight: 600 !important; border-radius: 10px !important;
    font-size: 1rem !important; border: none !important; cursor: pointer !important;
    transition: all 0.2s ease-in-out !important; box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
    outline: none !important; display: inline-flex !important; align-items: center !important; justify-content: center !important;
}
.btn-swal-edit:hover, .btn-swal-delete:hover, .btn-swal-cancel:hover {
    transform: translateY(-3px) !important;
}
/* Màu sắc */
.btn-swal-edit { background: linear-gradient(135deg, #228be6, #1c7ed6) !important; color: white !important; }
.btn-swal-edit:hover { box-shadow: 0 8px 15px rgba(34, 139, 230, 0.3) !important; }

.btn-swal-delete { background: linear-gradient(135deg, #fa5252, #e03131) !important; color: white !important; }
.btn-swal-delete:hover { box-shadow: 0 8px 15px rgba(250, 82, 82, 0.3) !important; }

.btn-swal-cancel { background-color: #e9ecef !important; color: #495057 !important; }
.btn-swal-cancel:hover { background-color: #dee2e6 !important; color: #212529 !important; }
</style>