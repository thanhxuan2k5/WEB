import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routers import students
from app.models import Student

# Khởi tạo bảng cơ sở dữ liệu và dữ liệu mẫu nếu chưa có
def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Nếu chưa có sinh viên nào, chèn 5 sinh viên mẫu để trải nghiệm ngay
        if db.query(Student).count() == 0:
            sample_students = [
                Student(
                    student_code="SV202401",
                    full_name="Nguyễn Văn An",
                    email="an.nguyen@university.edu.vn",
                    phone="0912345678",
                    date_of_birth="2003-05-15",
                    gender="Nam",
                    major="Công nghệ thông tin",
                    gpa=8.65
                ),
                Student(
                    student_code="SV202402",
                    full_name="Trần Thị Mai Hương",
                    email="huong.tran@university.edu.vn",
                    phone="0987654321",
                    date_of_birth="2003-09-22",
                    gender="Nữ",
                    major="Khoa học dữ liệu",
                    gpa=9.10
                ),
                Student(
                    student_code="SV202403",
                    full_name="Lê Hoàng Long",
                    email="long.le@university.edu.vn",
                    phone="0905123456",
                    date_of_birth="2002-12-10",
                    gender="Nam",
                    major="Hệ thống thông tin",
                    gpa=7.80
                ),
                Student(
                    student_code="SV202404",
                    full_name="Phạm Minh Thư",
                    email="thu.pham@university.edu.vn",
                    phone="0934567890",
                    date_of_birth="2003-03-30",
                    gender="Nữ",
                    major="Kỹ thuật phần mềm",
                    gpa=8.35
                ),
                Student(
                    student_code="SV202405",
                    full_name="Võ Đức Duy",
                    email="duy.vo@university.edu.vn",
                    phone="0978112233",
                    date_of_birth="2003-07-18",
                    gender="Nam",
                    major="An toàn thông tin",
                    gpa=6.90
                ),
            ]
            db.add_all(sample_students)
            db.commit()
            print(">>> Đã khởi tạo cơ sở dữ liệu và 5 sinh viên mẫu ban đầu.")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="Hệ Thống Quản Lý Sinh Viên",
    description="Ứng dụng CRUD và Nhập/Xuất Excel/CSV sử dụng FastAPI và Python 3.12",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đường dẫn thư mục
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

# Mount Static Files & Templates
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

# Gắn Routers
app.include_router(students.router)

# Route trang chủ UI
@app.get("/", summary="Trang chủ giao diện Quản lý Sinh viên")
def home(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8090, reload=True)

