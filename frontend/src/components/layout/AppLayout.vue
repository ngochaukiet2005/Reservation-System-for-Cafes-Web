<template>
  <div class="app-container">
    <Sidebar class="sidebar" />
    <main class="main-content">
      <header class="top-bar">
        <h1>Hệ thống đặt bàn Cafe</h1>
        <button>Logout</button>
      </header>
      
      <div class="content-view">
        <slot /> </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue';
</script>

<style scoped>
.app-container { display: flex; min-height: 100vh; }
.sidebar { width: 250px; background: #2c3e50; color: white; }
.main-content { flex: 1; padding: 20px; }
.top-bar { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;}
</style>