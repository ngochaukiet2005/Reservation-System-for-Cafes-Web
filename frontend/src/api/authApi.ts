import { httpClient } from './httpClient';

// --- CẤU HÌNH: Đặt true để test giao diện, đặt false khi kết nối Backend ---
const IS_MOCK_MODE = true; 

export const authApi = {
  // 1. Đăng nhập (Chế độ Mock thông minh)
  async login(payload: any) {
    if (IS_MOCK_MODE) {
      console.log(`[Mock API] Đăng nhập với: ${payload.email}`);
      await new Promise((resolve) => setTimeout(resolve, 800)); // Giả lập mạng chậm 0.8s

      // Logic giả lập: Phân quyền dựa trên Email người dùng nhập
      let role = 'CUSTOMER';
      let name = 'Khách Hàng Test';
      
      if (payload.email.includes('admin')) {
        role = 'ADMIN';
        name = 'Quản Trị Viên';
      } else if (payload.email.includes('staff')) {
        role = 'STAFF';
        name = 'Nhân Viên Test';
      }

      // Trả về cấu trúc dữ liệu y hệt Backend thật
      return {
        data: {
          token: 'mock-jwt-token-123456789',
          user: {
            id: Math.floor(Math.random() * 1000),
            name: name,
            email: payload.email,
            phone: '0901234567',
            address: 'TP.HCM',
            role: role,
            gender: 'Nam'
          }
        }
      };
    }
    // Nếu tắt Mock Mode thì gọi API thật
    return httpClient.post('/auth/login', payload);
  },

  // 2. Đăng ký (Mock)
  async register(payload: any) {
    if (IS_MOCK_MODE) {
      console.log(`[Mock API] Đăng ký mới: ${payload.email}`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      return {
        data: {
          token: 'mock-jwt-token-register-999',
          user: {
            id: Date.now(),
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            address: payload.address,
            role: 'CUSTOMER', // Mặc định đăng ký là Customer
            gender: payload.gender || 'Nam'
          }
        }
      };
    }
    return httpClient.post('/auth/register', payload);
  },

  // 3. Quên mật khẩu (Giữ nguyên Mock cũ của bạn)
  async forgotPassword(email: string) {
    console.log(`[Mock API] Gửi OTP quên mật khẩu tới: ${email}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, message: 'Mã xác nhận đã được gửi (Mock: 123456)!' };
  },

  // 4. Kiểm tra OTP (Giữ nguyên Mock cũ)
  async verifyOtp(email: string, code: string) {
    console.log(`[Mock API] Verify OTP: ${code}`);
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (code === '123456') {
      return { success: true };
    } else {
      throw new Error('Mã xác nhận sai (Gợi ý: nhập 123456)');
    }
  },

  // 5. Reset mật khẩu (Giữ nguyên Mock cũ)
  async resetPassword(email: string, code: string, newPassword: string) {
    console.log(`[Mock API] Đổi mật khẩu thành công cho ${email}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, message: 'Đổi mật khẩu thành công!' };
  },
};