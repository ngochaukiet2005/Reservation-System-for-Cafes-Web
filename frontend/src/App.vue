<template>
  <AppLayout v-if="route.meta.layout === 'customer'">
    <router-view />
  </AppLayout>

  <router-view v-else />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import AppLayout from './components/layout/AppLayout.vue';

const route = useRoute();
// Không cần computed phức tạp, template sẽ tự reactivity với route.meta
</script>

<style>
body { 
  margin: 0; 
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
}
</style>