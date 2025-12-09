
---

## 📄 `docs/TEAM_TASKS.md`

```md
# TEAM_TASKS – Phân công công việc & file phụ trách

## 1. Tổng quan nhóm

Nhóm gồm 4 người:

- **Leader** – kiến trúc + full-stack
- **Member 1** – Backend (Reservation & Table & Log)
- **Member 2** – Frontend (Customer & Staff)
- **Member 3** – Frontend (Admin & UI chung)

---

## 2. Leader – Kiến trúc & Full-stack

### Nhiệm vụ chính

- Thiết kế kiến trúc toàn dự án (backend + frontend)
- Thiết kế database PostgreSQL (bảng, quan hệ)
- Setup và cấu hình:
  - `backend` (NestJS, TypeORM, kết nối PostgreSQL)
  - `frontend` (Vue 3 + Vite)
- Phát triển module:
  - Auth (login, register nếu cần, JWT)
  - Users (role: ADMIN, STAFF, CUSTOMER)
- Viết & duy trì tài liệu:
  - `docs/RUN_GUIDE.md`
  - `docs/API_REFERENCE.md`
  - `docs/TEAM_TASKS.md`
- Review code & merge Pull Request

### File/Thư mục chính phụ trách

- `backend/src/app.module.ts`
- `backend/src/main.ts`
- `backend/src/config/database.config.ts`
- `backend/src/auth/*`
- `backend/src/users/*`
- `backend/.env.example`
- `docs/*.md` (tất cả tài liệu)

---

## 3. Member 1 – Backend (Reservation & Table & Log)

### Nhiệm vụ chính

- Cài đặt nghiệp vụ core:
  - Đặt bàn, duyệt, hủy, giữ bàn, tránh trùng giờ/bàn
- Xây các module:

1. **Tables Module** – quản lý bàn

   - API:
     - Tạo bàn (Admin)
     - Sửa/xóa bàn
     - Lấy danh sách bàn, filter theo trạng thái
   - Quản lý thuộc tính:
     - name (A1, A2…)
     - capacity
     - status (`AVAILABLE`, `UNAVAILABLE`)

2. **Reservations Module** – quản lý đặt bàn

   - API:
     - Khách tạo đặt bàn
     - Khách xem lịch sử
     - Staff xem danh sách `PENDING`
     - Staff duyệt/hủy
   - Logic:
     - Kiểm tra trùng bàn + trùng thời gian
     - Quản lý status: `PENDING`, `CONFIRMED`, `CANCELED`, `EXPIRED`
     - Giữ bàn (`holdUntil`)

3. **Reservation Logs Module** – lịch sử hành động

   - Ghi lại các event: `CREATE`, `CONFIRM`, `CANCEL`, `EXPIRE`
   - Cho phép Admin/Staff xem log theo reservation

### File/Thư mục chính phụ trách

- `backend/src/tables/tables.module.ts`
- `backend/src/tables/tables.controller.ts`
- `backend/src/tables/tables.service.ts`
- `backend/src/tables/dto/*`
- `backend/src/tables/entities/table.entity.ts`

- `backend/src/reservations/reservations.module.ts`
- `backend/src/reservations/reservations.controller.ts`
- `backend/src/reservations/reservations.service.ts`
- `backend/src/reservations/dto/*`
- `backend/src/reservations/entities/reservation.entity.ts`

- `backend/src/reservation-logs/reservation-logs.module.ts`
- `backend/src/reservation-logs/reservation-logs.service.ts`
- `backend/src/reservation-logs/entities/reservation-log.entity.ts`

---

## 4. Member 2 – Frontend (Customer & Staff)

### Nhiệm vụ chính

- Xây giao diện cho:
  - **Customer**: đặt bàn, xem trạng thái, xem lịch sử
  - **Staff**: xem các yêu cầu pending, duyệt/từ chối
- Gọi API tương ứng từ backend
- Xử lý UX cơ bản: loading, error, toast thông báo

### File/Thư mục chính phụ trách

- Views:

  - `frontend/src/views/customer/CustomerReservationView.vue`
  - `frontend/src/views/customer/CustomerHistoryView.vue`
  - `frontend/src/views/staff/StaffDashboardView.vue`

- API client:

  - `frontend/src/api/reservationApi.ts`
  - `frontend/src/api/tableApi.ts`

- Store:

  - `frontend/src/store/reservationStore.ts` (nếu nhóm dùng Pinia)

- Component dùng chung với Member 3:

  - `frontend/src/components/reservations/ReservationForm.vue`
  - `frontend/src/components/reservations/ReservationList.vue`

---

## 5. Member 3 – Frontend (Admin & UI chung)

### Nhiệm vụ chính

- Thiết kế layout tổng thể & cấu trúc UI
- Xây giao diện **Admin**:
  - Thống kê (dashboard)
  - Quản lý bàn
  - Quản lý nhân viên (staff)
- Tạo các component UI tái sử dụng

### File/Thư mục chính phụ trách

- Layout:

  - `frontend/src/components/layout/AppLayout.vue`
  - `frontend/src/components/layout/Sidebar.vue`

- Component UI chung:

  - `frontend/src/components/common/AppButton.vue`
  - `frontend/src/components/common/AppTable.vue`
  - `frontend/src/components/common/StatusBadge.vue`

- Views Admin:

  - `frontend/src/views/admin/AdminDashboardView.vue`
  - `frontend/src/views/admin/ManageTablesView.vue`
  - `frontend/src/views/admin/ManageStaffView.vue`

- Phối hợp với Leader:

  - `frontend/src/router/index.ts` (định tuyến theo role)
  - `frontend/src/main.ts` (register store, router, layout)

---

## 6. Quy ước khi sửa file của người khác

- Nếu buộc phải sửa file thuộc phạm vi người khác:
  - Nhắn qua nhóm trước (Messenger/Zalo/Teams…)
  - Ghi rõ trong Pull Request:  
    > “Sửa `reservations.service.ts` để fix bug X”
- Không đổi tên thư mục/module lớn mà không thông báo cả nhóm.
- Khi merge conflict, ưu tiên:
  - Trao đổi với người phụ trách module trước khi tự ý xoá code.
