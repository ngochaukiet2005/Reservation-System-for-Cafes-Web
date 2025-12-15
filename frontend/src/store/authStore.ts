import { reactive } from 'vue';

export const authStore = reactive({
  token: '',
  user: null as { id: number; name: string; email: string; role: 'ADMIN' | 'STAFF' | 'CUSTOMER' } | null,
  isAuthenticated: false,
  isLoading: false,

  // --- LOGIC ĐĂNG NHẬP (CŨ) ---
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

  // --- LOGIC ĐĂNG KÝ (CŨ) ---
  async register(payload: { name: string; email: string; phone: string; password: string }) {
    this.isLoading = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isLoading = false;
        console.log('Register Data:', payload);
        this.setUser(new Date().getTime(), payload.name, payload.email, 'CUSTOMER');
        resolve(true);
      }, 1000);
    });
  },

  // --- LOGIC QUÊN MẬT KHẨU (MỚI) ---
  
  // Bước 1: Gửi OTP
  async sendOtp(email: string) {
    this.isLoading = true;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.isLoading = false;
        // Giả lập: Email phải chứa '@' mới hợp lệ
        if (email.includes('@')) {
          console.log(`[MOCK EMAIL] OTP cho ${email} là: 123456`);
          resolve(true);
        } else {
          reject('Email không tồn tại trong hệ thống!');
        }
      }, 1000);
    });
  },

  // Bước 2: Kiểm tra OTP
  async verifyOtp(email: string, code: string) {
    this.isLoading = true;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.isLoading = false;
        if (code === '123456') { // Mã mặc định để test
          resolve(true);
        } else {
          reject('Mã xác nhận không đúng. Vui lòng thử lại (Gợi ý: 123456)');
        }
      }, 800);
    });
  },

  // Bước 3: Đặt lại mật khẩu
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
  // --- THÊM HÀM NÀY VÀO DƯỚI CÙNG CỦA OBJECT ---
  
  // Giả lập đổi mật khẩu
  async changePassword(payload: { currentPass: string; newPass: string }) {
    this.isLoading = true;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.isLoading = false;
        
        // Giả lập logic Backend: 
        // Kiểm tra mật khẩu hiện tại có đúng là '123456' không (hoặc pass bất kỳ bạn muốn test)
        if (payload.currentPass !== '123456') {
          reject('Mật khẩu hiện tại không chính xác!');
        } else {
          console.log('[MOCK DB] Đã cập nhật mật khẩu mới:', payload.newPass);
          resolve(true); // Thành công
        }
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