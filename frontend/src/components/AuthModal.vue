<template>
  <transition name="modal">
    <div v-if="isVisible" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <button class="btn-close" @click="close">✕</button>
        
        <div class="modal-left">
          <h3 v-if="authMode === 'forgot'">Recovery</h3>
          <h3 v-else>Welcome Back</h3>
          
          <p v-if="authMode === 'forgot'">
            Khôi phục quyền truy cập vào tài khoản của bạn chỉ với vài bước đơn giản.
          </p>
          <p v-else>Đăng nhập để nhận ưu đãi và quản lý lịch đặt bàn.</p>
        </div>

        <div class="modal-right">
          
          <div class="auth-toggle" v-if="authMode !== 'forgot'">
            <button :class="{ active: authMode === 'login' }" @click="switchMode('login')">Đăng Nhập</button>
            <button :class="{ active: authMode === 'register' }" @click="switchMode('register')">Đăng Ký</button>
          </div>

          <div v-else class="forgot-header">
            <h2>Quên Mật Khẩu</h2>
            <p v-if="forgotStep === 1">Nhập email để nhận mã xác thực</p>
            <p v-if="forgotStep === 2">Nhập mã OTP đã gửi tới email</p>
            <p v-if="forgotStep === 3">Tạo mật khẩu mới</p>
          </div>

          <form @submit.prevent="handleSubmit" class="auth-form">
            <div class="input-group">
              
              <input 
                v-if="authMode === 'register'" 
                v-model="form.name" 
                type="text" 
                placeholder="Tên hiển thị" 
                required
              >
              
              <input 
                v-if="authMode !== 'forgot' || (authMode === 'forgot' && forgotStep === 1)"
                v-model="form.email" 
                type="email" 
                placeholder="Email" 
                required
                :disabled="authMode === 'forgot' && forgotStep > 1" 
              >

              <input 
                v-if="authMode === 'register'" 
                v-model="form.phone" 
                type="tel" 
                placeholder="Số điện thoại" 
                pattern="[0-9]{10}"
                required
              >

              <input 
                v-if="authMode === 'register'" 
                v-model="form.address" 
                type="text" 
                placeholder="Địa chỉ liên hệ" 
                required
              >

              <div v-if="authMode === 'register'" class="gender-selection">
                <label>Giới tính:</label>
                <div class="radio-group">
                  <label class="radio-label">
                    <input type="radio" value="Nam" v-model="form.gender">
                    <span class="radio-custom">♂ Nam</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" value="Nữ" v-model="form.gender">
                    <span class="radio-custom">♀ Nữ</span>
                  </label>
                </div>
              </div>

              <input 
                v-if="authMode === 'forgot' && forgotStep === 2"
                v-model="form.otp"
                type="text"
                placeholder="Nhập mã OTP (Test: 123456)"
                required
              >

              <input 
                v-if="authMode !== 'forgot' || (authMode === 'forgot' && forgotStep === 3)"
                v-model="form.password" 
                type="password" 
                :placeholder="authMode === 'forgot' ? 'Mật khẩu mới' : 'Mật khẩu'" 
                required
              >

              <input 
                v-if="authMode === 'register' || (authMode === 'forgot' && forgotStep === 3)"
                v-model="form.confirmPassword" 
                type="password" 
                placeholder="Xác nhận mật khẩu" 
                required
              >
            </div>

            <div class="forgot-link" v-if="authMode === 'login'">
              <a href="#" @click.prevent="switchMode('forgot')">Quên mật khẩu?</a>
            </div>

            <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

            <button type="submit" class="btn-submit" :disabled="authStore.isLoading">
              {{ buttonText }}
            </button>

            <button 
              v-if="authMode === 'forgot'" 
              type="button" 
              class="btn-back" 
              @click="switchMode('login')"
            >
              Quay lại Đăng nhập
            </button>

          </form>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { authStore } from '../store/authStore';

defineProps<{ isVisible: boolean }>();
const emit = defineEmits(['close', 'success']);

const authMode = ref<'login' | 'register' | 'forgot'>('login');
const forgotStep = ref(1);
const errorMsg = ref('');

const form = reactive({
  name: '',
  email: '',
  phone: '',
  address: '',
  gender: 'Nam', // Default gender
  password: '',
  confirmPassword: '',
  otp: ''
});

const buttonText = computed(() => {
  if (authStore.isLoading) return 'Đang xử lý...';
  if (authMode.value === 'login') return 'Đăng Nhập';
  if (authMode.value === 'register') return 'Tạo Tài Khoản';
  if (forgotStep.value === 1) return 'Gửi Mã Xác Nhận';
  if (forgotStep.value === 2) return 'Xác Nhận OTP';
  return 'Đổi Mật Khẩu';
});

