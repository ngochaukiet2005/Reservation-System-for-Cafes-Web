# SRS – Tóm Tắt Công Nghệ & Phân Công Nhiệm Vụ Dự Án Reservation System for Cafés

## 1. Giới thiệu
Tài liệu này mô tả tóm tắt về **ngôn ngữ – framework backend, frontend, mô hình kiến trúc**, và **nhiệm vụ của từng thành viên trong nhóm 4 người (1 leader)** cho dự án hệ thống đặt bàn dành cho quán cà phê.

---

## 2. Công nghệ sử dụng

### 2.1 Backend
- **Ngôn ngữ:** TypeScript (hoặc JavaScript)
- **Framework chính:** **NestJS** (Node.js)
- **ORM:** TypeORM hoặc Prisma
- **Database:** PostgreSQL
- **Mô hình kiến trúc:** MVC dạng module của NestJS
  - Controller = nhận request
  - Service = xử lý nghiệp vụ
  - Entity/Model = ánh xạ dữ liệu PostgreSQL
  - Module = gom nhóm logic theo domain

### 2.2 Frontend
- **Ngôn ngữ:** TypeScript (hoặc JavaScript)
- **Framework:** **Vue 3 + Vite**
- **State Management:** Pinia (tùy chọn)
- **Router:** Vue Router
- **Kiểu hoạt động:** SPA (Single Page Application), giao tiếp backend qua REST API

---

## 3. Kiến trúc tổng thể hệ thống

### 3.1 Backend (NestJS – MVC Module Based)
- Modules chính:
  - Auth Module
  - User Module
  - Table Module
  - Reservation Module
  - ReservationLog Module
- Backend hoạt động như REST API, trả JSON cho frontend.

### 3.2 Frontend (Vue 3 – SPA)
- Tách thành các nhóm màn hình theo vai trò:
  - Customer (khách): đặt bàn, xem trạng thái, lịch sử
  - Staff (nhân viên): xem yêu cầu pending, duyệt/từ chối
  - Admin: quản lý bàn, quản lý nhân viên, xem dashboard thống kê

---

## 4. Phân chia công việc cho nhóm 4 người

### 4.1 **Leader – Kiến trúc & Full-stack**
**Nhiệm vụ:**
- Thiết kế kiến trúc toàn dự án (frontend + backend)
- Thiết kế database PostgreSQL, ánh xạ entity
- Setup NestJS + Vue 3 + Vite + PostgreSQL
- Code module Auth + phân quyền (role: admin, staff, customer)
- Tạo base API, middleware bảo vệ route
- Review code & quản lý tiến độ nhóm

---

### 4.2 **Member 1 – Backend chính (Reservation & Table)**
**Nhiệm vụ:**
- Phát triển Reservation Module:
  - API đặt bàn (create)
  - API xem lịch sử đặt bàn
  - API staff duyệt/từ chối/hủy
  - Logic xử lý trùng bàn, giữ bàn (hold_until)
- Phát triển Table Module:
  - CRUD bàn (Admin)
  - Lấy danh sách bàn theo trạng thái
- Xử lý nghiệp vụ core: chống đặt trùng bàn, quản lý trạng thái theo thời gian

---

### 4.3 **Member 2 – Frontend (Customer & Staff UI)**
**Nhiệm vụ:**
- Xây dựng giao diện Customer:
  - Form đặt bàn
  - Lịch sử đặt bàn
  - Theo dõi trạng thái (Pending, Confirmed, Canceled)
- Xây dựng giao diện Staff:
  - Dashboard yêu cầu pending
  - Duyệt/từ chối đặt bàn
  - Hiển thị trạng thái bàn
- Gọi API: reservationApi, tableApi, authApi
- Xử lý UX: loading, toast, validate form

---

### 4.4 **Member 3 – Frontend (Admin + UI/UX chung)**
**Nhiệm vụ:**
- Xây dựng giao diện Admin:
  - Quản lý nhân viên (tạo staff)
  - Quản lý bàn (thêm/sửa/xóa)
  - Dashboard thống kê đặt bàn
- Thiết kế layout chung toàn hệ thống:
  - Header, Sidebar, Role-based navigation
- Xây dựng các component tái sử dụng: TableList, Modal, Button, Badge,...
- Hỗ trợ test giao diện

---

## 5. Kết luận
Mô hình được thiết kế để tối ưu cho nhóm 4 người, dễ chia module, dễ phát triển – mở rộng, phù hợp kiến trúc hiện đại.  
Stack công nghệ: **NestJS + PostgreSQL + Vue 3** là lựa chọn tối ưu cho dự án web quản lý đặt bàn mang tính thực tế và có thể triển khai thật.

