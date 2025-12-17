<template>
  <div class="page-container">
    <div class="header">
      <h2>📜 Lịch Sử Đặt Bàn</h2>
      <button class="btn-create" @click="$router.push('/reservation')">+ Đặt bàn mới</button>
    </div>
    
    <div v-if="reservationStore.isLoading" class="loading-state">
      <div class="spinner"></div> Đang tải dữ liệu...
    </div>
    
    <div v-else-if="reservationStore.reservations.length === 0" class="empty-state">
      <p>Bạn chưa có lịch đặt bàn nào.</p>
    </div>

    <div v-else class="table-container">
      <table class="history-table">
        <thead>
          <tr>
            <th>Mã #</th>
            <th>Bàn</th>
            <th>Thời gian</th>
            <th>Khách</th>
            <th>Trạng thái</th>
            <th class="text-right">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="res in reservationStore.reservations" :key="res.id">
            <td>#{{ res.id }}</td>
            <td>
              <div class="table-name">{{ res.tableName || 'Bàn ngẫu nhiên' }}</div>
            </td>
            <td>
              <div>{{ formatDate(res.time) }}</div>
              <div class="time-sub">{{ formatTime(res.time) }}</div>
            </td>
            <td>{{ res.people }} người</td>
            <td>
              <StatusBadge :status="res.status" />
            </td>
            <td class="text-right">
              <button 
                v-if="res.status === 'PENDING'"
                @click="handleCancel(res.id)"
                class="btn-cancel"
              >
                Hủy
              </button>
              <span v-else class="text-gray">--</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { reservationStore } from '../../store/reservationStore';
import StatusBadge from '../../components/common/StatusBadge.vue';

// Format ngày: 20/11/2023
const formatDate = (isoStr: string) => {
  if(!isoStr) return '';
  return new Date(isoStr).toLocaleDateString('vi-VN');
};

// Format giờ: 09:00
const formatTime = (isoStr: string) => {
  if(!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const handleCancel = async (id: number) => {
  if (confirm('Bạn có chắc chắn muốn hủy đơn này không?')) {
    await reservationStore.cancelReservation(id);
    alert('Đã hủy thành công!');
  }
};

onMounted(() => {
  reservationStore.fetchReservations();
});
</script>

<style scoped>
.page-container { padding: 30px; max-width: 1000px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; }

.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.header h2 { margin: 0; color: #2c3e50; font-size: 24px; }

.btn-create {
  background-color: #d4a373; color: white; border: none; padding: 10px 20px;
  border-radius: 6px; cursor: pointer; font-weight: 600; transition: 0.2s;
}
.btn-create:hover { background-color: #b08968; }

.table-container { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #eee; }

.history-table { width: 100%; border-collapse: collapse; min-width: 600px; }
.history-table th { background-color: #f8f9fa; color: #6c757d; font-weight: 600; text-align: left; padding: 15px; border-bottom: 2px solid #eee; }
.history-table td { padding: 15px; border-bottom: 1px solid #eee; color: #333; vertical-align: middle; }
.history-table tr:last-child td { border-bottom: none; }
.history-table tr:hover { background-color: #fafafa; }

.text-right { text-align: right; }
.table-name { font-weight: bold; color: #2c3e50; }
.time-sub { font-size: 0.85em; color: #888; margin-top: 2px; }

.btn-cancel {
  background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca;
  padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;
}
.btn-cancel:hover { background-color: #fecaca; }

.text-gray { color: #ccc; }

.loading-state { text-align: center; padding: 40px; color: #666; }
.empty-state { text-align: center; padding: 40px; border: 2px dashed #eee; border-radius: 8px; color: #888; }
</style>