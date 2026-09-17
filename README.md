# ĐỀ TÀI 14: NỀN TẢNG ĐẶT VÉ SỰ KIỆN VÀ QUẢN LÝ RẠP CHIẾU PHIM

* **Học phần:** Thiết kế web nâng cao (CSE702051) — 02 tín chỉ
* **Khoa:** Hệ thống thông tin | **Trường:** Công nghệ thông tin — Đại học Phenikaa
* **Giảng viên phụ trách:** TS. Nguyễn Văn Tánh — `tanh.nguyenvan@phenikaa-uni.edu.vn`
* **Lớp học phần:** `[MÃ_LỚP_HỌC_PHẦN]`
* **Nhóm thực hiện:** `[SỐ_THỨ_TỰ_NHÓM]`
* **Thành viên:**
  1. `[HỌ_TÊN_SV1]` - MSSV: `[MSSV_1]` (Vai trò: V1 - Trưởng nhóm & Kiến trúc, V3 - Nghiệp vụ)
  2. `[HỌ_TÊN_SV2]` - MSSV: `[MSSV_2]` (Vai trò: V2 - CSDL, V4 - Bảo mật & Test, V5 - Triển khai & Báo cáo)

---

## 1. Bảng phiên bản chuẩn của nhóm (Giai đoạn 0)

| Thành phần | Công nghệ lựa chọn | Phiên bản chuẩn |
|---|---|---|
| Môi trường chạy (Runtime) | Node.js (LTS) | 20.17.x / 20.x |
| Trình quản lý gói | npm | 10.x |
| Khung phát triển Backend | Express.js | 4.21.x |
| Hệ quản trị CSDL | PostgreSQL (Neon Cloud Serverless) | 16.x |
| Quản lý phiên bản | Git | 2.40+ |
| Nền tảng triển khai trực tuyến | Render Cloud Web Service | Node Environment |

---

## 2. Kiến trúc hệ thống
Hệ thống tuân thủ nghiêm ngặt **kiến trúc phân tầng (3-tier architecture)**:
1. **Tầng Trình diễn & Điều khiển (Controller / Router)**: Nhận HTTP Request, kiểm tra định dạng đầu vào (validation), gọi Service và trả về JSON chuẩn RESTful. Không chứa truy vấn SQL.
2. **Tầng Nghiệp vụ (Service)**: Xử lý quy tắc nghiệp vụ, kiểm tra quyền trên đối tượng (chống IDOR), điều phối giao dịch (Transaction), hiện thực thuật toán T1 (Giữ chỗ 10 phút & tự giải phóng).
3. **Tầng Truy cập dữ liệu (Repository / DAO)**: Thực thi truy vấn tham số hóa (Parameterized queries qua `pg` pool), tuyệt đối không ghép chuỗi SQL.

---

## 3. Biến môi trường (.env)
Sao chép tệp mẫu trước khi chạy:
```bash
cp .env.example .env
# hoặc trên Windows PowerShell:
Copy-Item .env.example .env
```

Danh mục biến môi trường:
* `PORT`: Cổng máy chủ (mặc định: `8080`).
* `NODE_ENV`: Môi trường (`development` hoặc `production`).
* `DATABASE_URL`: Chuỗi kết nối PostgreSQL (Neon).
* `SESSION_SECRET`: Khóa ký phiên bí mật.
* `JWT_SECRET`: Khóa ký JWT token.

---

## 4. Hướng dẫn cài đặt và chạy tại máy cục bộ (≤ 5 phút)

### 4.1. Chạy trực tiếp bằng Node.js:
1. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
2. Khởi chạy máy chủ:
   ```bash
   npm start
   ```
   Hoặc chế độ tự tải lại khi sửa mã (Development):
   ```bash
   npm run dev
   ```
3. Mở trình duyệt truy cập:
   * Trang chủ: `http://localhost:8080`
   * Kiểm tra API: `http://localhost:8080/api/v1/health`

### 4.2. Chạy qua Docker Compose (Tùy chọn):
```bash
docker compose up -d --build
```

---

## 5. Triển khai trực tuyến (Môi trường Production)
* **Địa chỉ URL trực tuyến (HTTPS):** `[DÁN_URL_RENDER_CỦA_NHÓM_VÀO_ĐÂY]` (Ví dụ: `https://cse702051-dt14-cinema.onrender.com`)
* **Điểm cuối Health check:** `https://[URL_RENDER]/api/v1/health`

---

## 6. Danh mục tài khoản kiểm thử (Sẽ cập nhật ở Mốc 2/3)
*Tất cả tài khoản sử dụng dữ liệu giả lập phục vụ mục đích học tập.*
