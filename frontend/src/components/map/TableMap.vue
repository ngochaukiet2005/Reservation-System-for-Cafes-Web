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
          { 'is-readonly': readOnly }
        ]"
        @click="handleClick(table)"
      >
        <div class="card-body">
          <span class="table-icon">☕</span>
          <h3 class="table-name">{{ table.label }}</h3>
          <p class="table-info">{{ table.seats }} ghế</p>
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
import type { Table } from '../../store/tableStore';

const props = defineProps<{
  tables: Table[];
  mode: 'admin' | 'staff' | 'customer';
  readOnly?: boolean; // Thêm prop này để chặn click
}>();

const emit = defineEmits(['click-table']);

const getStatusLabel = (s: string) => {
  const map: any = { AVAILABLE: 'Trống', RESERVED: 'Đã đặt', OCCUPIED: 'Có khách', DISABLED: 'Bảo trì' };
  return map[s] || s;
};

const handleClick = (table: Table) => {
  // Nếu đang ở chế độ chỉ xem (quá khứ) thì không làm gì cả
  if (props.readOnly) return;

  // Logic cũ
  if (props.mode === 'admin') emit('click-table', table);
  else if (props.mode === 'customer' && table.status === 'AVAILABLE') emit('click-table', table);
  else if (props.mode === 'staff') emit('click-table', table);
};
</script>

<style scoped>
.map-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  min-height: 400px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f3f5;
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

/* Hiệu ứng khi hover (chỉ khi không readonly) */
.table-card:not(.is-readonly):hover { 
  transform: translateY(-4px); 
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
}

/* Style cho Readonly (Quá khứ) */
.table-card.is-readonly {
  opacity: 0.8;
  cursor: not-allowed;
  filter: grayscale(0.2);
}

/* Status Colors */
.table-card.available { border-color: #20c997; }
.table-card.available .table-icon { color: #20c997; }
.table-card.available .status-indicator { background: #e6fcf5; color: #0ca678; }

.table-card.occupied { border-color: #fa5252; background: #fff5f5; }
.table-card.occupied .table-icon { color: #fa5252; }
.table-card.occupied .status-indicator { background: #ffe3e3; color: #c92a2a; }

.table-card.reserved { border-color: #fab005; background: #fff9db; }
.table-card.reserved .table-icon { color: #fab005; }
.table-card.reserved .status-indicator { background: #fff3bf; color: #f08c00; }

.table-card.disabled { border-color: #ced4da; background: #f8f9fa; opacity: 0.7; }
.table-card.disabled .status-indicator { background: #e9ecef; color: #495057; }

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
</style>