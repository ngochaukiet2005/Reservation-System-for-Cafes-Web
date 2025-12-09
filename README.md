# ☕ Reservation System for Cafés  
### Hệ thống đặt bàn thông minh cho quán cà phê – Web Application

---

## 📝 Giới thiệu

**Reservation System for Cafés** là một hệ thống web giúp khách hàng đặt bàn trực tuyến, nhân viên xử lý yêu cầu đặt bàn, và quản trị viên quản lý toàn bộ hoạt động trong quán.  
Hệ thống được xây dựng theo mô hình **REST API Backend + SPA Frontend**, sử dụng **NestJS, PostgreSQL, Vue 3** và hoàn toàn có khả năng triển khai thực tế.

---

## 🚀 Tính năng chính

### 👤 Khách hàng (Customer)
- Tạo yêu cầu đặt bàn (chọn bàn, số lượng khách, thời gian)
- Theo dõi trạng thái đặt bàn: `PENDING`, `CONFIRMED`, `CANCELED`
- Xem lịch sử đặt bàn

### 👨‍🍳 Nhân viên (Staff)
- Xem danh sách yêu cầu đặt bàn đang chờ duyệt
- Xác nhận hoặc từ chối yêu cầu
- Quản lý trạng thái bàn theo ca

### 🛠 Quản trị viên (Admin)
- Quản lý bàn: thêm, sửa, xóa, khóa/mở bàn
- Quản lý tài khoản nhân viên
- Xem thống kê tổng quan
- Theo dõi lịch sử thao tác (Reservation Logs)

---

## 🔧 Backend – NestJS

- **Ngôn ngữ:** TypeScript  
- **Database:** PostgreSQL  
- **ORM:** TypeORM  
- **Auth:** JWT  
- **Cấu trúc module-based MVC**

Các module chính:

- `auth` – đăng nhập / xác thực / phân quyền  
- `users` – quản lý tài khoản (Admin, Staff, Customer)  
- `tables` – quản lý danh sách bàn  
- `reservations` – xử lý quy trình đặt bàn  
- `reservation-logs` – lưu lịch sử thao tác  

---

## 🎨 Frontend – Vue 3 (Vite)

- **Framework:** Vue 3 Composition API  
- **Routing:** Vue Router  
- **State Management:** Pinia  
- **UI tách theo vai trò:**  
  - Customer UI  
  - Staff UI  
  - Admin UI  

---

## 🗄 Database – PostgreSQL

Hỗ trợ chạy theo 2 cách:

1. PostgreSQL cài trực tiếp trên máy  
2. **Docker Compose (khuyên dùng để cả nhóm đồng nhất)**  

Bảng chính:

- `users`
- `tables`
- `reservations`
- `reservation_logs`

---

## 📦 Công nghệ sử dụng

| Thành phần | Công nghệ |
|-----------|-----------|
| Backend | NestJS, TypeScript, TypeORM, PostgreSQL, JWT |
| Frontend | Vue 3, Vite, Pinia, Axios |
| DevOps | Docker Compose |
| Kiến trúc | REST API + SPA |

---

## 📚 Tài liệu đi kèm

- `docs/RUN_GUIDE.md` – Hướng dẫn chạy dự án  
- `docs/TEAM_TASKS.md` – Phân công công việc nhóm  
- `docs/API_REFERENCE.md` – Tài liệu API đầy đủ  
- `docs/SRS.md` – Đặc tả yêu cầu phần mềm (SRS)

---

## ▶ Cách chạy dự án

### 1️⃣ Chạy Database bằng Docker (khuyến nghị)

```bash
docker compose up -d
