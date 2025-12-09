import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue'; // <-- File mới
import CustomerReservationView from '../views/customer/CustomerReservationView.vue';
import CustomerHistoryView from '../views/customer/CustomerHistoryView.vue';
import StaffDashboardView from '../views/staff/StaffDashboardView.vue';
// import AdminDashboardView from '../views/admin/AdminDashboardView.vue';

const routes = [
  { path: '/', component: HomeView }, // Trang chủ là trang đầu tiên

  // Customer Routes
  { path: '/reservation', component: CustomerReservationView },
  { path: '/history', component: CustomerHistoryView },

  // Staff Routes
  { path: '/staff/dashboard', component: StaffDashboardView },
  
  // Admin Routes...
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;