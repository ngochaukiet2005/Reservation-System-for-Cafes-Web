// src/store/tableStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { getSocket } from "../realtime/socket";

export interface Table {
  id: string;
  name: string;
  seats: number;
  status: "AVAILABLE" | "RESERVED" | "OCCUPIED" | "DISABLED" | "PENDING";
}

export const useTableStore = defineStore("table", () => {
  const tables = ref<Table[]>([]);

  // Fetch tables từ API
  const fetchTables = async () => {
    try {
      const response = await fetch("http://localhost:3000/tables", {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("auth_token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        tables.value = data.data || [];
      }
    } catch (error) {
      console.error("[tableStore] Error fetching tables:", error);
    }
  };

  // Listen socket để cập nhật table khi reservation thay đổi
  const initRealTimeListener = () => {
    const socket = getSocket();

    // Khi table.updated → cập nhật table cụ thể; nếu không tìm thấy thì refetch toàn bộ
    socket.on("table.updated", (updatedTable: any) => {
      console.log("[tableStore] Table updated:", updatedTable);
      if (updatedTable && updatedTable.id) {
        const index = tables.value.findIndex((t) => t.id === updatedTable.id);
        if (index !== -1) {
          tables.value[index] = {
            id: updatedTable.id,
            name: updatedTable.name,
            seats: updatedTable.capacity,
            status: updatedTable.status?.name || "AVAILABLE",
          };
          console.log(
            `[tableStore] Updated table ${updatedTable.id} to status ${updatedTable.status?.name}`,
          );
          return;
        }
      }
      fetchTables();
    });

    // Khi reservation created/updated/cancelled/expired → cập nhật lại tables
    socket.on("reservation.created", () => {
      console.log(
        "[tableStore] Reservation created by someone, refetching tables for all users",
      );
      fetchTables();
    });

    socket.on("reservation.updated", () => {
      console.log(
        "[tableStore] Reservation updated, refetching tables for all users",
      );
      fetchTables();
    });

    socket.on("reservation.cancelled", () => {
      console.log(
        "[tableStore] Reservation cancelled, refetching tables for all users",
      );
      fetchTables();
    });

    socket.on("reservation.expired", () => {
      console.log(
        "[tableStore] Reservation expired, refetching tables for all users",
      );
      fetchTables();
    });
  };

  const addTable = async (newTable: Omit<Table, "id" | "status">) => {
    try {
      const response = await fetch("http://localhost:3000/tables", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTable),
      });
      if (response.ok) {
        await fetchTables();
      }
    } catch (error) {
      console.error("[tableStore] Error adding table:", error);
    }
  };

  const updateTable = async (id: string, updates: Partial<Table>) => {
    try {
      const response = await fetch(`http://localhost:3000/tables/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        await fetchTables();
      }
    } catch (error) {
      console.error("[tableStore] Error updating table:", error);
    }
  };

  const deleteTable = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/tables/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("auth_token")}`,
        },
      });
      if (response.ok) {
        await fetchTables();
      }
    } catch (error) {
      console.error("[tableStore] Error deleting table:", error);
    }
  };

  return {
    tables,
    fetchTables,
    initRealTimeListener,
    addTable,
    updateTable,
    deleteTable,
  };
});
