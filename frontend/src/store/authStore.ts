// frontend/src/store/authStore.ts
import { reactive } from 'vue';
import { authApi } from '../api/authApi';

// 1. Định nghĩa lại User Interface
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: 'Nam' | 'Nữ';
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  avatar?: string;
}

// 2. Định nghĩa bộ ảnh Avatar đồng bộ
const AVATAR_MALE = 'https://cdn-icons-png.flaticon.com/512/4042/4042356.png'; 
const AVATAR_FEMALE = 'https://cdn-icons-png.flaticon.com/512/4042/4042422.png'; 

export const authStore = reactive({
  // --- KHỞI TẠO STATE TỪ LOCAL STORAGE ---
  token: localStorage.getItem('auth_token') || '',
  user: JSON.parse(localStorage.getItem('auth_user') || 'null') as User | null,
  isAuthenticated: !!localStorage.getItem('auth_token'), // Kiểm tra token thay vì user
  
  isLoading: false,

  // --- LOGIC ĐĂNG NHẬP ---
  async login(payload: { email: string; password: string }) {
    this.isLoading = true;
    try {
      const response = await authApi.login(payload);
      const { token, user } = response.data;

      const avatar = user.role === 'ADMIN' || user.role === 'STAFF' ? AVATAR_MALE : AVATAR_FEMALE;

      this.setUser(
        user.id,
        user.name,
        user.email,
        user.phone || '',
        '',
        'Nam',
        user.role,
        avatar
      );

      this.token = token;
      localStorage.setItem('auth_token', token);
      
      this.isLoading = false;
      return true;
    } catch (error: any) {
      this.isLoading = false;
      throw error.response?.data?.message || 'Đăng nhập thất bại!';
    }
  },

  // --- LOGIC ĐĂNG KÝ ---
  async register(payload: { name: string; email: string; phone: string; address: string; gender: 'Nam' | 'Nữ'; password: string }) {
    this.isLoading = true;
    try {
      const response = await authApi.register({
        name: payload.name,
        email: payload.email,
        password: payload.password,
      });

      const { token, user } = response.data;
      const avatar = payload.gender === 'Nam' ? AVATAR_MALE : AVATAR_FEMALE;

      this.setUser(
        user.id,
        user.name,
        user.email,
        user.phone,
        payload.address,
        payload.gender,
        user.role,
        avatar
      );

      this.token = token;
      localStorage.setItem('auth_token', token);

      this.isLoading = false;
      return true;
    } catch (error: any) {
      this.isLoading = false;
      throw error.response?.data?.message || 'Đăng ký thất bại!';
    }
  },

  // --- CẬP NHẬT THÔNG TIN ---
  async updateProfile(payload: { name: string; phone: string; address: string; gender: 'Nam' | 'Nữ'; avatarFile?: File | null }) {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isLoading = false;
        if (this.user) {
          const oldAvatar = this.user.avatar;
          
          this.user.name = payload.name;
          this.user.phone = payload.phone;
          this.user.address = payload.address;
          this.user.gender = payload.gender;

          if (payload.avatarFile) {
            this.user.avatar = URL.createObjectURL(payload.avatarFile);
          } else {
            const isUsingDefaultMale = oldAvatar === AVATAR_MALE;
            const isUsingDefaultFemale = oldAvatar === AVATAR_FEMALE;

            if (payload.gender === 'Nam' && isUsingDefaultFemale) {
                 this.user.avatar = AVATAR_MALE;
            } 
            else if (payload.gender === 'Nữ' && isUsingDefaultMale) {
                 this.user.avatar = AVATAR_FEMALE;
            }
          }
          
          // Cập nhật lại localStorage
          localStorage.setItem('auth_user', JSON.stringify(this.user));

          resolve(true);
        }
      }, 1000);
    });
  },

  // --- ĐĂNG XUẤT (Clear cả Storage) ---
  // [QUAN TRỌNG] Hàm này phải xóa sạch mọi thứ
  logout() {
    this.token = '';
    this.user = null;
    this.isAuthenticated = false;

    // Xóa sạch localStorage để F5 không bị load lại
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  // --- SET USER ---
  setUser(id: number, name: string, email: string, phone: string, address: string, gender: 'Nam'|'Nữ', role: any, avatar: string) {
    this.user = { id, name, email, phone, address, gender, role, avatar };
    this.isAuthenticated = true;
    localStorage.setItem('auth_user', JSON.stringify(this.user));
  },

  // ... (Các hàm Mock khác giữ nguyên)
  async sendOtp(email: string) { /* ... */ return Promise.resolve(true); },
  async verifyOtp(email: string, code: string) { /* ... */ return Promise.resolve(true); },
  async resetPassword(email: string, newPass: string) { /* ... */ return Promise.resolve(true); },
  async changePassword(payload: { currentPass: string; newPass: string }) { /* ... */ return Promise.resolve(true); },
});