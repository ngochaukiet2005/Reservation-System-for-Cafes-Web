<script setup lang="ts">
import { ref } from 'vue';
import TableMap from '../../components/map/TableMap.vue';
import AppButton from '../../components/common/AppButton.vue';
import { useTableStore, type Table } from '../../store/tableStore';

const tableStore = useTableStore();
const isModalOpen = ref(false);
const editingTable = ref<Partial<Table>>({}); // Object tạm để binding form

// Mở form thêm mới
const openAddModal = () => {
  editingTable.value = {
    id: Date.now(), // ID tạm thời
    name: 'Bàn Mới',
    x: 5, y: 5, // Vị trí mặc định ở góc trên trái
    seats: 4,
    status: 'AVAILABLE',
    type: 'SQUARE',
    area: 'Trong nhà'
  };
  isModalOpen.value = true;
};

// Mở form sửa khi click vào bàn
const handleEditTable = (table: Table) => {
  editingTable.value = { ...table }; // Clone ra để không sửa trực tiếp vào store
  isModalOpen.value = true;
};

// Lưu thông tin
const saveTable = () => {
  if (editingTable.value.id) {
    // Check nếu ID đã tồn tại thì là Update, chưa thì là Add
    const exists = tableStore.tables.some(t => t.id === editingTable.value.id);
    if (exists) {
      tableStore.updateTable(editingTable.value as Table);
    } else {
      tableStore.addTable(editingTable.value as Table);
    }
  }
  isModalOpen.value = false;
};

// Xóa bàn
const handleDelete = () => {
  if (editingTable.value.id && confirm('Bạn có chắc muốn xóa bàn này?')) {
    tableStore.deleteTable(editingTable.value.id);
    isModalOpen.value = false;
  }
};
</script>

<template>
  <div class="manage-tables-view">
    <div class="header-actions">
      <div class="title-section">
        <h3>Sơ đồ & Vị trí Bàn</h3>
        <p class="subtitle">Kéo thả để sắp xếp vị trí bàn trong quán</p>
      </div>
      
      <div class="controls">
        <div class="legend">
          <span class="dot available"></span> Trống
          <span class="dot reserved"></span> Đặt trước
          <span class="dot occupied"></span> Đang dùng
        </div>
        <AppButton variant="primary" @click="openAddModal">
          + Thêm Bàn Mới
        </AppButton>
      </div>
    </div>

    <div class="map-wrapper">
      <TableMap 
        mode="ADMIN" 
        @edit-table="handleEditTable" 
      />
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="isModalOpen = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingTable.id ? 'Chỉnh sửa bàn' : 'Thêm bàn mới' }}</h3>
          <button class="close-btn" @click="isModalOpen = false">✕</button>
        </div>
        
        <div class="form-body">
          <div class="form-group">
            <label>Tên bàn</label>
            <input v-model="editingTable.name" type="text" placeholder="Ví dụ: Bàn 01" />
          </div>
          
          <div class="row">
            <div class="form-group">
              <label>Số ghế</label>
              <input v-model.number="editingTable.seats" type="number" min="1" />
            </div>
            <div class="form-group">
              <label>Khu vực</label>
              <select v-model="editingTable.area">
                <option>Trong nhà</option>
                <option>Ngoài trời</option>
                <option>Phòng lạnh</option>
                <option>Sân thượng</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Hình dáng</label>
            <div class="shape-options">
              <label :class="{ active: editingTable.type === 'CIRCLE' }">
                <input type="radio" value="CIRCLE" v-model="editingTable.type"> Tròn
              </label>
              <label :class="{ active: editingTable.type === 'SQUARE' }">
                <input type="radio" value="SQUARE" v-model="editingTable.type"> Vuông
              </label>
              <label :class="{ active: editingTable.type === 'RECTANGLE' }">
                <input type="radio" value="RECTANGLE" v-model="editingTable.type"> Chữ nhật
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>Trạng thái hiện tại</label>
            <select v-model="editingTable.status" class="status-select" :class="editingTable.status?.toLowerCase()">
              <option value="AVAILABLE">🟢 Trống (Available)</option>
              <option value="RESERVED">🟡 Đã đặt (Reserved)</option>
              <option value="OCCUPIED">🔴 Đang dùng (Occupied)</option>
              <option value="DISABLED">⚪ Bảo trì (Disabled)</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-delete" @click="handleDelete" v-if="editingTable.id">Xóa bàn</button>
          <div class="right-actions">
            <button class="btn-cancel" @click="isModalOpen = false">Hủy</button>
            <button class="btn-save" @click="saveTable">Lưu thay đổi</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.manage-tables-view { display: flex; flex-direction: column; height: 100%; gap: 15px; }
.header-actions { display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px 20px; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.title-section h3 { margin: 0; color: #2c3e50; }
.subtitle { margin: 5px 0 0; font-size: 0.85rem; color: #7f8c8d; }

.controls { display: flex; align-items: center; gap: 20px; }
.legend { display: flex; gap: 15px; font-size: 0.9rem; color: #555; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 5px; }
.available { background: #2ecc71; } .reserved { background: #f1c40f; } .occupied { background: #e74c3c; }

.map-wrapper { flex: 1; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; background: white; }

/* Modal Styles */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.modal-content { background: white; width: 400px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); overflow: hidden; animation: slideDown 0.2s ease-out; }
.modal-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; }
.modal-header h3 { margin: 0; font-size: 1.1rem; }
.close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #999; }

.form-body { padding: 20px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem; color: #34495e; }
.form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
.row { display: flex; gap: 10px; }
.row .form-group { flex: 1; }

.shape-options { display: flex; gap: 10px; }
.shape-options label { flex: 1; border: 1px solid #ddd; text-align: center; padding: 8px; border-radius: 6px; cursor: pointer; transition: 0.2s; font-size: 0.9rem; }
.shape-options label:hover { background: #f9f9f9; }
.shape-options label.active { border-color: #42b983; color: #42b983; background: #e8f5e9; font-weight: 600; }
.shape-options input { display: none; }

.modal-footer { padding: 15px 20px; background: #f8f9fa; border-top: 1px solid #eee; display: flex; justify-content: space-between; }
.right-actions { display: flex; gap: 10px; }
.btn-save { background: #42b983; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
.btn-cancel { background: white; border: 1px solid #ddd; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.btn-delete { background: #ff7675; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }

@keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>