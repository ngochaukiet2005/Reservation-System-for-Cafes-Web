// src/store/tableStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getSocket } from '../realtime/socket';

export interface Table {
  id: string;
  name: string;
  seats: number;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'DISABLED' | 'PENDING';
}

export const useTableStore = defineStore('table', () => {
  const tables = ref<Table[]>([]);

  // Fetch tables từ API
  const fetchTables = async () => {
    try {
      const response = await fetch('http://localhost:3000/tables', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        tables.value = data.data || [];
      }
    } catch (error) {
      console.error('[tableStore] Error fetching tables:', error);
    }
  };

  // Listen socket để cập nhật table khi reservation thay đổi
  const initRealTimeListener = () => {
    const socket = getSocket();
    
<<<<<<< HEAD
    // Khi BẤT CỨ ai đặt/hủy/cập nhật reservation → TẤT CẢ khách hàng cập nhật lại tables
=======
    // Khi table.updated → cập nhật table cụ thể trong danh sách
    socket.on('table.updated', (updatedTable: any) => {
      console.log('[tableStore] Table updated:', updatedTable);
      if (updatedTable && updatedTable.id) {
        const index = tables.value.findIndex((t) => t.id === updatedTable.id);
        if (index !== -1) {
          // Cập nhật table trong danh sách
          tables.value[index] = {
            id: updatedTable.id,
            name: updatedTable.name,
            seats: updatedTable.capacity,
            status: updatedTable.status?.name || 'AVAILABLE',
          };
          console.log(`[tableStore] Updated table ${updatedTable.id} to status ${updatedTable.status?.name}`);
        }
      }
    });
    
    // Khi reservation created/updated/cancelled/expired → cập nhật lại tables
>>>>>>> f473ebfa99a075f4360f2668165ead0180386442
    socket.on('reservation.created', () => {
      console.log('[tableStore] Reservation created by someone, refetching tables for all users');
      fetchTables();
    });
    
    socket.on('reservation.updated', () => {
      console.log('[tableStore] Reservation updated, refetching tables for all users');
      fetchTables();
    });
    
    socket.on('reservation.cancelled', () => {
      console.log('[tableStore] Reservation cancelled, refetching tables for all users');
      fetchTables();
    });
    
    socket.on('reservation.expired', () => {
      console.log('[tableStore] Reservation expired, refetching tables for all users');
      fetchTables();
    });

    // Cũng listen trực tiếp table.updated event nếu có
    socket.on('table.updated', (data: any) => {
      console.log('[tableStore] Table updated directly:', data);
      fetchTables();
    });
  };

  const addTable = async (newTable: Omit<Table, 'id' | 'status'>) => {
    try {
      const response = await fetch('http://localhost:3000/tables', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTable),
      });
      if (response.ok) {
        await fetchTables();
      }
    } catch (error) {
      console.error('[tableStore] Error adding table:', error);
    }
  };

  const updateTable = async (id: string, updates: Partial<Table>) => {
    try {
      const response = await fetch(`http://localhost:3000/tables/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        await fetchTables();
      }
    } catch (error) {
      console.error('[tableStore] Error updating table:', error);
    }
  };

  const deleteTable = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/tables/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
        },
      });
      if (response.ok) {
        await fetchTables();
      }
    } catch (error) {
      console.error('[tableStore] Error deleting table:', error);
    }
  };

  return { 
    tables, 
    fetchTables,
    initRealTimeListener, 
    addTable, 
    updateTable, 
    deleteTable 
  };
});