const switchMode = (mode: 'login' | 'register' | 'forgot') => {
  authMode.value = mode;
  errorMsg.value = '';
  forgotStep.value = 1;
  resetForm();
};

const close = () => {
  emit('close');
  errorMsg.value = '';
  switchMode('login');
};

const handleSubmit = async () => {
  errorMsg.value = '';

  try {
    if (authMode.value === 'login') {
      await authStore.login({ email: form.email, password: form.password });
      emit('success');
      close();
    } 
    else if (authMode.value === 'register') {
      if (form.password !== form.confirmPassword) {
        errorMsg.value = 'Mật khẩu xác nhận không khớp!';
        return;
      }
      await authStore.register({ 
        name: form.name, 
        email: form.email, 
        phone: form.phone, 
        address: form.address,
        gender: form.gender as 'Nam' | 'Nữ',
        password: form.password 
      });
      emit('success');
      close();
    }
    else if (authMode.value === 'forgot') {
      if (forgotStep.value === 1) {
        await authStore.sendOtp(form.email);
        alert('Mã OTP đã gửi! (Check console log F12: 123456)');
        forgotStep.value = 2;
      }
      else if (forgotStep.value === 2) {
        await authStore.verifyOtp(form.email, form.otp);
        forgotStep.value = 3;
      }
      else if (forgotStep.value === 3) {
        if (form.password !== form.confirmPassword) {
          errorMsg.value = 'Mật khẩu xác nhận không khớp!';
          return;
        }
        await authStore.resetPassword(form.email, form.password);
        alert('Đổi mật khẩu thành công! Vui lòng đăng nhập.');
        switchMode('login');
      }
    }
  } catch (err: any) {
    errorMsg.value = err || 'Đã có lỗi xảy ra.';
  }
};

const resetForm = () => {
  if (authMode.value !== 'forgot') form.email = '';
  form.name = '';
  form.phone = '';
  form.address = '';
  form.password = '';
  form.confirmPassword = '';
  form.otp = '';
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
  width: 800px; height: 600px; /* Tăng chiều cao để chứa input mới */
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
  position: relative; z-index: 2; font-family: 'Montserrat', sans-serif;
}
.modal-left h3 { font-size: 2rem; margin-bottom: 10px; font-weight: 700; }
.modal-right { 
  flex: 1; padding: 40px 50px; 
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
  background: #fff; color: #1a1a1a; box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
}
.forgot-header { text-align: center; margin-bottom: 20px; }
.forgot-header h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 5px; color: #1a1a1a; }
.forgot-header p { font-size: 0.9rem; color: #666; }

.input-group { max-height: 380px; overflow-y: auto; padding: 2px; }
.input-group::-webkit-scrollbar { width: 0; background: transparent; }
.input-group input { 
  width: 100%; padding: 14px; margin-bottom: 12px; 
  border: 1px solid #eee; background: #f9f9f9; 
  border-radius: 8px; box-sizing: border-box; 
  font-family: 'Montserrat', sans-serif; outline: none; transition: 0.3s;
}
.input-group input:focus { background: #fff; border-color: #a67c52; }
.input-group input:disabled { background: #eee; color: #999; cursor: not-allowed; }

/* Gender Selection CSS */
.gender-selection {
  display: flex; align-items: center; gap: 15px; margin-bottom: 12px;
  font-family: 'Montserrat', sans-serif; font-size: 0.95rem;
}
.gender-selection label { font-weight: 600; color: #555; }
.radio-group { display: flex; gap: 15px; }
.radio-label { display: flex; align-items: center; cursor: pointer; font-weight: 500 !important; color: #333; }
.radio-label input { margin-right: 5px; cursor: pointer; accent-color: #a67c52; }

.forgot-link { text-align: right; margin-bottom: 15px; font-size: 0.85rem; }
.forgot-link a { color: #a67c52; text-decoration: none; font-weight: 500; }
.forgot-link a:hover { text-decoration: underline; }

.btn-submit { 
  width: 100%; padding: 14px; margin-top: 10px;
  background: #1a1a1a; color: #fff; border: none; 
  border-radius: 8px; font-weight: 600; cursor: pointer; 
  font-family: 'Montserrat', sans-serif; transition: 0.3s;
}
.btn-submit:hover:not(:disabled) { background: #a67c52; }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

.btn-back {
  width: 100%; padding: 10px; margin-top: 10px;
  background: transparent; color: #666; border: none;
  font-weight: 500; cursor: pointer; font-size: 0.9rem;
}
.btn-back:hover { color: #1a1a1a; }

.error-msg { color: #e74c3c; margin-bottom: 15px; text-align: center; font-size: 0.9rem; }

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