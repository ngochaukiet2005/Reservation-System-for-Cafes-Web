<template>
  <div class="page-container">
    <h2>☕ Đặt Bàn Mới</h2>
    <p class="sub-text">Vui lòng điền thông tin để giữ chỗ.</p>
    
    <div class="form-wrapper">
      <ReservationForm 
        :is-submitting="reservationStore.isLoading" 
        @submit="handleCreateReservation" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import ReservationForm from '../../components/reservations/ReservationForm.vue';
import { reservationStore } from '../../store/reservationStore';

const router = useRouter();

const handleCreateReservation = async (formData: any) => {
  await reservationStore.createReservation(formData);
  alert('Đặt bàn thành công! Đang chuyển hướng...');
  router.push('/history'); // Chuyển sang trang lịch sử sau khi đặt xong
};
</script>

<style scoped>
.page-container { text-align: center; padding: 20px; }
.sub-text { margin-bottom: 20px; color: #666; }
.form-wrapper { background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: inline-block; width: 100%; max-width: 500px;}
</style>