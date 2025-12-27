import { defineStore } from 'pinia';
import { ref } from 'vue';

// Định nghĩa cấu trúc dữ liệu Bàn
export interface Table {
  id: number;
  name: string;
  x: number;      // Tọa độ X (%)
  y: number;      // Tọa độ Y (%)
  seats: number;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'DISABLED';
  type: 'CIRCLE' | 'SQUARE' | 'RECTANGLE'; // Hình dáng
  area?: string;
}

export const useTableStore = defineStore('table', () => {
  // 1. Dữ liệu bàn (Mock Initial Data)
  const tables = ref<Table[]>([
    { id: 1, name: 'Bàn 01', x: 10, y: 15, seats: 2, status: 'AVAILABLE', type: 'CIRCLE', area: 'Ngoài trời' },
    { id: 2, name: 'Bàn 02', x: 30, y: 15, seats: 4, status: 'OCCUPIED', type: 'SQUARE', area: 'Ngoài trời' },
    { id: 3, name: 'VIP 1', x: 80, y: 30, seats: 8, status: 'RESERVED', type: 'RECTANGLE', area: 'Phòng lạnh' },
    { id: 4, name: 'Bàn 03', x: 10, y: 50, seats: 2, status: 'AVAILABLE', type: 'CIRCLE', area: 'Ngoài trời' },
    { id: 5, name: 'Bàn 04', x: 50, y: 50, seats: 4, status: 'AVAILABLE', type: 'SQUARE', area: 'Sảnh chính' },
  ]);

  // 2. Kênh giao tiếp Real-time (Giả lập Socket)
  const channel = new BroadcastChannel('cafe_realtime_channel');

  // Lắng nghe sự kiện từ tab khác
  channel.onmessage = (event) => {
    const { action, payload } = event.data;
    if (action === 'UPDATE_TABLES') {
      tables.value = payload; // Cập nhật ngay lập tức UI
    }
  };

  // Hàm gửi tín hiệu cho các tab khác
  const broadcastChange = () => {
    channel.postMessage({
      action: 'UPDATE_TABLES',
      payload: JSON.parse(JSON.stringify(tables.value))
    });
  };

  // 3. Actions (Thao tác dữ liệu)
  const addTable = (table: Table) => {
    tables.value.push(table);
    broadcastChange();
  };

  const updateTable = (updatedTable: Table) => {
    const index = tables.value.findIndex(t => t.id === updatedTable.id);
    if (index !== -1) {
      tables.value[index] = updatedTable;
      broadcastChange();
    }
  };

  const deleteTable = (id: number) => {
    tables.value = tables.value.filter(t => t.id !== id);
    broadcastChange();
  };

  return { tables, addTable, updateTable, deleteTable };
});