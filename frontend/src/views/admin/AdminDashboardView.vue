<template>
  <div class="admin-dashboard">
    <h1 class="page-title">Tổng quan Hệ thống</h1>

    <div v-if="loading" class="loading-text">Đang tải dữ liệu...</div>

    <div v-else class="stats-grid">
      <div class="stat-card revenue">
        <div class="icon">💰</div>
        <div class="info">
          <h3>Doanh thu ngày</h3>
          <p>{{ formatCurrency(stats.totalRevenue) }}</p>
        </div>
      </div>

      <div class="stat-card orders">
        <div class="icon">🧾</div>
        <div class="info">
          <h3>Đơn đặt bàn</h3>
          <p>{{ stats.totalOrders }} đơn</p>
        </div>
      </div>

      <div class="stat-card tables">
        <div class="icon">🪑</div>
        <div class="info">
          <h3>Tổng số bàn</h3>
          <p>{{ stats.activeTables }} bàn</p>
        </div>
      </div>

      <div class="stat-card staff">
        <div class="icon">users</div>
        <div class="info">
          <h3>Tổng nhân viên</h3>
          <p>{{ stats.totalStaff }} người</p>
        </div>
      </div>
    </div>
    
    <div class="recent-activity section-box">
      <h2>Hoạt động gần đây</h2>
      <p class="empty-text">Chưa có hoạt động mới ghi nhận.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminApi, type DashboardStats } from '../../api/adminApi';

const stats = ref<DashboardStats>({
  totalRevenue: 0,
  totalOrders: 0,
  activeTables: 0,
  totalStaff: 0
});

const loading = ref(true);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

onMounted(async () => {
  try {
    const data = await adminApi.getDashboardStats();
    stats.value = data;
  } catch (error) {
    console.error("Lỗi tải dashboard:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}
.page-title {
  margin-bottom: 24px;
  font-size: 1.8rem;
  color: #2c3e50;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  transition: transform 0.2s;
}
.stat-card:hover {
  transform: translateY(-5px);
}
.icon {
  font-size: 2.5rem;
  margin-right: 15px;
  background: #f0f2f5;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.info h3 {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0;
}
.info p {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 5px 0 0 0;
}
.revenue .icon { color: #27ae60; background: #eafaf1; }
.orders .icon { color: #2980b9; background: #ebf5fb; }
.tables .icon { color: #e67e22; background: #fdf2e9; }
.staff .icon { color: #8e44ad; background: #f4ecf7; }

.section-box {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.empty-text {
  color: #95a5a6;
  font-style: italic;
}
</style>