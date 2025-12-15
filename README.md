# Hệ thống Quản lý Đặt bàn Quán Cà phê (Reservation System for Cafes)

## Tổng quan Dự án
Đây là ứng dụng web nhằm hỗ trợ quản lý quy trình đặt bàn tại quán cà phê, giúp tối ưu hóa việc sắp xếp chỗ ngồi cho khách hàng và quản lý lịch làm việc cho nhân viên. Hệ thống cung cấp giải pháp toàn diện kết nối giữa Khách hàng, Nhân viên phục vụ và Quản trị viên.

Dự án được xây dựng theo kiến trúc RESTful API với Backend xử lý logic và Frontend hiển thị giao diện người dùng (SPA).

## Công nghệ Sử dụng

### Frontend (Giao diện)
- Vue 3 (Composition API): Xây dựng giao diện người dùng.
- TypeScript: Đảm bảo kiểu dữ liệu chặt chẽ.
- Vite: Công cụ build và môi trường phát triển siêu tốc.
- Pinia: Quản lý trạng thái (State Management).
- Vue Router: Quản lý điều hướng trang.
- CSS/SCSS: Tùy chỉnh giao diện và hiệu ứng.

### Backend (Máy chủ)
- NestJS: Framework Node.js xây dựng API.
- TypeScript: Ngôn ngữ chính.
- PostgreSQL: Hệ quản trị cơ sở dữ liệu quan hệ.
- TypeORM: Tương tác với cơ sở dữ liệu.
- JWT (JSON Web Token): Xác thực và phân quyền người dùng.

### Hạ tầng & Công cụ khác
- Docker & Docker Compose: Đóng gói môi trường triển khai.
- Git: Quản lý phiên bản mã nguồn.

## Các Tính năng Chính

### 1. Dành cho Khách hàng (Customer)
- Đăng ký và Đăng nhập tài khoản (bao gồm quên mật khẩu, đổi mật khẩu).
- Quản lý hồ sơ cá nhân (cập nhật thông tin, ảnh đại diện, giới tính).
- Xem thực đơn và thông tin quán.
- Đặt bàn trực tuyến (chọn thời gian, số lượng người, vị trí bàn).
- Xem lịch sử đặt bàn.

### 2. Dành cho Nhân viên (Staff)
- Dashboard làm việc cho nhân viên.
- Tiếp nhận và xử lý yêu cầu đặt bàn (Duyệt/Từ chối).
- Hỗ trợ Check-in/Check-out cho khách hàng tại quán.
- Kiểm tra trạng thái bàn (Trống/Đang có khách).

### 3. Dành cho Quản trị viên (Admin)
- Quản lý toàn bộ hệ thống.
- Quản lý danh sách bàn (Thêm/Sửa/Xóa bàn, thiết lập khu vực).
- Quản lý tài khoản nhân viên.
- Xem báo cáo thống kê hoạt động.

## Hướng dẫn Cài đặt và Chạy Dự án

### Yêu cầu hệ thống
- Node.js (phiên bản 18 trở lên)
- PostgreSQL (hoặc Docker để chạy container Database)
- npm hoặc yarn

### Khởi chạy Backend
1. Di chuyển vào thư mục backend:
   cd backend
2. Cài đặt các gói phụ thuộc:
   npm install
3. Cấu hình biến môi trường:
   Sao chép file .env.example thành .env và cập nhật thông tin Database.
4. Chạy server ở chế độ phát triển:
   npm run start:dev

### Khởi chạy Frontend
1. Di chuyển vào thư mục frontend:
   cd frontend
2. Cài đặt các gói phụ thuộc:
   npm install
3. Chạy ứng dụng ở chế độ phát triển:
   npm run dev

## Cấu trúc Thư mục
- backend/: Chứa mã nguồn API NestJS.
- frontend/: Chứa mã nguồn giao diện VueJS.
- docs/: Chứa tài liệu phân tích thiết kế và nghiệp vụ.

## Trạng thái Phát triển
Hiện tại dự án đang trong giai đoạn phát triển Frontend và tích hợp các API cơ bản.
- Đã hoàn thiện: UI Trang chủ, Xác thực (Popup Đăng nhập/Đăng ký/Quên mật khẩu/Đổi mật khẩu/Sửa hồ sơ).
- Đang phát triển: Logic đặt bàn và kết nối Backend.