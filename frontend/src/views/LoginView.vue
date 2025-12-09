<template>
  <div class="login-container">
    <div class="login-box">
      <h2>🔐 Đăng Nhập Hệ Thống</h2>
      <p>Chào mừng bạn đến với Cafe Reservation</p>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email:</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="admin@cafe.com / staff@cafe.com / guest@gmail.com" 
            required 
          />
        </div>

        <div class="form-group">
          <label>Mật khẩu:</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="Nhập bất kỳ (123456)" 
            required 
          />
        </div>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

        <button type="submit" :disabled="authStore.isLoading">
          {{ authStore.isLoading ? 'Đang xử lý...' : 'Đăng Nhập' }}
        </button>
      </form>

      <div class="hint">
        <p>💡 <strong>Gợi ý test:</strong></p>
        <ul>
          <li>Admin: <code>admin@cafe.com</code></li>
          <li>Staff: <code>staff@cafe.com</code></li>
          <li>Khách: <code>guest@gmail.com</code></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authStore } from '../store/authStore';

const router = useRouter();
const email = ref('');
const password = ref('');
const errorMessage = ref('');

const handleLogin = async () => {
  try {
    errorMessage.value = '';
    await authStore.login({ email: email.value, password: password.value });
    
    // Điều hướng dựa trên Role
    if (authStore.user?.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (authStore.user?.role === 'STAFF') {
      router.push('/staff/dashboard');
    } else {
      router.push('/reservation'); // Khách hàng
    }
  } catch (error) {
    errorMessage.value = 'Đăng nhập thất bại. Vui lòng thử lại.';
  }
};
</script>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f4f6f8; }
.login-box { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
.form-group { margin-bottom: 15px; text-align: left; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; } /* box-sizing fix layout */
button { width: 100%; padding: 12px; background-color: #3498db; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; margin-top: 10px; }
button:disabled { background-color: #bdc3c7; }
.error { color: red; font-size: 14px; margin-bottom: 10px; }
.hint { margin-top: 20px; font-size: 0.85em; color: #666; background: #eee; padding: 10px; border-radius: 4px; text-align: left;}
.hint ul { margin: 5px 0 0 20px; padding: 0; }
</style>