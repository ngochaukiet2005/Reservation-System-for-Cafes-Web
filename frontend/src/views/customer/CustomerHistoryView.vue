<template>
  <div class="page-container">
    <h2>📜 Lịch Sử Đặt Bàn Của Tôi</h2>
    
    <div v-if="reservationStore.isLoading" class="loading">Đang tải dữ liệu...</div>
    
    <ReservationList v-else :items="reservationStore.reservations" />
    
    <div class="actions">
      <button @click="$router.push('/reservation')">Tạo đặt bàn mới</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import ReservationList from '../../components/reservations/ReservationList.vue';
import { reservationStore } from '../../store/reservationStore';

onMounted(() => {
  reservationStore.fetchReservations();
});
</script>

<style scoped>
.page-container { padding: 20px; max-width: 800px; margin: 0 auto; }
.loading { text-align: center; padding: 20px; color: #666; }
.actions { margin-top: 20px; text-align: right; }
button { padding: 10px 20px; background-color: #2c3e50; color: white; border: none; border-radius: 4px; cursor: pointer; }
</style>