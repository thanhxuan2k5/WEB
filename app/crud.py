from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List, Tuple
from app.models import Student
from app.schemas import StudentCreate, StudentUpdate

def get_student(db: Session, student_id: int) -> Optional[Student]:
    return db.query(Student).filter(Student.id == student_id).first()

def get_student_by_code(db: Session, student_code: str) -> Optional[Student]:
    return db.query(Student).filter(Student.student_code == student_code.strip()).first()

def get_students(
    db: Session,
    search: Optional[str] = None,
    major: Optional[str] = None,
    skip: int = 0,
    limit: int = 500
) -> Tuple[List[Student], int]:
    query = db.query(Student)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.student_code.ilike(search_term),
                Student.full_name.ilike(search_term),
                Student.email.ilike(search_term),
                Student.phone.ilike(search_term)
            )
        )

    if major and major.strip() and major != "Tất cả":
        query = query.filter(Student.major == major.strip())

    total = query.count()
    students = query.order_by(Student.id.desc()).offset(skip).limit(limit).all()
    return students, total

def get_all_students_for_export(
    db: Session,
    search: Optional[str] = None,
    major: Optional[str] = None
) -> List[Student]:
    query = db.query(Student)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.student_code.ilike(search_term),
                Student.full_name.ilike(search_term),
                Student.email.ilike(search_term),
                Student.phone.ilike(search_term)
            )
        )
    if major and major.strip() and major != "Tất cả":
        query = query.filter(Student.major == major.strip())

    return query.order_by(Student.student_code.asc()).all()

def create_student(db: Session, student: StudentCreate) -> Student:
    db_student = Student(
        student_code=student.student_code.strip(),
        full_name=student.full_name.strip(),
        email=student.email.strip() if student.email else None,
        phone=student.phone.strip() if student.phone else None,
        date_of_birth=student.date_of_birth,
        gender=student.gender or "Nam",
        major=student.major.strip(),
        gpa=student.gpa or 0.0
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student_data: StudentUpdate) -> Optional[Student]:
    db_student = get_student(db, student_id)
    if not db_student:
        return None

    update_dict = student_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None and isinstance(value, str):
            value = value.strip()
        setattr(db_student, key, value)

    db.commit()
    db.refresh(db_student)
    return db_student

def delete_student(db: Session, student_id: int) -> bool:
    db_student = get_student(db, student_id)
    if not db_student:
        return False
    db.delete(db_student)
    db.commit()
    return True

def get_distinct_majors(db: Session) -> List[str]:
    majors = db.query(Student.major).distinct().all()
    return sorted([m[0] for m in majors if m[0]])

def get_dashboard_stats(db: Session) -> dict:
    total = db.query(func.count(Student.id)).scalar() or 0
    if total == 0:
        return {
            "total_students": 0,
            "avg_gpa": 0.0,
            "highest_gpa": 0.0,
            "lowest_gpa": 0.0,
            "majors_count": 0
        }

    avg_gpa = db.query(func.avg(Student.gpa)).scalar() or 0.0
    highest_gpa = db.query(func.max(Student.gpa)).scalar() or 0.0
    lowest_gpa = db.query(func.min(Student.gpa)).scalar() or 0.0
    majors_count = db.query(func.count(func.distinct(Student.major))).scalar() or 0

    return {
        "total_students": total,
        "avg_gpa": round(float(avg_gpa), 2),
        "highest_gpa": round(float(highest_gpa), 2),
        "lowest_gpa": round(float(lowest_gpa), 2),
        "majors_count": majors_count
    }
