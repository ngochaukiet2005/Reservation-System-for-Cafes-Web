<template>
  <transition name="fade">
    <div v-if="isVisible" class="modal-overlay" @click.self="close">
      
      <transition name="slide-up">
        <div v-if="isVisible" class="modal-container">
          <button class="btn-close" @click="close">✕</button>
          
          <div class="modal-header">
            <h3>Đổi Mật Khẩu</h3>
            <p>Cập nhật mật khẩu mới để bảo vệ tài khoản của bạn.</p>
          </div>

          <form @submit.prevent="handleSubmit" class="modal-body">
            
            <div class="input-group">
              <input 
                v-model="form.currentPass" 
                type="password" 
                placeholder="Mật khẩu hiện tại" 
                required
              >
              
              <input 
                v-model="form.newPass" 
                type="password" 
                placeholder="Mật khẩu mới" 
                required
              >

              <input 
                v-model="form.confirmPass" 
                type="password" 
                placeholder="Xác nhận mật khẩu mới" 
                required
              >
            </div>

            <div class="message-area">
              <p v-if="errorMsg" class="msg error">
                <span class="icon">⚠️</span> {{ errorMsg }}
              </p>
              <p v-if="successMsg" class="msg success">
                <span class="icon">✅</span> {{ successMsg }}
              </p>
            </div>

            <div class="actions">
              <button type="button" class="btn-cancel" @click="close">Hủy</button>
              <button type="submit" class="btn-submit" :disabled="authStore.isLoading">
                {{ authStore.isLoading ? 'Đang xử lý...' : 'Cập Nhật' }}
              </button>
            </div>

          </form>
        </div>
      </transition>

    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { authStore } from '../store/authStore';

defineProps<{ isVisible: boolean }>();
const emit = defineEmits(['close']);

const errorMsg = ref('');
const successMsg = ref('');

const form = reactive({
  currentPass: '',
  newPass: '',
  confirmPass: ''
});

const close = () => {
  form.currentPass = '';
  form.newPass = '';
  form.confirmPass = '';
  errorMsg.value = '';
  successMsg.value = '';
  emit('close');
};

const handleSubmit = async () => {
  errorMsg.value = '';
  successMsg.value = '';

  if (form.newPass !== form.confirmPass) {
    errorMsg.value = 'Mật khẩu xác nhận không trùng khớp!';
    return;
  }

  if (form.newPass.length < 6) {
    errorMsg.value = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
    return;
  }

  try {
    await authStore.changePassword({
      currentPass: form.currentPass,
      newPass: form.newPass
    });
    
    successMsg.value = 'Đổi mật khẩu thành công!';
    setTimeout(() => close(), 1500); 
  } catch (err: any) {
    errorMsg.value = err; 
  }
};
</script>

<style scoped>
/* Import font giống AuthModal */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap');

.modal-overlay {
  position: fixed; inset: 0; 
  background: rgba(0,0,0,0.7); 
  z-index: 2000;
  display: flex; justify-content: center; align-items: center;
  backdrop-filter: blur(5px);
}

.modal-container {
  background: #fff;
  width: 420px;
  padding: 40px;
  border-radius: 20px;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  font-family: 'Montserrat', sans-serif;
  text-align: center;
}

.btn-close {
  position: absolute; top: 15px; right: 20px;
  font-size: 1.5rem; background: none; border: none;
  cursor: pointer; color: #aaa; transition: 0.2s;
}
.btn-close:hover { color: #333; }

/* Header Style */
.modal-header h3 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 10px;
}
.modal-header p {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 30px;
  font-weight: 400;
}

/* Input Style đồng bộ */
.input-group {
  display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;
}

.input-group input {
  width: 100%; padding: 14px;
  border: 1px solid #eee; background: #f9f9f9;
  border-radius: 8px; box-sizing: border-box;
  font-family: 'Montserrat', sans-serif; outline: none; transition: 0.3s;
  font-size: 0.95rem;
}

.input-group input:focus {
  background: #fff;
  border-color: #a67c52; /* Màu chủ đạo */
  box-shadow: 0 0 0 4px rgba(166, 124, 82, 0.1);
}

/* Buttons */
.actions {
  display: flex; gap: 10px; margin-top: 10px;
}

.btn-submit {
  flex: 2;
  padding: 14px;
  background: #1a1a1a; color: #fff;
  border: none; border-radius: 8px;
  font-weight: 600; cursor: pointer;
  font-family: 'Montserrat', sans-serif; transition: 0.3s;
}
.btn-submit:hover:not(:disabled) { background: #a67c52; }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

.btn-cancel {
  flex: 1;
  padding: 14px;
  background: transparent; color: #666;
  border: 1px solid #eee; border-radius: 8px;
  font-weight: 600; cursor: pointer;
  font-family: 'Montserrat', sans-serif; transition: 0.3s;
}
.btn-cancel:hover { background: #f5f5f5; color: #333; }

/* Messages */
.message-area { min-height: 25px; margin-bottom: 15px; }
.msg { font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 5px; }
.msg.error { color: #e74c3c; }
.msg.success { color: #27ae60; font-weight: 500; }

/* Animation Effect */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active { animation: slideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); }
.slide-up-leave-active { animation: slideUp 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) reverse; }

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>