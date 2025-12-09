import { reactive } from 'vue';

export const authStore = reactive({
  token: '',
  user: null as { id: number; name: string; email: string; role: 'ADMIN' | 'STAFF' | 'CUSTOMER' } | null,
  isAuthenticated: false,
  isLoading: false,

  // Giả lập Login
  async login(payload: { email: string; password: string }) {
    this.isLoading = true;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.isLoading = false;
        if (payload.email.includes('admin')) {
          this.setUser(1, 'Quản Trị Viên', payload.email, 'ADMIN');
          resolve(true);
        } else if (payload.email.includes('staff')) {
          this.setUser(2, 'Nhân Viên Phục Vụ', payload.email, 'STAFF');
          resolve(true);
        } else if (payload.email.includes('@')) {
          this.setUser(3, 'Khách Hàng Thân Thiết', payload.email, 'CUSTOMER');
          resolve(true);
        } else {
          reject('Email hoặc mật khẩu không đúng!');
        }
      }, 800);
    });
  },

  // THÊM: phone vào payload
  async register(payload: { name: string; email: string; phone: string; password: string }) {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isLoading = false;
        console.log('Register Data:', payload); // Log ra để kiểm tra
        this.setUser(new Date().getTime(), payload.name, payload.email, 'CUSTOMER');
        resolve(true);
      }, 1000);
    });
  },

  logout() {
    this.token = '';
    this.user = null;
    this.isAuthenticated = false;
  },

  setUser(id: number, name: string, email: string, role: any) {
    this.token = 'fake-jwt-token';
    this.user = { id, name, email, role };
    this.isAuthenticated = true;
  }
});