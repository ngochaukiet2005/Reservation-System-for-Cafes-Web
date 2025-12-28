// src/store/tableStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Table {
  id: number;
  label: string;
  seats: number;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'DISABLED';
  // Đã xóa trường zone
}

export const useTableStore = defineStore('table', () => {
  // 1. STATE: Mock Data (Xóa zone)
  const tables = ref<Table[]>([
    { id: 1, label: 'Bàn 01', seats: 4, status: 'AVAILABLE' },
    { id: 2, label: 'Bàn 02', seats: 2, status: 'OCCUPIED' },
    { id: 3, label: 'Bàn 03', seats: 6, status: 'RESERVED' },
    { id: 4, label: 'Bàn 04', seats: 4, status: 'AVAILABLE' },
    { id: 5, label: 'Bàn 05', seats: 8, status: 'DISABLED' },
  ]);

  const syncToStorage = () => {
    localStorage.setItem('cafes_tables_sync', JSON.stringify(tables.value));
  };

  // 2. ACTIONS
  const initRealTimeListener = () => {
    const saved = localStorage.getItem('cafes_tables_sync');
    if (saved) tables.value = JSON.parse(saved);

    window.addEventListener('storage', (event) => {
      if (event.key === 'cafes_tables_sync' && event.newValue) {
        tables.value = JSON.parse(event.newValue);
      }
    });
  };

  const addTable = (newTable: Omit<Table, 'id' | 'status'>) => {
    const maxId = tables.value.length > 0 ? Math.max(...tables.value.map(t => t.id)) : 0;
    tables.value.push({
      id: maxId + 1,
      ...newTable,
      status: 'AVAILABLE'
    });
    syncToStorage();
  };

  const updateTable = (id: number, updates: Partial<Table>) => {
    const index = tables.value.findIndex(t => t.id === id);
    if (index !== -1) {
      tables.value[index] = { ...tables.value[index], ...updates };
      syncToStorage();
    }
  };

  const deleteTable = (id: number) => {
    tables.value = tables.value.filter(t => t.id !== id);
    syncToStorage();
  };

  return { tables, initRealTimeListener, addTable, updateTable, deleteTable };
});