<template>
  <div class="map-wrapper">
    <div v-if="tables.length === 0" class="empty-state">
      <span class="icon">🔍</span>
      <p>Không tìm thấy bàn nào phù hợp.</p>
    </div>

    <div v-else class="grid-layout">
      <div 
        v-for="table in tables" 
        :key="table.id"
        class="table-card"
        :class="[
          (table.status || '').toLowerCase(), 
          { 'is-readonly': readOnly },
          { 'is-selected': selectedId === table.id }
        ]"
        @click="handleClick(table)"
      >
        <div class="card-body">
          <span class="table-icon">☕</span>
          <h3 class="table-name">{{ table.name || table.label }}</h3>
          
          <p class="table-info">👤 {{ table.capacity || table.seats }} chỗ</p>
        </div>

        <div class="status-indicator">
          {{ getStatusLabel(table.status) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

// Định nghĩa interface linh hoạt để nhận data từ cả 2 store
interface TableProps {
  id: number | string;
  label?: string;
  name?: string;
  seats?: number;
  capacity?: number;
  status: string;
}

const props = defineProps<{
  tables: TableProps[];
  mode: 'admin' | 'staff' | 'customer';
  readOnly?: boolean;
  selectedId?: number | string | null; // Prop để highlight bàn đang chọn (Customer)
}>();

const emit = defineEmits(['click-table']);

const getStatusLabel = (s: string) => {
  const map: any = { 
    AVAILABLE: '🟢 Trống', 
    RESERVED: '🟠 Có khách đặt', 
    OCCUPIED: '🔴 Có khách', 
    DISABLED: '⚪ Bảo trì',
    PENDING: '🟡 Chờ duyệt',
    MAINTENANCE: '⚪ Bảo trì'
  };
  return map[s] || s;
};

const handleClick = (table: any) => {
  if (props.readOnly) return;

  // Logic phân quyền click
  if (props.mode === 'admin') {
    emit('click-table', table);
  } 
  else if (props.mode === 'staff') {
    emit('click-table', table); // Staff được click mọi bàn để xử lý
  }
  else if (props.mode === 'customer') {
    // Khách chỉ được click bàn trống
    if (table.status === 'AVAILABLE') {
      emit('click-table', table);
    }
  }
};
</script>

<style scoped>
.map-wrapper {
  background: #fff;
  border-radius: 12px;
  min-height: 200px;
}

.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 20px;
}

.table-card {
  position: relative;
  aspect-ratio: 1;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.table-card:not(.is-readonly):hover { 
  transform: translateY(-4px); 
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
}

/* --- BỘ MÀU ĐỒNG BỘ (Unified Palette) --- */

/* 1. AVAILABLE - Xanh Teal */
.table-card.available { border-color: #20c997; }
.table-card.available .table-icon { color: #20c997; }
.table-card.available .status-indicator { background: #e6fcf5; color: #0ca678; }

/* 2. PENDING - Tím (Khác biệt hẳn với Vàng) */
.table-card.pending { 
  border-color: #7950f2; 
  background: #f3f0ff;
  animation: pulse 2s infinite;
}
.table-card.pending .table-icon { color: #7950f2; }
.table-card.pending .status-indicator { background: #e5dbff; color: #5f3dc4; }

/* 3. RESERVED - Vàng */
.table-card.reserved { border-color: #fab005; background: #fff9db; }
.table-card.reserved .table-icon { color: #fab005; }
.table-card.reserved .status-indicator { background: #fff3bf; color: #f08c00; }

/* 4. OCCUPIED - Đỏ */
.table-card.occupied { border-color: #fa5252; background: #fff5f5; }
.table-card.occupied .table-icon { color: #fa5252; }
.table-card.occupied .status-indicator { background: #ffe3e3; color: #c92a2a; }

/* 5. DISABLED / MAINTENANCE - Xám */
.table-card.disabled, .table-card.maintenance { 
  border-color: #ced4da; background: #f8f9fa; opacity: 0.8; cursor: not-allowed; 
}
.table-card.disabled .status-indicator, .table-card.maintenance .status-indicator { 
  background: #e9ecef; color: #495057; 
}

/* 6. SELECTED (Customer) - Xanh Lá Tươi */
.table-card.is-selected {
  border-color: #2ecc71; 
  background: #e8f5e9; 
  box-shadow: 0 0 0 4px rgba(46, 204, 113, 0.3); 
  transform: translateY(-4px);
  z-index: 2;
}
.table-card.is-selected .status-indicator {
  background: #2ecc71; color: white; font-weight: bold;
}

.card-body { text-align: center; }
.table-icon { font-size: 1.5rem; display: block; margin-bottom: 5px; }
.table-name { font-size: 1.1rem; font-weight: 700; margin: 0; color: #343a40; }
.table-info { font-size: 0.8rem; color: #868e96; margin: 2px 0 0; }

.status-indicator {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  padding: 4px 0;
}

.empty-state { text-align: center; color: #adb5bd; margin-top: 50px; }
.empty-state .icon { font-size: 3rem; }

@keyframes pulse { 
  0% { box-shadow: 0 0 0 0 rgba(121, 80, 242, 0.4); } 
  70% { box-shadow: 0 0 0 10px rgba(121, 80, 242, 0); } 
  100% { box-shadow: 0 0 0 0 rgba(121, 80, 242, 0); } 
}
</style>