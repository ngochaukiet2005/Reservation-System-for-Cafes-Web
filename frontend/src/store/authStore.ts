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
  // --- KHỞI TẠO STATE TỪ LOCAL STORAGE (Để F5 không bị mất dữ liệu) ---
  token: localStorage.getItem('auth_token') || '',
  user: JSON.parse(localStorage.getItem('auth_user') || 'null') as User | null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  
  isLoading: false,

  // --- LOGIC ĐĂNG NHẬP - GỌI API THỰC ---
  async login(payload: { email: string; password: string }) {
    this.isLoading = true;
    try {
      const response = await authApi.login(payload);
      const { token, user } = response.data;

      // Lấy avatar dựa trên role
      const avatar = user.role === 'ADMIN' || user.role === 'STAFF' ? AVATAR_MALE : AVATAR_FEMALE;

      this.setUser(
        user.id,
        user.name, // Lấy từ backend (user_name)
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

  // --- LOGIC ĐĂNG KÝ - GỌI API THỰC ---
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
        payload.phone,
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

          // Logic đổi Avatar:
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
          
          // [QUAN TRỌNG] Cập nhật lại localStorage sau khi sửa để F5 vẫn giữ thông tin mới
          localStorage.setItem('auth_user', JSON.stringify(this.user));

          resolve(true);
        }
      }, 1000);
    });
  },

  // --- ĐĂNG XUẤT (Clear cả Storage) ---
  logout() {
    this.token = '';
    this.user = null;
    this.isAuthenticated = false;

    // Xóa sạch localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  // --- SET USER (Lưu cả Storage) ---
  setUser(id: number, name: string, email: string, phone: string, address: string, gender: 'Nam'|'Nữ', role: any, avatar: string) {
    this.user = { id, name, email, phone, address, gender, role, avatar };
    this.isAuthenticated = true;

    // Lưu vào localStorage ngay khi set user
    localStorage.setItem('auth_user', JSON.stringify(this.user));
  },

  // --- CÁC HÀM KHÁC GIỮ NGUYÊN ---
  async sendOtp(email: string) {
    this.isLoading = true;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.isLoading = false;
        if (email.includes('@')) {
          console.log(`[MOCK EMAIL] OTP cho ${email} là: 123456`);
          resolve(true);
        } else {
          reject('Email không tồn tại trong hệ thống!');
        }
      }, 1000);
    });
  },

  async verifyOtp(email: string, code: string) {
    this.isLoading = true;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.isLoading = false;
        if (code === '123456') {
          resolve(true);
        } else {
          reject('Mã xác nhận không đúng.');
        }
      }, 800);
    });
  },

  async resetPassword(email: string, newPass: string) {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isLoading = false;
        console.log(`[DB UPDATE] User ${email} đổi pass thành: ${newPass}`);
        resolve(true);
      }, 1000);
    });
  },

  async changePassword(payload: { currentPass: string; newPass: string }) {
    this.isLoading = true;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.isLoading = false;
        if (payload.currentPass !== '123456') {
          reject('Mật khẩu hiện tại không chính xác!');
        } else {
          console.log('[MOCK DB] Đã cập nhật mật khẩu mới:', payload.newPass);
          resolve(true);
        }
      }, 1000);
    });
  },
});