<template>
  <transition name="modal">
    <div class="modal-overlay" v-if="isVisible" @click.self="close">
      <div class="modal-container">
        <button class="btn-close" @click="close">✕</button>
        
        <div class="modal-header">
          <h3>✍️ Thông Tin Đặt Bàn</h3>
          <p>Điền thông tin để nhân viên xác nhận yêu cầu.</p>
        </div>

        <div class="summary-box">
          <div class="s-item">
            <span>Bàn:</span> <strong>{{ selectedTable?.name }}</strong>
          </div>
          <div class="s-item">
            <span>Thời gian:</span> <strong>{{ initialData.time }} - {{ formatDate(initialData.date) }}</strong>
          </div>
          <div class="s-item">
            <span>Số khách:</span> <strong>{{ initialData.people }} người</strong>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="form-body">
          <div class="input-group">
            <label>Họ và tên khách hàng</label>
            <input 
              v-model="form.guestName" 
              type="text" 
              placeholder="Ví dụ: Nguyễn Văn A" 
              required
            >
          </div>

          <div class="input-group">
            <label>Số điện thoại liên hệ</label>
            <input 
              v-model="form.phone" 
              type="tel" 
              placeholder="Ví dụ: 0909..." 
              required 
              pattern="[0-9]{10}"
            >
          </div>

          <div class="input-group">
            <label>Ghi chú thêm (Tùy chọn)</label>
            <textarea 
              v-model="form.note" 
              rows="3"
              placeholder="VD: Cần ghế trẻ em, dị ứng hải sản..."
            ></textarea>
          </div>

          <div class="actions">
            <button type="button" class="btn-cancel" @click="close">Quay lại</button>
            <button type="submit" class="btn-confirm">
              Xác Nhận Đặt Bàn
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { authStore } from '../../store/authStore';

// Nhận props từ View cha
const props = defineProps<{
  isVisible: boolean;
  selectedTable: any;
  initialData: any;
}>();

const emit = defineEmits(['submit', 'close']);

const form = reactive({
  guestName: '',
  phone: '',
  note: ''
});

// Tự động điền thông tin nếu user đã đăng nhập
onMounted(() => {
  if (authStore.user) {
    form.guestName = authStore.user.name || '';
    form.phone = authStore.user.phone || '';
  }
});

const close = () => emit('close');

const handleSubmit = () => {
  // Gửi dữ liệu form ngược lại cho View cha xử lý
  emit('submit', form);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed; inset: 0; 
  background: rgba(0,0,0,0.6); 
  z-index: 2000; /* Cao hơn cả footer */
  display: flex; justify-content: center; align-items: center;
  backdrop-filter: blur(4px);
}

/* Modal Box */
.modal-container {
  background: #fff; width: 90%; max-width: 450px; padding: 30px;
  border-radius: 16px; position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.btn-close {
  position: absolute; top: 15px; right: 20px;
  background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #999;
}
.btn-close:hover { color: #333; }

.modal-header h3 { margin: 0 0 5px; color: #a67c52; font-weight: 700; font-size: 1.5rem; }
.modal-header p { margin: 0 0 20px; color: #666; font-size: 0.9rem; }

/* Summary Box */
.summary-box {
  background: #fdfbf7; border: 1px solid #f0e6d2;
  padding: 15px; border-radius: 8px; margin-bottom: 20px;
}
.s-item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9rem; color: #555; }
.s-item strong { color: #333; }

/* Inputs */
.input-group { margin-bottom: 15px; }
.input-group label { display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 5px; }
.input-group input, .input-group textarea {
  width: 100%; padding: 12px; border: 1px solid #ddd;
  border-radius: 8px; font-family: inherit; box-sizing: border-box;
}
.input-group input:focus, .input-group textarea:focus {
  border-color: #a67c52; outline: none; background: #fffcf9;
}

/* Actions */
.actions { display: flex; gap: 10px; margin-top: 25px; }
.btn-cancel {
  flex: 1; background: transparent; border: 1px solid #ddd; padding: 12px;
  border-radius: 8px; cursor: pointer; font-weight: 600; color: #666;
}
.btn-confirm {
  flex: 2; background: #1a1a1a; border: none; padding: 12px;
  border-radius: 8px; cursor: pointer; font-weight: 600; color: #fff;
}
.btn-confirm:hover { background: #a67c52; }

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.3s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>