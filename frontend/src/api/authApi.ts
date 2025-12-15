import { httpClient } from './httpClient';

export const authApi = {
  login: (payload: unknown) => httpClient.post('/auth/login', payload),
  register: (payload: unknown) => httpClient.post('/auth/register', payload),
  // 1. Gửi yêu cầu quên mật khẩu (Kiểm tra email & gửi mã)
  async forgotPassword(email: string) {
    console.log(`[Mock API] Đang kiểm tra email và gửi OTP tới: ${email}`);
    // Giả lập độ trễ mạng
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Giả lập logic: Trả về thành công
    // Khi có Backend: return httpClient.post('/auth/forgot-password', { email });
    return { success: true, message: 'Mã xác nhận đã được gửi!' };
  },

  // 2. Kiểm tra mã OTP
  async verifyOtp(email: string, code: string) {
    console.log(`[Mock API] Kiểm tra OTP ${code} cho email ${email}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Giả lập logic: Nếu mã là '123456' thì đúng
    if (code === '123456') {
      // Khi có Backend: return httpClient.post('/auth/verify-otp', { email, code });
      return { success: true };
    } else {
      throw new Error('Mã xác nhận không chính xác (Thử nhập 123456)');
    }
  },

  // 3. Đặt lại mật khẩu mới
  async resetPassword(email: string, code: string, newPassword: string) {
    console.log(`[Mock API] Đổi mật khẩu mới cho ${email}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Khi có Backend: return httpClient.post('/auth/reset-password', { email, code, newPassword });
    return { success: true, message: 'Đổi mật khẩu thành công!' };
  },
};
