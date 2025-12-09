# RUN_GUIDE – Hướng dẫn chạy dự án Reservation System for Cafés

## 1. 🛠 YÊU CẦU MÔI TRƯỜNG

Tất cả thành viên phải dùng **giống nhau** để tránh lỗi khác máy:

- **Node.js:** v18+ (LTS khuyến nghị)
- **npm:** v9+
- **PostgreSQL:** v13+
  - (Khuyên dùng Docker để chạy DB đồng nhất)
- **Git** để làm việc theo branch

Cấu trúc dự án:

```
reservation-system/
├── backend/
├── frontend/
└── docs/
```

---

## 2. 🗄 CHUẨN BỊ DATABASE (POSTGRESQL)

### **Cách khuyên dùng: Docker Compose**

Tạo file tại thư mục gốc:

### `docker-compose.yml`

```yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: cafe_db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: reservation_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### **LỆNH KHỞI CHẠY DATABASE (dùng cho cả nhóm)**

```bash
docker compose up -d
```

Kiểm tra DB chạy:

```bash
docker ps
```

Dừng DB:

```bash
docker compose down
```

Xoá toàn bộ dữ liệu DB:

```bash
docker compose down -v
```

---

## 3. ⚙️ CẤU HÌNH BACKEND (NestJS + PostgreSQL)

### **Bước 1: Copy file môi trường**

```bash
cd backend
cp .env.example .env
```

### **Bước 2: Kiểm tra nội dung file `.env`**

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=reservation_db

JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=1d
```

### **Bước 3: Cài đặt dependency**

```bash
npm install
```

### **Bước 4: Chạy backend**

```bash
npm run start:dev
```

Backend chạy tại:  
👉 http://localhost:3000

---

## 4. 🎨 CẤU HÌNH FRONTEND (Vue 3 + Vite)

### **Bước 1: Copy file môi trường**

```bash
cd ../frontend
cp .env.example .env
```

### **Bước 2: Kiểm tra file `.env`**

```env
VITE_API_BASE_URL=http://localhost:3000
```

### **Bước 3: Cài dependency**

```bash
npm install
```

### **Bước 4: Chạy frontend**

```bash
npm run dev
```

Frontend chạy tại:  
👉 http://localhost:5173

---

## 5. 🚀 **LỆNH CHẠY DỰ ÁN – QUY TRÌNH DÀNH CHO CẢ NHÓM**

Mỗi thành viên khi muốn chạy dự án, **luôn chạy theo đúng thứ tự sau**:

---

### **🔷 Bước 1 — Chạy Database**

```bash
cd reservation-system
docker compose up -d
```

Kiểm tra:

```bash
docker ps
```

---

### **🔷 Bước 2 — Chạy Backend**

```bash
cd backend
npm install     # chỉ lần đầu, sau đó không cần nữa
npm run start:dev
```

---

### **🔷 Bước 3 — Chạy Frontend**

Mở terminal khác:

```bash
cd frontend
npm install     # chỉ lần đầu
npm run dev
```

---

### **🔷 Bước 4 — Truy cập hệ thống**

- Frontend: **http://localhost:5173**
- Backend API: **http://localhost:3000**

---

## 6. 🔁 QUY TRÌNH GIT FLOW CHUẨN (Cho nhóm 4 người)

### **Clone dự án lần đầu**

```bash
git clone <repo-url>
cd reservation-system
```

---

### **Tạo branch mới cho từng task**

```bash
git checkout -b feature/<ten-task>
```

Ví dụ:

```
feature/reservation-api
feature/admin-ui
feature/staff-dashboard
```

---

### **Commit code**

```bash
git add .
git commit -m "[backend] implement reservation create api"
```

---

### **Luôn đồng bộ với main trước khi push**

```bash
git pull origin main
```

Fix conflict → Commit lại.

---

### **Push lên GitHub**

```bash
git push origin feature/<ten-task>
```

---

### **Tạo Pull Request**  
Leader review → merge vào `main`.

---

## 7. ❗ LỖI THƯỜNG GẶP & CÁCH KHẮC PHỤC

### **❌ Lỗi không kết nối PostgreSQL**

```
ECONNREFUSED 127.0.0.1:5432
```

✔ DB chưa chạy → chạy:

```bash
docker compose up -d
```

---

### **❌ Sai user/password DB**

```
password authentication failed for user "postgres"
```

✔ Sửa `.env` backend cho khớp.

---

### **❌ Frontend không gọi API được**

- Kiểm tra file:

```env
VITE_API_BASE_URL=http://localhost:3000
```

- Sau khi chỉnh `.env`, **restart** lại `npm run dev`.

---

## 8. 🏁 KẾT LUẬN

Bộ hướng dẫn này đảm bảo:

- Tất cả thành viên chạy **giống nhau 100%**
- Không gặp lỗi môi trường, DB, port
- Đồng bộ khi làm việc nhóm
- Dễ hướng dẫn cho giảng viên khi demo

