<script setup lang="ts">
import { useTableStore, type Table } from '../../store/tableStore';

const props = defineProps<{
  mode: 'ADMIN' | 'STAFF' | 'CUSTOMER'; // Chế độ hiển thị
}>();

const emit = defineEmits(['select-table', 'edit-table']);
const tableStore = useTableStore();

// --- Logic Kéo Thả (Chỉ dành cho Admin) ---
const startDrag = (event: DragEvent, table: Table) => {
  if (props.mode !== 'ADMIN') return;
  if (event.dataTransfer) {
    event.dataTransfer.setData('tableId', table.id.toString());
    event.dataTransfer.effectAllowed = 'move';
  }
};

const onDrop = (event: DragEvent) => {
  if (props.mode !== 'ADMIN') return;
  const tableId = Number(event.dataTransfer?.getData('tableId'));
  const table = tableStore.tables.find(t => t.id === tableId);
  
  if (table) {
    // Tính toán tọa độ % mới dựa trên khung chứa (Map Container)
    const mapRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    
    // Tính % tương đối để responsive trên mọi màn hình
    let newX = ((event.clientX - mapRect.left) / mapRect.width) * 100;
    let newY = ((event.clientY - mapRect.top) / mapRect.height) * 100;

    // Giới hạn không cho kéo ra ngoài khung (0% - 95%)
    newX = Math.max(0, Math.min(newX, 90));
    newY = Math.max(0, Math.min(newY, 90));

    // Cập nhật Store
    tableStore.updateTable({ ...table, x: newX, y: newY });
  }
};

// --- Xử lý Click ---
const handleTableClick = (table: Table) => {
  // Admin: Click để sửa thông tin
  if (props.mode === 'ADMIN') {
    emit('edit-table', table);
  } 
  // Customer: Chỉ được chọn bàn trống
  else if (props.mode === 'CUSTOMER') {
    if (table.status === 'AVAILABLE') emit('select-table', table);
    else alert('Bàn này đã có người đặt hoặc đang sử dụng!');
  } 
  // Staff: Chọn bàn để xử lý (Order/Check-in...)
  else {
    emit('select-table', table);
  }
};

// --- Helper Màu Sắc ---
const getStatusColor = (status: string) => {
  switch(status) {
    case 'AVAILABLE': return '#2ecc71'; // Xanh lá
    case 'RESERVED': return '#f1c40f';  // Vàng
    case 'OCCUPIED': return '#e74c3c';  // Đỏ
    case 'DISABLED': return '#95a5a6';  // Xám
    default: return '#bdc3c7';
  }
};
</script>

<template>
  <div 
    class="cafe-map" 
    @dragover.prevent 
    @drop="onDrop"
  >
    <div class="grid-lines" v-if="mode === 'ADMIN'"></div>

    <div 
      v-for="table in tableStore.tables" 
      :key="table.id"
      class="table-node"
      :class="[table.type.toLowerCase(), { 'draggable': mode === 'ADMIN' }]"
      :style="{ 
        left: table.x + '%', 
        top: table.y + '%',
        backgroundColor: getStatusColor(table.status)
      }"
      :draggable="mode === 'ADMIN'"
      @dragstart="startDrag($event, table)"
      @click.stop="handleTableClick(table)"
    >
      <span class="table-name">{{ table.name }}</span>
      
      <div class="seats-badge">
        <span>{{ table.seats }}</span>
        <span class="icon-user">👤</span>
      </div>

      <div class="tooltip" v-if="mode !== 'ADMIN'">
        {{ table.area }} - {{ table.status }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.cafe-map {
  width: 100%;
  height: 600px; /* Chiều cao cố định của bản đồ */
  background-color: #fdfbf7; /* Màu nền nhẹ */
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.02);
  user-select: none;
}

.grid-lines {
  position: absolute; inset: 0; pointer-events: none;
  background-image: linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px);
  background-size: 40px 40px; opacity: 0.6;
}

/* --- Style cho Table Node --- */
.table-node {
  position: absolute;
  transform: translate(0, 0); /* Mặc định */
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: white; font-weight: 600; font-size: 0.85rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  cursor: pointer; transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 10; border: 2px solid rgba(255,255,255,0.3);
}

.table-node:hover { transform: scale(1.1); z-index: 100; box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
.table-node.draggable { cursor: move; }
.table-node.draggable:active { cursor: grabbing; transform: scale(1.05); opacity: 0.9; }

/* Các hình dáng bàn */
.circle { width: 80px; height: 80px; border-radius: 50%; }
.square { width: 80px; height: 80px; border-radius: 12px; }
.rectangle { width: 140px; height: 80px; border-radius: 12px; }

.table-name { text-shadow: 0 1px 2px rgba(0,0,0,0.3); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90%; }

.seats-badge { 
  font-size: 0.75rem; background: rgba(0,0,0,0.2); 
  padding: 2px 8px; border-radius: 12px; 
  display: flex; align-items: center; gap: 2px;
}
.icon-user { font-size: 0.7rem; }

/* Tooltip đơn giản */
.tooltip {
  position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%);
  background: #333; color: white; padding: 5px 10px; border-radius: 4px;
  font-size: 0.75rem; white-space: nowrap; opacity: 0; pointer-events: none; transition: 0.2s;
}
.table-node:hover .tooltip { opacity: 1; bottom: 120%; }
</style>