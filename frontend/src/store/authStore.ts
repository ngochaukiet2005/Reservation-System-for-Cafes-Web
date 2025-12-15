import { reactive } from 'vue';

// 1. Định nghĩa lại User Interface
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: 'Nam' | 'Nữ';
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  avatar?: string;
}

// 2. Định nghĩa bộ ảnh Avatar đồng bộ (Style: Flat Circle)
// Ảnh Nam: Tóc ngắn, gọn gàng
const AVATAR_MALE = 'https://cdn-icons-png.flaticon.com/512/4042/4042356.png'; 
// Ảnh Nữ: Tóc dài, cùng tông màu và nét vẽ với ảnh Nam
const AVATAR_FEMALE = 'https://cdn-icons-png.flaticon.com/512/4042/4042422.png'; 

export const authStore = reactive({
  token: '',
  user: null as User | null,
  isAuthenticated: false,
  isLoading: false,

  // --- LOGIC ĐĂNG NHẬP ---
  async login(payload: { email: string; password: string }) {
    this.isLoading = true;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.isLoading = false;
        
        // Mock data login
        if (payload.email.includes('admin')) {
          this.setUser(1, 'Quản Trị Viên', payload.email, '0909000111', 'Hà Nội', 'Nam', 'ADMIN', AVATAR_MALE);
          resolve(true);
        } else if (payload.email.includes('staff')) {
          this.setUser(2, 'Nhân Viên', payload.email, '0909000222', 'Đà Nẵng', 'Nam', 'STAFF', AVATAR_MALE);
          resolve(true);
        } else if (payload.email.includes('@')) {
          // Mặc định khách là Nữ để test ảnh
          this.setUser(3, 'Khách Hàng', payload.email, '0909000333', 'TP.HCM', 'Nữ', 'CUSTOMER', AVATAR_FEMALE);
          resolve(true);
        } else {
          reject('Email hoặc mật khẩu không đúng!');
        }
      }, 800);
    });
  },

  // --- LOGIC ĐĂNG KÝ ---
  async register(payload: { name: string; email: string; phone: string; address: string; gender: 'Nam' | 'Nữ'; password: string }) {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isLoading = false;
        console.log('Register Data:', payload);
        
        // Tự động chọn avatar theo giới tính khi đăng ký
        const initialAvatar = payload.gender === 'Nam' ? AVATAR_MALE : AVATAR_FEMALE;

        this.setUser(Date.now(), payload.name, payload.email, payload.phone, payload.address, payload.gender, 'CUSTOMER', initialAvatar);
        resolve(true);
      }, 1000);
    });
  },

  // --- CẬP NHẬT THÔNG TIN ---
  async updateProfile(payload: { name: string; phone: string; address: string; gender: 'Nam' | 'Nữ'; avatarFile?: File | null }) {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isLoading = false;
        if (this.user) {
          // Lưu lại avatar hiện tại để so sánh
          const oldAvatar = this.user.avatar;
          
          this.user.name = payload.name;
          this.user.phone = payload.phone;
          this.user.address = payload.address;
          this.user.gender = payload.gender;

          // Logic đổi Avatar:
          if (payload.avatarFile) {
            // 1. Nếu người dùng upload ảnh riêng -> Dùng ảnh đó
            this.user.avatar = URL.createObjectURL(payload.avatarFile);
          } else {
            // 2. Nếu KHÔNG upload ảnh -> Kiểm tra xem có cần đổi avatar mặc định theo giới tính không
            
            const isUsingDefaultMale = oldAvatar === AVATAR_MALE;
            const isUsingDefaultFemale = oldAvatar === AVATAR_FEMALE;

            // Nếu đang dùng ảnh mặc định Nữ mà chuyển sang Nam -> Đổi sang ảnh Nam
            if (payload.gender === 'Nam' && isUsingDefaultFemale) {
                 this.user.avatar = AVATAR_MALE;
            } 
            // Nếu đang dùng ảnh mặc định Nam mà chuyển sang Nữ -> Đổi sang ảnh Nữ
            else if (payload.gender === 'Nữ' && isUsingDefaultMale) {
                 this.user.avatar = AVATAR_FEMALE;
            }
            // Nếu họ đang dùng ảnh custom (ảnh thật của họ), ta giữ nguyên không tự ý đổi
          }
          
          console.log('[MOCK DB] Updated User:', this.user);
          resolve(true);
        }
      }, 1000);
    });
  },

  logout() {
    this.token = '';
    this.user = null;
    this.isAuthenticated = false;
  },

  setUser(id: number, name: string, email: string, phone: string, address: string, gender: 'Nam'|'Nữ', role: any, avatar: string) {
    this.token = 'fake-jwt-token';
    this.user = { id, name, email, phone, address, gender, role, avatar };
    this.isAuthenticated = true;
  },

  // --- CÁC HÀM KHÁC (Quên mật khẩu / Đổi mật khẩu) ---
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