# Hệ Thống Quản Lý Sinh Viên (FastAPI + Python 3.12 + Anaconda)

Ứng dụng web quản lý sinh viên hiện đại với đầy đủ chức năng **Thêm - Sửa - Xóa (CRUD)** và **Nhập / Xuất dữ liệu từ file Excel (.xlsx) & CSV (.csv)**.

---

## 🚀 Các Tính Năng Nổi Bật

1. **Quản Lý Sinh Viên (CRUD)**:
   - Thêm sinh viên mới với validation (kiểm tra trùng mã sinh viên, email, số điện thoại, điểm hợp lệ).
   - Chỉnh sửa thông tin sinh viên nhanh chóng qua modal.
   - Xóa sinh viên kèm hộp thoại xác nhận an toàn (SweetAlert2).
   - Tìm kiếm thời gian thực (realtime debounce search) theo Mã SV, Họ tên, Email, Số điện thoại.
   - Bộ lọc theo Chuyên ngành và phân trang linh hoạt (10, 25, 50, 100 dòng/trang).

2. **Nhập & Xuất Dữ Liệu (Import / Export)**:
   - **Tải file mẫu**: Tải file Excel mẫu (`Mau_Nhap_Sinh_Vien.xlsx`) đã được định dạng chuẩn.
   - **Nhập dữ liệu**: Hỗ trợ kéo thả hoặc chọn file `.xlsx`, `.xls`, `.csv`. Tự động kiểm tra tính hợp lệ từng dòng, báo cáo chi tiết các dòng bị lỗi (nếu có).
   - **Xuất Excel (.xlsx)**: Xuất file Excel định dạng chuyên nghiệp với header màu, kẻ khung bảng, tự căn chỉnh độ rộng cột.
   - **Xuất CSV (.csv)**: Xuất file CSV hỗ trợ chuẩn UTF-8 có BOM (mở trực tiếp bằng Excel trên Windows không bị lỗi font tiếng Việt).

3. **Giao Diện Hiện Đại & Thống Kê**:
   - Dashboard thống kê nhanh: Tổng số sinh viên, Điểm GPA trung bình, Điểm cao nhất, Điểm thấp nhất, Số chuyên ngành.
   - Giao diện phản hồi nhanh qua Fetch API (không cần tải lại trang).
   - Tích hợp tài liệu API tương tác tự động qua Swagger UI (`/docs`).

---

## 🛠 Hướng Dẫn Cài Đặt và Chạy Dự Án Bằng Anaconda

### Cách 1: Tạo môi trường ảo từng bước qua lệnh Conda (Khuyên Dùng)

**Bước 1: Mở Anaconda Prompt**
- Nhấn phím `Windows`, gõ tìm kiếm **Anaconda Prompt** (hoặc mở terminal bất kỳ có lệnh `conda`).

**Bước 2: Tạo môi trường ảo với Python 3.12**
```bash
conda create -n student_app python=3.12 -y
```

**Bước 3: Kích hoạt môi trường ảo**
```bash
conda activate student_app
```

**Bước 4: Di chuyển vào thư mục dự án**
```bash
cd /d d:\WEB
```

**Bước 5: Cài đặt các thư viện cần thiết**
```bash
pip install -r requirements.txt
```

**Bước 6: Khởi chạy máy chủ FastAPI**
```bash
uvicorn main:app --reload --port 8000
```
Hoặc:
```bash
python main.py
```

---

### Cách 2: Tạo môi trường ảo trực tiếp từ file `environment.yml`

```bash
# 1. Mở Anaconda Prompt và di chuyển vào thư mục d:\WEB
cd /d d:\WEB

# 2. Tạo môi trường từ file cấu hình
conda env create -f environment.yml

# 3. Kích hoạt môi trường
conda activate student_app

# 4. Chạy ứng dụng
uvicorn main:app --reload --port 8000
```

---

## 🌐 Truy Cập Ứng Dụng

Sau khi máy chủ khởi chạy thành công:
- **Giao diện Web Quản lý**: [http://localhost:8000](http://localhost:8000)
- **Tài liệu API Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Tài liệu API ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📂 Cấu Trúc Dự Án

```
d:/WEB/
├── app/
│   ├── __init__.py
│   ├── database.py           # Kết nối cơ sở dữ liệu SQLite & Session
│   ├── models.py             # SQLAlchemy Model: Student
│   ├── schemas.py            # Pydantic Schemas (Validation dữ liệu)
│   ├── crud.py               # Thao tác cơ sở dữ liệu (CRUD, lọc, phân trang)
│   ├── routers/
│   │   ├── __init__.py
│   │   └── students.py       # API Endpoints (/api/students)
│   └── services/
│       ├── __init__.py
│       └── excel_service.py  # Xử lý nhập/xuất Excel (.xlsx) và CSV (.csv)
├── static/
│   ├── css/
│   │   └── style.css         # CSS tùy biến giao diện
│   └── js/
│       └── app.js            # JavaScript frontend (AJAX, DOM, SweetAlert2)
├── templates/
│   └── index.html            # Giao diện chính (Dashboard, Bảng, Modals)
├── main.py                   # Điểm khởi động ứng dụng FastAPI
├── requirements.txt          # Danh sách thư viện Python
├── environment.yml           # Cấu hình Conda Environment
└── README.md                 # Tài liệu hướng dẫn sử dụng
```
