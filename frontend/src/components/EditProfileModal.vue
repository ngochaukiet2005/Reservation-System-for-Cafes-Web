<template>
  <transition name="modal">
    <div v-if="isVisible" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <button class="btn-close" @click="close">✕</button>
        
        <div class="profile-header">
          <div class="avatar-wrapper" @click="triggerFileInput">
            <img :src="previewAvatar || authStore.user?.avatar" alt="Avatar" class="avatar-img">
            <div class="avatar-overlay"><span>📷</span></div>
            <input type="file" ref="fileInput" class="hidden-input" accept="image/*" @change="handleFileChange">
          </div>
          
          <div class="header-info">
            <h3 class="user-name">{{ authStore.user?.name }}</h3>
            <p class="user-email">{{ authStore.user?.email }}</p>
            </div>
        </div>

        <div class="divider"></div>

        <form @submit.prevent="handleSubmit" class="profile-body">
          <div class="form-row">
            <div class="input-group">
              <label>Tên hiển thị</label>
              <input v-model="form.name" type="text" required>
            </div>
            
            <div class="input-group">
              <label>Giới tính</label>
              <div class="gender-options">
                <label :class="{ active: form.gender === 'Nam' }">
                  <input type="radio" value="Nam" v-model="form.gender"> ♂ Nam
                </label>
                <label :class="{ active: form.gender === 'Nữ' }">
                  <input type="radio" value="Nữ" v-model="form.gender"> ♀ Nữ
                </label>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="input-group">
              <label>Số điện thoại</label>
              <input v-model="form.phone" type="tel">
            </div>
          </div>

          <div class="input-group">
            <label>Email (Không thể thay đổi)</label>
            <input :value="authStore.user?.email" type="email" disabled class="disabled-input">
          </div>

          <p v-if="successMsg" class="success-msg">✅ {{ successMsg }}</p>

          <div class="actions">
            <button type="button" class="btn-cancel" @click="close">Hủy bỏ</button>
            <button type="submit" class="btn-save" :disabled="authStore.isLoading">
              {{ authStore.isLoading ? 'Đang lưu...' : 'Cập nhật' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { authStore } from '../store/authStore';

const props = defineProps<{ isVisible: boolean }>();
const emit = defineEmits(['close']);

const fileInput = ref<HTMLInputElement | null>(null);
const previewAvatar = ref<string | null>(null);
const selectedFile = ref<File | null>(null);
const successMsg = ref('');

const form = reactive({
  name: '',
  phone: '',
  gender: 'Nam' // Mặc định
});

watch(() => props.isVisible, (newVal) => {
  if (newVal && authStore.user) {
    form.name = authStore.user.name;
    form.phone = authStore.user.phone || '';
    form.gender = authStore.user.gender || 'Nam';
    previewAvatar.value = null;
    selectedFile.value = null;
    successMsg.value = '';
  }
});

const close = () => emit('close');
const triggerFileInput = () => fileInput.value?.click();

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    selectedFile.value = file;
    previewAvatar.value = URL.createObjectURL(file);
  }
};

const handleSubmit = async () => {
  try {
    await authStore.updateProfile({
      name: form.name,
      phone: form.phone,
      gender: form.gender as 'Nam' | 'Nữ',
      avatarFile: selectedFile.value
    });
    successMsg.value = 'Cập nhật thông tin thành công!';
    setTimeout(() => close(), 1500);
  } catch (error: any) {
    successMsg.value = '';
    alert(error || 'Cập nhật thất bại!');
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Montserrat:wght@400;500;600&display=swap');

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 2000;
  display: flex; justify-content: center; align-items: center; backdrop-filter: blur(4px);
}
.modal-container {
  background: white; width: 500px; border-radius: 16px; overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3); font-family: 'Montserrat', sans-serif;
  animation: fadeUp 0.3s ease-out;
}
.btn-close {
  position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #888;
}
.profile-header {
  padding: 30px 30px 20px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  background: #fdfbf7;
}
.avatar-wrapper {
  position: relative; width: 100px; height: 100px; margin-bottom: 15px; cursor: pointer;
}
.avatar-img {
  width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
  border: 3px solid #a67c52;
}
.avatar-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.4); border-radius: 50%;
  display: flex; justify-content: center; align-items: center;
  opacity: 0; transition: 0.3s; color: white; font-size: 1.5rem;
}
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }
.hidden-input { display: none; }
.user-name { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; margin: 0; color: #1a1a1a; font-weight: 600; }
.user-email { color: #666; font-size: 0.9rem; margin: 5px 0 0; }

.divider { height: 1px; background: #eee; margin: 0 30px; }
.profile-body { padding: 30px; }
.form-row { display: flex; gap: 15px; }
.input-group { margin-bottom: 15px; flex: 1; }
.input-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 5px; color: #444; }
.input-group input {
  width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;
  font-family: 'Montserrat', sans-serif; box-sizing: border-box;
}
.input-group input:focus { border-color: #a67c52; outline: none; background: #fffcf8; }
.disabled-input { background: #f2f2f2; color: #888; cursor: not-allowed; }

/* Gender Radio Button Style */
.gender-options { display: flex; gap: 10px; height: 38px; align-items: center; }
.gender-options label {
  display: flex; align-items: center; gap: 5px; cursor: pointer;
  font-weight: 500; color: #666; transition: 0.2s;
  border: 1px solid #ddd; padding: 8px 12px; border-radius: 6px; margin: 0; flex: 1; justify-content: center;
}
.gender-options label:hover { background: #f9f9f9; }
.gender-options label.active {
  border-color: #a67c52; color: #a67c52; background: #fffcf8; font-weight: 600;
}
.gender-options input { display: none; }

.actions { display: flex; gap: 10px; margin-top: 20px; }
.btn-save {
  flex: 2; padding: 12px; background: #1a1a1a; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.3s;
}
.btn-save:hover:not(:disabled) { background: #a67c52; }
.btn-cancel {
  flex: 1; padding: 12px; background: white; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; color: #555;
}
.btn-cancel:hover { background: #f9f9f9; }
.success-msg { text-align: center; color: #27ae60; font-weight: 500; margin-bottom: 15px; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>