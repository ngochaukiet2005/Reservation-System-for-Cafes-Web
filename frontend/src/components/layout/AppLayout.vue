<template>
  <div class="app-container" @click="closeUserMenu">
    <Sidebar />
    
    <main class="main-content">
      <header class="top-bar">
        <div class="page-title">
          <h2>Hệ thống đặt bàn</h2>
          <span class="sub-title">Chào mừng trở lại, {{ authStore.user?.name }}!</span>
        </div>

        <div class="user-area" @click.stop="toggleUserMenu">
          <div class="user-info-text">
            <span class="u-name">{{ authStore.user?.name }}</span>
            <span class="u-role" v-if="authStore.user?.role && authStore.user?.role !== 'CUSTOMER'">{{ authStore.user?.role }}</span>
          </div>

          <div class="avatar-wrapper">
            <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" class="avatar-img">
            <div v-else class="avatar-placeholder">{{ getUserInitial }}</div>
            <span class="status-dot"></span>
          </div>

          <transition name="fade-slide">
            <div v-if="showUserMenu" class="user-dropdown">
              <div class="dropdown-header">
                <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" class="header-avatar-img">
                <div v-else class="header-avatar">{{ getUserInitial }}</div>
                <div class="header-info">
                  <span class="d-name">{{ authStore.user?.name }}</span>
                  <span class="d-email">{{ authStore.user?.email }}</span>
                </div>
              </div>
              
              <div class="dropdown-body">
                <div class="menu-item" @click="router.push('/')">
                  <span class="icon">🏠</span> Trang chủ
                </div>
                <div class="menu-item" @click="openEditProfile">
                  <span class="icon">👤</span> Hồ sơ cá nhân
                </div>
                <div class="menu-divider"></div>
                <div class="menu-item logout" @click="handleLogout">
                  <span class="icon">🚪</span> Đăng xuất
                </div>
              </div>
            </div>
          </transition>
        </div>
      </header>
      
      <div class="content-view">
        <slot /> 
      </div>
    </main>

    <EditProfileModal :isVisible="showProfileModal" @close="showProfileModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { authStore } from '../../store/authStore';
import Sidebar from './Sidebar.vue';
import EditProfileModal from '../EditProfileModal.vue';

const router = useRouter();
const showUserMenu = ref(false);
const showProfileModal = ref(false);

const getUserInitial = computed(() => authStore.user?.name.charAt(0).toUpperCase() || 'U');

const toggleUserMenu = () => { showUserMenu.value = !showUserMenu.value; };
const closeUserMenu = () => { showUserMenu.value = false; };

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};

const openEditProfile = () => {
  showProfileModal.value = true;
  showUserMenu.value = false;
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');

.app-container { display: flex; min-height: 100vh; background: #f4f6f8; font-family: 'Montserrat', sans-serif; }
.main-content { flex: 1; display: flex; flex-direction: column; }

/* HEADER STYLES */
.top-bar { 
  height: 70px; background: #fff; border-bottom: 1px solid #e0e0e0; 
  display: flex; justify-content: space-between; align-items: center; padding: 0 30px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}

.page-title h2 { margin: 0; font-size: 1.2rem; font-weight: 700; color: #1a1a1a; }
.sub-title { font-size: 0.8rem; color: #888; }

/* User Area Styles */
.user-area { display: flex; align-items: center; gap: 15px; cursor: pointer; position: relative; }
.user-info-text { text-align: right; display: flex; flex-direction: column; }
.u-name { font-weight: 600; font-size: 0.9rem; color: #333; }
.u-role { font-size: 0.7rem; font-weight: 700; color: #a67c52; background: #fffcf0; padding: 2px 6px; border-radius: 4px; align-self: flex-end; margin-top: 2px; border: 1px solid #f0e6d2; }

.avatar-wrapper { position: relative; width: 42px; height: 42px; }
.avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid #a67c52; }
.avatar-placeholder { width: 100%; height: 100%; border-radius: 50%; background: #a67c52; color: white; display: grid; place-items: center; font-weight: 700; }
.status-dot { position: absolute; bottom: 2px; right: 2px; width: 10px; height: 10px; background: #2ecc71; border: 2px solid #fff; border-radius: 50%; }

/* Dropdown (Style giống HomeView) */
.user-dropdown { position: absolute; top: 60px; right: 0; width: 280px; background: #fff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); border: 1px solid #eee; z-index: 100; overflow: hidden; }
.dropdown-header { padding: 15px; background: #fdfbf7; border-bottom: 1px solid #eee; display: flex; gap: 12px; align-items: center; }
.header-avatar-img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.header-avatar { width: 40px; height: 40px; background: #a67c52; color: #fff; border-radius: 50%; display: grid; place-items: center; font-weight: 700; }
.header-info { display: flex; flex-direction: column; overflow: hidden; }
.d-name { font-weight: 700; color: #333; font-size: 0.95rem; }
.d-email { font-size: 0.8rem; color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.dropdown-body { padding: 5px 0; }
.menu-item { padding: 12px 20px; font-size: 0.9rem; color: #555; display: flex; align-items: center; gap: 10px; transition: 0.2s; }
.menu-item:hover { background: #f9f9f9; color: #a67c52; padding-left: 25px; }
.menu-divider { height: 1px; background: #eee; margin: 5px 20px; }
.menu-item.logout { color: #e74c3c; }
.menu-item.logout:hover { background: #fff5f5; }

/* Animation */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(10px); }

.content-view { padding: 30px; }
</style>