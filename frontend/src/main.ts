// frontend/src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue'; // <-- Import file App vừa tạo
import router from './router';

const app = createApp(App); // <-- Truyền App vào đây thay vì {}
app.use(createPinia());
app.use(router);
app.mount('#app');