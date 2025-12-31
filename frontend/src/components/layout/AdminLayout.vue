<script setup lang="ts">
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router';
import { computed, ref, onMounted } from 'vue';
import { authStore } from '../../store/authStore';
import Swal from 'sweetalert2'; // [Import thêm] Thư viện SweetAlert2

// Import các Modal
import EditProfileModal from '../EditProfileModal.vue';
import ChangePasswordModal from '../ChangePasswordModal.vue';

const route = useRoute();
const router = useRouter();

// State quản lý hiển thị
const showDropdown = ref(false);
const showEditProfile = ref(false);
const showChangePassword = ref(false);

// Giả lập dữ liệu Admin (Giữ nguyên để test Frontend First)
onMounted(() => {
  if (!authStore.user) {
    authStore.user = {
      id: 9999,
      name: 'Admin Quản Trị',
      email: 'admin@cafe.com',
      phone: '0912345678',
      address: 'Trụ sở chính Coffee House',
      gender: 'Nam',
      avatar: '', 
      role: 'ADMIN'
    };
  }
});

// Tên trang hiện tại
const pageTitle = computed(() => {
  switch (route.path) {
    case '/admin/tables': return 'Quản lý Bàn';
    case '/admin/staff': return 'Quản lý Nhân viên';
    default: return 'Dashboard';
  }
});

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

// Hàm mở Modal
const openProfileModal = () => {
  showEditProfile.value = true;
  showDropdown.value = false;
};

const openPasswordModal = () => {
  showChangePassword.value = true;
  showDropdown.value = false;
};

// [CHỈNH SỬA] Hàm đăng xuất với SweetAlert2
const handleLogout = async () => {
  // 1. Ẩn dropdown ngay lập tức cho gọn
  showDropdown.value = false;

  // 2. Hiện Popup hỏi xác nhận
  const result = await Swal.fire({
    title: 'Đăng xuất?',
    text: "Bạn sẽ quay lại màn hình đăng nhập.",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6', // Màu xanh
    cancelButtonColor: '#d33',    // Màu đỏ
    confirmButtonText: 'Đăng xuất',
    cancelButtonText: 'Ở lại'
  });

  // 3. Nếu người dùng chọn "Đăng xuất"
  if (result.isConfirmed) {
    // Xóa user giả trong store
    authStore.user = null; 

    // Hiện thông báo nhỏ (Toast) góc trên bên phải
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    });
    
    await Toast.fire({
      icon: 'success',
      title: 'Đã đăng xuất thành công'
    });

    // Chuyển hướng về trang Login (hoặc trang chủ)
    router.push('/'); 
  }
};
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="logo">
        <span class="icon">☕</span> ADMIN
      </div>
      <nav class="nav-menu">
        <RouterLink to="/admin/dashboard" class="nav-item">
          📊 Tổng quan
        </RouterLink>
        <RouterLink to="/admin/tables" class="nav-item">
          🪑 Quản lý Bàn
        </RouterLink>
        <RouterLink to="/admin/staff" class="nav-item">
          👥 Quản lý Nhân viên
        </RouterLink>
      </nav>
    </aside>

    <main class="main-content">
      <header class="top-header">
        <h2>{{ pageTitle }}</h2>
        
        <div class="user-profile-container" @click="toggleDropdown">
          <div class="user-profile">
            <span class="username">{{ authStore.user?.name || 'Admin User' }}</span>
            
            <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" class="avatar-img" />
            <div v-else class="avatar">A</div>
            
            <span class="arrow">▼</span>
          </div>

          <div v-if="showDropdown" class="dropdown-menu">
            <div class="menu-item" @click.stop="openProfileModal">
              👤 Thông tin cá nhân
            </div>
            <div class="menu-item" @click.stop="openPasswordModal">
              🔑 Đổi mật khẩu
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item logout" @click.stop="handleLogout">
              🚪 Đăng xuất
            </div>
          </div>
        </div>
      </header>
      
      <div class="page-body">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </div>
    </main>

    <EditProfileModal 
      :isVisible="showEditProfile" 
      @close="showEditProfile = false" 
    />
    
    <ChangePasswordModal 
      :isVisible="showChangePassword" 
      @close="showChangePassword = false" 
    />
  </div>
</template>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; background: #f8f9fa; }
.admin-sidebar { width: 260px; background: #2c3e50; color: white; display: flex; flex-direction: column; flex-shrink: 0; }
.logo { height: 64px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; border-bottom: 1px solid #34495e; color: #42b983; }
.nav-menu { padding: 20px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.nav-item { padding: 12px 16px; color: #ecf0f1; text-decoration: none; border-radius: 8px; transition: all 0.2s; display: flex; align-items: center; gap: 10px; }
.nav-item:hover { background: rgba(255,255,255,0.1); }
.nav-item.router-link-active { background: #42b983; color: white; font-weight: 500; }

.main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.top-header { height: 64px; background: white; border-bottom: 1px solid #e9ecef; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; position: relative; }
.page-body { padding: 30px; overflow-y: auto; height: 100%; }

/* --- CSS Dropdown & Profile --- */
.user-profile-container { position: relative; cursor: pointer; }
.user-profile { display: flex; align-items: center; gap: 10px; font-weight: 500; padding: 5px 10px; border-radius: 8px; transition: background 0.2s; }
.user-profile:hover { background: #f1f3f5; }

.username { color: #2c3e50; }
.avatar { width: 36px; height: 36px; background: #42b983; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.avatar-img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd; }
.arrow { font-size: 0.7rem; color: #95a5a6; }

.dropdown-menu {
  position: absolute; top: 120%; right: 0; width: 220px;
  background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 8px 0; border: 1px solid #eee; z-index: 1000; animation: fadeIn 0.2s ease;
}

.menu-item { padding: 10px 15px; font-size: 0.95rem; color: #34495e; transition: background 0.2s; cursor: pointer; display: flex; align-items: center; gap: 10px; }
.menu-item:hover { background: #f8f9fa; color: #42b983; }

.menu-divider { height: 1px; background: #eee; margin: 5px 0; }
.menu-item.logout { color: #e74c3c; }
.menu-item.logout:hover { background: #fff5f5; }

/* Hiệu ứng chuyển trang Fade (Thêm vào cho mượt) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>