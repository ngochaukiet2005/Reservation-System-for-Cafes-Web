import axios from 'axios';
import router from '../router';

// Support both env keys from docs/code and provide a sensible default
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  'http://localhost:3000';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
});

// Thêm token vào header cho mỗi request
httpClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Nếu token hết hạn hoặc thiếu -> tự động chuyển về trang đăng nhập
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Dọn token ở session
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');

      // Chỉ redirect nếu chưa ở trang login
      if (router.currentRoute.value.path !== '/login') {
        router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } });
      }
    }
    return Promise.reject(error);
  },
);
