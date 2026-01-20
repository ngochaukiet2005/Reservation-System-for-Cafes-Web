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

curl -X POST http://localhost:3000/users/staff ^
 -H "Content-Type: application/json" ^
 -H "Authorization: Bearer TOKEN" ^
 -d "{ \"email\":\"staff@cafe.com\", \"password\":\"staff123\", \"user_name\":\"Nguyễn Văn A\", \"phone_number\":\"0901234567\" }"