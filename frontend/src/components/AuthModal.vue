<template>
  <transition name="modal">
    <div v-if="isVisible" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <button class="btn-close" @click="close">✕</button>
        
        <div class="modal-left">
          <h3>Welcome Back</h3>
          <p>Đăng nhập để nhận ưu đãi và quản lý lịch đặt bàn.</p>
        </div>

        <div class="modal-right">
          <div class="auth-toggle">
            <button :class="{ active: isLoginMode }" @click="switchMode(true)">Đăng Nhập</button>
            <button :class="{ active: !isLoginMode }" @click="switchMode(false)">Đăng Ký</button>
          </div>

          <form @submit.prevent="handleSubmit" class="auth-form">
            <div class="input-group">
              <input 
                v-if="!isLoginMode" 
                v-model="form.name" 
                type="text" 
                placeholder="Tên hiển thị" 
                required
              >
              
              <input 
                v-model="form.email" 
                type="email" 
                placeholder="Email" 
                required
              >

              <input 
                v-if="!isLoginMode" 
                v-model="form.phone" 
                type="tel" 
                placeholder="Số điện thoại" 
                pattern="[0-9]{10}"
                title="Vui lòng nhập số điện thoại 10 số"
                required
              >

              <input 
                v-model="form.password" 
                type="password" 
                placeholder="Mật khẩu" 
                required
              >

              <input 
                v-if="!isLoginMode"
                v-model="form.confirmPassword" 
                type="password" 
                placeholder="Xác nhận mật khẩu" 
                required
              >
            </div>

            <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

            <button type="submit" class="btn-submit" :disabled="authStore.isLoading">
              {{ authStore.isLoading ? 'Đang xử lý...' : (isLoginMode ? 'Đăng Nhập' : 'Tạo Tài Khoản') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { authStore } from '../store/authStore';

const props = defineProps<{
  isVisible: boolean;
}>();

const emit = defineEmits(['close', 'success']);

// UI States
const isLoginMode = ref(true);
const errorMsg = ref('');

// Form Data Update
const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '' // Field mới để validate
});

const switchMode = (isLogin: boolean) => {
  isLoginMode.value = isLogin;
  errorMsg.value = '';
};

const close = () => {
  emit('close');
  errorMsg.value = '';
};

const handleSubmit = async () => {
  errorMsg.value = '';
  
  // 1. Kiểm tra xác nhận mật khẩu trước khi gọi Store
  if (!isLoginMode.value) {
    if (form.password !== form.confirmPassword) {
      errorMsg.value = 'Mật khẩu xác nhận không trùng khớp!';
      return; // Dừng lại, không gửi data đi
    }
  }

  try {
    if (isLoginMode.value) {
      await authStore.login({ 
        email: form.email, 
        password: form.password 
      });
    } else {
      await authStore.register({ 
        name: form.name, 
        email: form.email, 
        phone: form.phone, // Gửi thêm số điện thoại
        password: form.password 
      });
    }
    
    // Reset form & emit success
    resetForm();
    emit('success');
    close();
  } catch (err: any) {
    errorMsg.value = err || 'Đã có lỗi xảy ra.';
  }
};

const resetForm = () => {
  form.name = '';
  form.email = '';
  form.phone = '';
  form.password = '';
  form.confirmPassword = '';
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap');

.modal-overlay { 
  position: fixed; inset: 0; 
  background: rgba(0,0,0,0.7); 
  z-index: 1000; 
  display: flex; justify-content: center; align-items: center; 
  backdrop-filter: blur(5px);
}

.modal-container { 
  width: 800px; height: 550px; /* Tăng chiều cao xíu để chứa thêm input */
  background: #fff; border-radius: 20px; 
  display: flex; position: relative; overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.btn-close { 
  position: absolute; top: 15px; right: 20px; 
  font-size: 1.5rem; background: none; border: none; 
  cursor: pointer; color: #aaa; z-index: 10; transition: 0.2s;
}
.btn-close:hover { color: #333; }

.modal-left { 
  flex: 1; 
  background: url('https://images.unsplash.com/photo-1511920170033-f8396924c348?ixlib=rb-4.0.3&w=600&q=80') center/cover; 
  padding: 40px; 
  display: flex; flex-direction: column; justify-content: flex-end; 
  color: #fff; position: relative;
}
.modal-left::before { 
  content: ''; position: absolute; inset: 0; 
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); 
}
.modal-left h3, .modal-left p { 
  position: relative; z-index: 2; 
  font-family: 'Montserrat', sans-serif;
}
.modal-left h3 { font-size: 2rem; margin-bottom: 10px; font-weight: 700; }

.modal-right { 
  flex: 1; padding: 40px 50px; /* Giảm padding top/bottom xíu */
  display: flex; flex-direction: column; justify-content: center; 
  font-family: 'Montserrat', sans-serif;
}

.auth-toggle { 
  display: flex; margin-bottom: 20px; 
  background: #f2f2f2; padding: 5px; border-radius: 30px; 
}
.auth-toggle button { 
  flex: 1; padding: 10px; border: none; background: none; 
  border-radius: 25px; font-weight: 600; color: #888; 
  cursor: pointer; font-family: 'Montserrat', sans-serif; transition: 0.3s;
}
.auth-toggle button.active { 
  background: #fff; color: #1a1a1a; 
  box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
}

/* Scroll cho input group nếu quá nhiều trường */
.input-group {
  max-height: 320px;
  overflow-y: auto;
  padding: 2px; /* Tránh bị mất box-shadow focus */
}

/* Ẩn scrollbar */
.input-group::-webkit-scrollbar { width: 0; background: transparent; }

.input-group input { 
  width: 100%; padding: 14px; margin-bottom: 12px; 
  border: 1px solid #eee; background: #f9f9f9; 
  border-radius: 8px; box-sizing: border-box; 
  font-family: 'Montserrat', sans-serif; outline: none; transition: 0.3s;
}
.input-group input:focus {
  background: #fff; border-color: #a67c52;
}

.btn-submit { 
  width: 100%; padding: 14px; margin-top: 10px;
  background: #1a1a1a; color: #fff; border: none; 
  border-radius: 8px; font-weight: 600; cursor: pointer; 
  font-family: 'Montserrat', sans-serif; transition: 0.3s;
}
.btn-submit:hover:not(:disabled) { background: #a67c52; }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

.error-msg { 
  color: #e74c3c; margin-bottom: 15px; 
  text-align: center; font-size: 0.9rem; 
}

/* Animations */
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-container { animation: slideIn 0.3s ease-out; }
.modal-leave-active .modal-container { animation: slideIn 0.3s ease-in reverse; }

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>