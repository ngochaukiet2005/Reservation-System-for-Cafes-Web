<template>
  <aside class="sidebar">
    <div class="logo-area" @click="$router.push('/')">
      <img src="../../assets/logo.png" alt="Logo" class="sidebar-logo">
      <div class="logo-text">
        <span>Trạm Sạc FC</span>
        <small>RESERVATION</small>
      </div>
    </div>

    <nav class="nav-links">
      <div class="nav-section">
        <span class="section-title">Khách Hàng</span>
        <router-link to="/reservation" class="nav-item">📅 Đặt bàn mới</router-link>
        <router-link to="/history" class="nav-item">📜 Lịch sử đặt bàn</router-link>
      </div>
      
      <div class="divider"></div>

      <div class="nav-section" v-if="['STAFF', 'ADMIN'].includes(authStore.user?.role || '')">
        <span class="section-title">Nhân Viên</span>
        <router-link to="/staff/dashboard" class="nav-item">⚡ Dashboard</router-link>
      </div>

       <div class="nav-section" v-if="authStore.user?.role === 'ADMIN'">
        <span class="section-title">Quản Trị Viên</span>
        <router-link to="/admin/dashboard" class="nav-item">📊 Thống kê</router-link>
        <router-link to="/admin/tables" class="nav-item">🪑 Quản lý bàn</router-link>
        <router-link to="/admin/staff" class="nav-item">👥 Quản lý nhân viên</router-link>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { authStore } from '../../store/authStore';
</script>

<style scoped>
.sidebar {
  width: 260px; background: #1a1a1a; color: #fff; display: flex; flex-direction: column;
  border-right: 1px solid rgba(255,255,255,0.05);
}
.logo-area {
  height: 70px; display: flex; align-items: center; padding: 0 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer;
}
.sidebar-logo { height: 35px; margin-right: 10px; filter: brightness(0) invert(1); }
.logo-text { display: flex; flex-direction: column; }
.logo-text span { font-weight: 700; color: #a67c52; font-size: 1rem; letter-spacing: 0.5px; }
.logo-text small { font-size: 0.6rem; color: #666; letter-spacing: 2px; }

.nav-links { flex: 1; padding: 25px 15px; }
.section-title { font-size: 0.7rem; text-transform: uppercase; color: #666; font-weight: 700; margin-bottom: 10px; display: block; padding-left: 10px; }
.nav-item {
  display: block; padding: 12px 15px; color: #aaa; text-decoration: none;
  border-radius: 8px; margin-bottom: 5px; font-weight: 500; font-size: 0.9rem; transition: 0.2s;
}
.nav-item:hover { background: rgba(255,255,255,0.05); color: #fff; padding-left: 20px; }
.nav-item.router-link-active { 
  background: linear-gradient(90deg, #a67c52 0%, #8e653d 100%); 
  color: #fff; font-weight: 600; box-shadow: 0 4px 15px rgba(166, 124, 82, 0.2);
}
.divider { height: 1px; background: rgba(255,255,255,0.1); margin: 15px 10px 20px; }
</style>