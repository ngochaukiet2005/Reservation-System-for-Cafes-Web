# **YÊU CẦU CHỨC NĂNG (FR) VÀ PHI CHỨC NĂNG (NFR) – HỆ THỐNG ĐẶT BÀN QUÁN CAFÉ**

---

# ## **I. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS – FR)**  
(Phiên bản đầy đủ sau chỉnh sửa)

---

# ### **FR-1. Quản lý người dùng (User Management)**

---

## **FR-1.1 – Tài khoản Admin (tạo sẵn trong database)**
- Hệ thống phải có ít nhất **01 tài khoản Admin** được tạo sẵn trong cơ sở dữ liệu khi khởi chạy hệ thống (dữ liệu seed).
- Admin dùng để:
  - Đăng nhập lần đầu.
  - Tạo tài khoản nhân viên Staff.
  - Quản lý hệ thống.

---

## **FR-1.2 – Tạo tài khoản nhân viên Staff (do Admin tạo)**
- Nhân viên **không được tự đăng ký**.
- Chỉ Admin mới có quyền:
  - Tạo tài khoản Staff.
  - Chỉnh sửa thông tin Staff.
  - Khóa hoặc mở tài khoản Staff.
- Khi tạo Staff, Admin nhập: họ tên, email/username, mật khẩu.
- Staff được gán quyền: **role = STAFF**.

---

## **FR-1.3 – Đăng ký tài khoản Customer**
- Người dùng bên ngoài (Customer) có thể tự đăng ký.
- Thông tin gồm: họ tên, email, số điện thoại, mật khẩu.
- Email phải duy nhất.
- Sau khi đăng ký: **role = CUSTOMER**.

---

## **FR-1.4 – Đăng nhập**
- Tất cả 3 loại tài khoản (Admin, Staff, Customer) dùng chung màn hình login.
- Sau đăng nhập:
  - Admin → màn hình quản trị.
  - Staff → màn xử lý đặt bàn.
  - Customer → màn đặt bàn & xem lịch sử.

---

## **FR-1.5 – Quản lý phiên làm việc**
- Hệ thống lưu session người đang đăng nhập.
- Phiên kết thúc khi logout hoặc tắt ứng dụng.

---

---

# ### **FR-2. Quản lý bàn (Table Management)**

---

## **FR-2.1 – Tạo và chỉnh sửa bàn**
- Admin có quyền:
  - Thêm bàn mới.
  - Chỉnh sửa mã bàn, sức chứa, khu vực.

---

## **FR-2.2 – Trạng thái bàn**
Các trạng thái:
- **AVAILABLE** – trống  
- **RESERVED** – đã được đặt  
- **OCCUPIED** – đang có khách  
- **DISABLED** – tạm khóa  

---

## **FR-2.3 – Khóa / mở khóa bàn**
- Admin có thể đặt bàn sang trạng thái DISABLED hoặc mở lại.

---

## **FR-2.4 – Hiển thị sơ đồ bàn**
- Tất cả bàn hiển thị trên giao diện với màu tương ứng trạng thái.

---

---

# ### **FR-3. Tạo đặt bàn (Reservation Creation)**

---

## **FR-3.1 – Customer tự đặt bàn**
Customer chọn:
- Ngày  
- Giờ  
- Số người  
- Bàn (hoặc để hệ thống gợi ý)

Hệ thống phải:
- Kiểm tra bàn trống.
- **Không cho đặt nếu trùng giờ với đặt bàn khác ở trạng thái:**  
  **PENDING, CONFIRMED, OCCUPIED.**
- Nếu hợp lệ → tạo đặt bàn mới với **PENDING**.

---

## **FR-3.2 – Staff tạo đặt bàn thay khách**
- Staff nhập thông tin tương tự Customer.
- Staff có thể đặt trạng thái ban đầu: **PENDING** hoặc **CONFIRMED**.

---

---

# ### **FR-4. Xử lý đặt bàn (Reservation Processing)**

---

## **FR-4.1 – Xác nhận đặt bàn**
- Staff có thể duyệt các đặt bàn PENDING.
- Nếu hợp lệ:  
  - Reservation → **CONFIRMED**  
  - Table → **RESERVED**

---

## **FR-4.2 – Từ chối đặt bàn**
- Staff phải nhập lý do.
- Reservation → **CANCELLED**

---

## **FR-4.3 – Customer xem trạng thái các đặt bàn của họ**
Customer có thể xem toàn bộ đặt bàn đã tạo, với trạng thái:

