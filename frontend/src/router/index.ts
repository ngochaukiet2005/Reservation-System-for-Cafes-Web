import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CustomerReservationView from '../views/customer/CustomerReservationView.vue';
import CustomerHistoryView from '../views/customer/CustomerHistoryView.vue';
import StaffDashboardView from '../views/staff/StaffDashboardView.vue';

const routes = [
  // 1. Trang chủ (Không cần Sidebar khách hàng)
  { 
    path: '/', 
    component: HomeView 
  }, 

  // 2. Các trang Khách hàng (CẦN Sidebar khách hàng -> Thêm meta: layout 'customer')
  { 
    path: '/reservation', 
    component: CustomerReservationView,
    meta: { layout: 'customer' } 
  },
  { 
    path: '/history', 
    component: CustomerHistoryView,
    meta: { layout: 'customer' } 
  },

  // 3. Trang Staff (Tự có giao diện riêng -> Không cần meta layout)
  { 
    path: '/staff/dashboard', 
    component: StaffDashboardView 
  },
  
  // Admin Routes...
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;