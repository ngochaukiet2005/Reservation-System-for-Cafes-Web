<script setup lang="ts">
// Chỉ là giao diện tĩnh để demo
</script>

<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="icon blue">📅</div>
        <div class="info">
          <h3>Hôm nay</h3>
          <p class="value">24 Đơn đặt</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon green">💰</div>
        <div class="info">
          <h3>Doanh thu (Ước tính)</h3>
          <p class="value">5.200.000 ₫</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon orange">👥</div>
        <div class="info">
          <h3>Khách đang ngồi</h3>
          <p class="value">18 / 50</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon red">⚠️</div>
        <div class="info">
          <h3>Cần xử lý</h3>
          <p class="value">3 Đơn chờ</p>
        </div>
      </div>
    </div>

    <div class="chart-placeholder">
      <h3>Biểu đồ lượng khách trong tuần (Demo)</h3>
      <div class="fake-chart">
        <div class="bar" style="height: 40%"></div>
        <div class="bar" style="height: 60%"></div>
        <div class="bar" style="height: 30%"></div>
        <div class="bar" style="height: 80%"></div>
        <div class="bar" style="height: 50%"></div>
        <div class="bar" style="height: 90%"></div>
        <div class="bar" style="height: 75%"></div>
      </div>
      <div class="chart-labels">
        <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
.stat-card { background: white; padding: 20px; border-radius: 12px; display: flex; align-items: center; gap: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.icon { width: 50px; height: 50px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
.icon.blue { background: #e3f2fd; color: #2196f3; }
.icon.green { background: #e8f5e9; color: #4caf50; }
.icon.orange { background: #fff3e0; color: #ff9800; }
.icon.red { background: #ffebee; color: #f44336; }
.info h3 { font-size: 0.9rem; color: #7f8c8d; margin: 0; }
.info .value { font-size: 1.5rem; font-weight: bold; color: #2c3e50; margin: 5px 0 0 0; }

.chart-placeholder { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.fake-chart { height: 200px; display: flex; justify-content: space-around; align-items: flex-end; padding-bottom: 10px; border-bottom: 1px solid #eee; }
.bar { width: 40px; background: #42b983; border-radius: 4px 4px 0 0; opacity: 0.8; }
.chart-labels { display: flex; justify-content: space-around; margin-top: 10px; color: #7f8c8d; }
</style>