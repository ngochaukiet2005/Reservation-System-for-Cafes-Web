# Hệ thống Quản lý Đặt bàn Quán Cà phê (Cafe Reservation System)

## Tổng quan Dự án
Đây là ứng dụng web toàn diện hỗ trợ quản lý quy trình đặt bàn tại quán cà phê. Hệ thống được thiết kế để kết nối ba đối tượng người dùng: Khách hàng (Customer), Nhân viên (Staff), và Quản trị viên (Admin). Dự án sử dụng kiến trúc phân tách rõ ràng giữa Backend (NestJS API) và Frontend (Vue 3 SPA), hỗ trợ cập nhật trạng thái thời gian thực thông qua WebSockets.

## Công nghệ Sử dụng

### Backend (Máy chủ API)
* **Framework:** NestJS (Node.js)
* **Ngôn ngữ:** TypeScript
* **Cơ sở dữ liệu:** PostgreSQL
* **ORM:** TypeORM (Tương tác cơ sở dữ liệu)
* **Xác thực:** Passport, JWT (JSON Web Token), BCrypt
* **Real-time:** Socket.IO (NestJS WebSockets)
* **Validation:** class-validator, class-transformer

### Frontend (Giao diện người dùng)
* **Framework:** Vue 3 (Composition API)
* **Ngôn ngữ:** TypeScript
* **Build Tool:** Vite
* **State Management:** Pinia
* **Routing:** Vue Router
* **HTTP Client:** Axios
* **Real-time Client:** Socket.io-client
* **UI/Notifications:** SweetAlert2, CSS/SCSS

## Các Chức năng Chính

Hệ thống được chia thành các module chức năng dựa trên vai trò người dùng:

### 1. Phân hệ Chung & Xác thực (Auth Module)
* Đăng ký tài khoản (Dành cho Customer).
* Đăng nhập hệ thống (Hỗ trợ Admin, Staff, Customer).
* Quản lý hồ sơ cá nhân.
* Cơ chế phân quyền (Guard & Decorators) để bảo vệ API.

### 2. Phân hệ Khách hàng (Customer)
* Đặt bàn trực tuyến: Chọn ngày, giờ, số lượng người.
* Xem lịch sử đặt bàn cá nhân.
* Theo dõi trạng thái đơn đặt bàn hiện tại.

### 3. Phân hệ Nhân viên (Staff)
* Dashboard làm việc của nhân viên.
* Quản lý danh sách đặt bàn.
* Bản đồ bàn (TableMap): Hiển thị trạng thái bàn trực quan.
* Nhận cập nhật trạng thái đặt bàn thời gian thực (Real-time).

### 4. Phân hệ Quản trị (Admin)
* Dashboard thống kê tổng quan.
* Quản lý nhân viên: Tạo mới, cập nhật thông tin nhân viên.
* Quản lý bàn: Thêm, sửa, xóa bàn và thiết lập trạng thái.
* Khởi tạo dữ liệu mẫu (Seed Module) cho hệ thống.

## Cấu trúc Thư mục

### Backend (backend/src)
* **auth/**: Xử lý đăng nhập, đăng ký, JWT strategy.
* **common/**: Chứa các Decorator (Roles), DTO chung (Pagination), Guard.
* **config/**: Cấu hình cơ sở dữ liệu.
* **reservations/**: Logic xử lý đặt bàn, bao gồm Gateway cho Socket.IO.
* **roles/**: Định nghĩa thực thể vai trò người dùng.
* **seed/**: Service để tạo dữ liệu ban đầu cho database.
* **tables/**: Quản lý thông tin và trạng thái bàn.
* **users/**: Quản lý người dùng và nhân viên.

### Frontend (frontend/src)
* **api/**: Các hàm gọi API (authApi, reservationApi, tableApi, adminApi).
* **assets/**: Hình ảnh và tài nguyên tĩnh.
* **components/**:
  * **common/**: Các thành phần dùng chung (AppButton, AppTable, StatusBadge).
  * **layout/**: Bố cục trang (Sidebar, AdminLayout, AppLayout).
  * **map/**: Sơ đồ bàn (TableMap).
  * **reservations/**: Form đặt bàn và danh sách đặt bàn.
* **realtime/**: Cấu hình kết nối Socket.IO.
* **store/**: Quản lý trạng thái ứng dụng (AuthStore, ReservationStore, TableStore).
* **views/**: Các màn hình chính phân theo vai trò (Admin, Customer, Staff).

## Hướng dẫn Cài đặt và Khởi chạy

### Yêu cầu tiên quyết
* Node.js (v18 trở lên)
* PostgreSQL (đã cài đặt và đang chạy)

### 1. Cài đặt Backend
Di chuyển vào thư mục backend:
```bash
cd backend
```
Tạo file `.env` dựa trên mẫu `.env.example` và cấu hình các biến môi trường cần thiết (ví dụ: kết nối cơ sở dữ liệu).
``` bash
copy .env.example .env
```
Chạy lệnh sau để cài đặt các thư viện phụ thuộc:
```bash
npm install
```
Chạy server phát triển:
```bash
npm run start:dev
```
### 2. Cài đặt Frontend
Di chuyển vào thư mục frontend:
```bash
cd frontend
```
Chạy lệnh sau để cài đặt các thư viện phụ thuộc:
```bash
npm install
```
Chạy ứng dụng frontend:
```bash
npm run dev
```

