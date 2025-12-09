<template>
  <AppLayout v-if="requiresLayout">
    <router-view />
  </AppLayout>

  <router-view v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from './components/layout/AppLayout.vue';

const route = useRoute();

// Chỉ hiện Layout (Sidebar) nếu KHÔNG phải trang chủ
const requiresLayout = computed(() => route.path !== '/');
</script>

<style>
body { margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
</style>