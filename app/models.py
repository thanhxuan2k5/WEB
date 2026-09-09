from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_code = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), index=True, nullable=False)
    email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(String(20), nullable=True)  # Định dạng YYYY-MM-DD
    gender = Column(String(10), default="Nam")         # Nam, Nữ, Khác
    major = Column(String(100), index=True, nullable=False)  # Ngành học
    gpa = Column(Float, default=0.0)                   # Điểm trung bình (thang 4 hoặc 10)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "student_code": self.student_code,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "date_of_birth": self.date_of_birth,
            "gender": self.gender,
            "major": self.major,
            "gpa": self.gpa,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None,
        }