- **PENDING**  
- **CONFIRMED**  
- **CANCELLED**  
- **NO_SHOW**  
- **COMPLETED**  
- **OCCUPIED**

→ Đây là màn hình **“Đặt bàn của tôi / My Reservations”**.

---

---

# ### **FR-5. Quản lý thời gian giữ bàn (Hold Time)**

---

## **FR-5.1 – Cấu hình giữ bàn**
- Admin thiết lập thời gian giữ bàn (10–20 phút).

---

## **FR-5.2 – Hết thời gian giữ bàn**
- Staff có thể:
  - Đánh dấu **NO_SHOW**
  - Hoặc **CANCELLED**

---

## **FR-5.3 – Giải phóng bàn**
- Khi CANCELLED hoặc NO_SHOW → bàn → AVAILABLE.

---

---

# ### **FR-6. Check-in / Check-out**

---

## **FR-6.1 – Check-in**
Staff check-in khách khi đến:
- Reservation → **OCCUPIED**
- Table → **OCCUPIED**

---

## **FR-6.2 – Check-out**
- Khi khách rời:
  - Reservation → **COMPLETED**
  - Table → **AVAILABLE**

Customer không thể tự check-in hoặc check-out.

---

---

# ### **FR-7. Hủy đặt bàn**

---

## **FR-7.1 – Customer hủy đặt bàn**
Điều kiện:
- Trạng thái là **PENDING** hoặc **CONFIRMED**
- Chưa vượt quá thời gian giữ bàn

---

## **FR-7.2 – Staff hủy đặt bàn**
- Staff có thể hủy thay khách hoặc khi khách không đến.

---

---

# ### **FR-8. Tìm kiếm và lọc**

---

## **FR-8.1 – Staff / Admin**
Có thể tìm theo:
- Tên khách  
- Số điện thoại  
- Mã bàn  
- Ngày, giờ  
- Trạng thái  

---

## **FR-8.2 – Customer**
Customer chỉ được xem và lọc **đặt bàn của chính họ**.

---

---

# ### **FR-9. Lịch sử & Báo cáo**

---

## **FR-9.1 – Lưu lịch sử hành động**
Ghi lại:
- Tạo đặt bàn  
- Duyệt / từ chối  
- Hủy  
- Check-in / Check-out  
- NO_SHOW  

---

## **FR-9.2 – Customer xem lịch sử của họ**
- Hiển thị toàn bộ lịch sử đặt bàn.

---

## **FR-9.3 – Staff / Admin xem lịch sử toàn hệ thống**
- Lọc theo ngày, trạng thái, nhân viên xử lý.

---

## **FR-9.4 – Xuất báo cáo (tùy chọn)**
- Xuất CSV thống kê số lượng đặt, no-show, hủy…

---

---

# ## **II. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS – NFR)**

---

# ### **NFR-1. Usability (Tính dễ sử dụng)**
- UI trực quan, phân quyền rõ ràng.
- Customer UI đơn giản và dễ hiểu.

---

# ### **NFR-2. Performance (Hiệu năng)**
- Tải danh sách bàn < 2 giây.  
- CRUD < 1 giây.  
- Tìm kiếm/lọc phản hồi tức thì.

---

# ### **NFR-3. Security (Bảo mật)**
- Mật khẩu phải được hash.  
- Customer chỉ truy cập dữ liệu của họ.  
- Staff/Admin phải qua kiểm tra quyền.

---

# ### **NFR-4. Data Integrity (Toàn vẹn dữ liệu)**
- Không cho phép đặt chồng lịch bàn.  
- Không cho check-in/check-out sai luồng.  
- Customer không thể hủy sau thời gian cho phép.

---

# ### **NFR-5. Reliability (Độ tin cậy)**
- Ứng dụng không được crash trong quá trình sử dụng.  
- Xử lý lỗi DB bằng thông báo rõ ràng.

---

# ### **NFR-6. Maintainability (Bảo trì)**
- Áp dụng kiến trúc MVC rõ ràng.  
- Dễ mở rộng thêm module mới.

---

# ### **NFR-7. Compatibility (Tương thích)**
- Chạy tốt trên Windows 10/11.  
- Java 11+, JavaFX 17+.  
- Hỗ trợ MySQL hoặc SQLite.

---

# ### **NFR-8. Scalability (Khả năng mở rộng)**
- Hỗ trợ nhiều chi nhánh.  
- Có thể mở rộng sang web/mobile.

---

# ### **NFR-9. Backup & Recovery**
- Admin có thể backup hệ thống.  
- Cho phép phục hồi dữ liệu khi gặp sự cố.

---

