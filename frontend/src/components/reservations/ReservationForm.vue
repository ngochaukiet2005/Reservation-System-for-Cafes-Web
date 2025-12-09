<template>
  <form @submit.prevent="handleSubmit" class="reservation-form">
    <div class="form-group">
      <label>Họ và tên:</label>
      <input v-model="form.guestName" type="text" required placeholder="Nhập tên của bạn" />
    </div>

    <div class="form-group">
      <label>Số điện thoại:</label>
      <input v-model="form.phone" type="tel" required placeholder="09xxxxxxx" />
    </div>

    <div class="form-group">
      <label>Thời gian:</label>
      <input v-model="form.time" type="datetime-local" required />
    </div>

    <div class="form-group">
      <label>Số lượng khách:</label>
      <input v-model.number="form.people" type="number" min="1" max="20" required />
    </div>

    <button type="submit" :disabled="isSubmitting">
      {{ isSubmitting ? 'Đang gửi...' : 'Đặt Bàn Ngay' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

// Define props để nhận trạng thái loading từ cha
defineProps<{ isSubmitting: boolean }>();

// Define events để gửi dữ liệu ra ngoài cho cha xử lý
const emit = defineEmits(['submit']);

const form = reactive({
  guestName: '',
  phone: '',
  time: '',
  people: 1
});

const handleSubmit = () => {
  // Gửi dữ liệu form ra component cha (View)
  emit('submit', { ...form });
};
</script>

<style scoped>
.reservation-form { max-width: 400px; margin: 0 auto; display: flex; flex-direction: column; gap: 15px; }
.form-group { display: flex; flex-direction: column; text-align: left; }
.form-group label { margin-bottom: 5px; font-weight: bold; }
.form-group input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
button { padding: 10px; background-color: #42b983; color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 4px; }
button:disabled { background-color: #a0dca0; cursor: not-allowed; }
</style>