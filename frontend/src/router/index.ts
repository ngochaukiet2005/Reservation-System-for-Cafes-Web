import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CustomerReservationView from '../views/customer/CustomerReservationView.vue';
import CustomerHistoryView from '../views/customer/CustomerHistoryView.vue';
import StaffDashboardView from '../views/staff/StaffDashboardView.vue';
import LoginView from '../views/LoginView.vue';
import { authStore } from '../store/authStore';

// --- Imports cho phần Admin (Mới thêm) ---
// Lưu ý: Đảm bảo bạn đã tạo các file này hoặc comment lại nếu chưa tạo
import AdminLayout from '../components/layout/AdminLayout.vue';
import AdminDashboardView from '../views/admin/AdminDashboardView.vue';
import ManageTablesView from '../views/admin/ManageTablesView.vue';
import ManageStaffView from '../views/admin/ManageStaffView.vue';

const routes = [
  // 1. Trang chủ (Giữ nguyên)
  { 
    path: '/', 
    component: HomeView 
  }, 

  // Trang đăng nhập riêng (ngoài modal)
  {
    path: '/login',
    component: LoginView,
    meta: { public: true },
  },

  // 2. Các trang Khách hàng (Giữ nguyên)
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

  // 3. Trang Staff (Giữ nguyên)
  { 
    path: '/staff/dashboard', 
    component: StaffDashboardView 
  },
  
  // 4. Admin Routes (MỚI THÊM)
  // Sử dụng Nested Routes để áp dụng AdminLayout cho tất cả các trang con
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['ADMIN'] },
    children: [
      {
        path: '', 
        redirect: '/admin/dashboard' // Mặc định chuyển hướng vào dashboard
      },
      {
        path: 'dashboard',
        component: AdminDashboardView
      },
      {
        path: 'tables', // URL: /admin/tables
        component: ManageTablesView,
        meta: { requiresAuth: true, roles: ['ADMIN'] },
      },
      {
        path: 'staff', // URL: /admin/staff
        component: ManageStaffView,
        meta: { requiresAuth: true, roles: ['ADMIN'] },
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Chặn truy cập admin khi chưa đăng nhập hoặc sai vai trò
router.beforeEach((to: RouteLocationNormalized, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const allowedRoles = to.matched
    .map((record) => record.meta.roles as string[] | undefined)
    .find((roles) => Array.isArray(roles));

  if (!requiresAuth) {
    next();
    return;
  }

  if (!authStore.token) {
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }

  if (allowedRoles && !allowedRoles.includes(authStore.user?.role || '')) {
    next('/');
    return;
  }

  next();
});

export default router;