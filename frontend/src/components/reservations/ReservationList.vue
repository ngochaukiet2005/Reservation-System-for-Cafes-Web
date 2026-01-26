<template>
  <div class="reservation-list">
    <table v-if="items.length > 0">
      <thead>
        <tr>
          <th>Mã #</th>
          <th>Khách hàng</th>
          <th>Thời gian</th>
          <th>Khách</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>{{ item.id }}</td>
          <td>
            <strong>{{ item.guestName }}</strong><br/>
            <small>{{ item.phone }}</small>
          </td>
          <td>{{ formatTime(item.time) }}</td>
          <td>{{ item.people }}</td>
          <td>
            <span :class="['badge', item.status.toLowerCase()]">{{ item.status }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="empty-state">Chưa có lịch sử đặt bàn nào.</p>
  </div>
</template>

<script setup lang="ts">
import type { Reservation } from '../../store/reservationStore';

defineProps<{ items: Reservation[] }>();

const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleString('vi-VN');
};
</script>

<style scoped>
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
th { background-color: #f4f4f4; }
.badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; color: white; font-weight: bold;}
.badge.pending { background-color: #f1c40f; color: #333; }
.badge.confirmed { background-color: #2ecc71; }
.badge.cancelled { background-color: #e74c3c; }
.badge.completed { background-color: #3498db; }
.badge.expired { background-color: #95a5a6; }
.empty-state { text-align: center; color: #666; margin-top: 20px; font-style: italic; }
</style>