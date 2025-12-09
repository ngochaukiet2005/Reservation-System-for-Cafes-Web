<template>
  <div class="reservation-page">
    <div class="overlay"></div>
    <div class="content">
      <div class="header-section">
        <h2>Đặt Bàn</h2>
        <p class="sub-text">Thưởng thức hương vị cà phê tuyệt hảo trong không gian yên bình.</p>
      </div>
      
      <div class="form-wrapper">
        <ReservationForm 
          :is-submitting="reservationStore.isLoading" 
          @submit="handleCreateReservation" 
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import ReservationForm from '../../components/reservations/ReservationForm.vue';
import { reservationStore } from '../../store/reservationStore';

const router = useRouter();

const handleCreateReservation = async (formData: any) => {
  try {
    await reservationStore.createReservation(formData);
    // Sử dụng alert tạm, sau này có thể dùng Toast/Notification
    alert('Đặt bàn thành công! Vui lòng kiểm tra lịch sử.');
    router.push('/history'); 
  } catch (e) {
    alert('Có lỗi xảy ra, vui lòng thử lại.');
  }
};
</script>

<style scoped>
.reservation-page {
  min-height: 100vh;
  background: url('../../assets/banner.jpg') no-repeat center center/cover;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 20px; /* Padding top để tránh header đè lên */
}

.overlay {
  position: absolute; inset: 0;
  background: rgba(0, 0, 0, 0.6); /* Làm tối nền ảnh */
}

.content {
  position: relative; z-index: 2;
  width: 100%; max-width: 500px;
  animation: slideUp 0.5s ease-out;
}

.header-section { text-align: center; margin-bottom: 30px; color: #fff; }
.header-section h2 { font-family: 'Cormorant Garamond', serif; font-size: 3rem; margin: 0 0 10px 0; color: #ffe4c4; }
.header-section .sub-text { font-family: 'Montserrat', sans-serif; font-size: 1rem; opacity: 0.9; }

.form-wrapper {
  background: rgba(255, 255, 255, 0.95);
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
  backdrop-filter: blur(10px);
}

@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>