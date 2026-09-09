from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class StudentBase(BaseModel):
    student_code: str = Field(..., min_length=2, max_length=50, description="Mã sinh viên")
    full_name: str = Field(..., min_length=2, max_length=100, description="Họ và tên")
    email: Optional[str] = Field(None, description="Email liên hệ")
    phone: Optional[str] = Field(None, max_length=20, description="Số điện thoại")
    date_of_birth: Optional[str] = Field(None, description="Ngày sinh YYYY-MM-DD")
    gender: Optional[str] = Field("Nam", description="Giới tính (Nam, Nữ, Khác)")
    major: str = Field(..., min_length=2, max_length=100, description="Chuyên ngành")
    gpa: Optional[float] = Field(0.0, ge=0.0, le=10.0, description="Điểm trung bình (0.0 - 10.0)")

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    student_code: Optional[str] = Field(None, min_length=2, max_length=50)
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    major: Optional[str] = None
    gpa: Optional[float] = Field(None, ge=0.0, le=10.0)

class StudentResponse(StudentBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ImportRowError(BaseModel):
    row: int
    student_code: Optional[str] = None
    error: str

class ImportResult(BaseModel):
    total_rows: int
    success_count: int
    error_count: int
    errors: List[ImportRowError] = []

class DashboardStats(BaseModel):
    total_students: int
    avg_gpa: float
    highest_gpa: float
    lowest_gpa: float
    majors_count: int
