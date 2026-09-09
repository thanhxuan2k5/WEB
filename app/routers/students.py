from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from typing import Optional, List
import urllib.parse
from app.database import get_db
from app import crud
from app.schemas import StudentCreate, StudentUpdate, StudentResponse, ImportResult, DashboardStats
from app.services import excel_service

router = APIRouter(prefix="/api/students", tags=["Students"])

@router.get("", response_model=dict)
def list_students(
    search: Optional[str] = Query(None, description="Tìm kiếm theo tên, mã, email, sđt"),
    major: Optional[str] = Query(None, description="Lọc theo chuyên ngành"),
    page: int = Query(1, ge=1, description="Số trang hiện tại"),
    limit: int = Query(10, ge=1, le=200, description="Số dòng trên mỗi trang"),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    students, total = crud.get_students(db, search=search, major=major, skip=skip, limit=limit)
    return {
        "items": [s.to_dict() for s in students],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total > 0 else 1
    }

@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)

@router.get("/majors", response_model=List[str])
def get_majors(db: Session = Depends(get_db)):
    return crud.get_distinct_majors(db)

@router.get("/template")
def download_template():
    """Tải file Excel mẫu để nhập sinh viên"""
    excel_stream = excel_service.generate_template_excel()
    filename = "Mau_Nhap_Sinh_Vien.xlsx"
    encoded_filename = urllib.parse.quote(filename)
    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
    )

@router.get("/export/excel")
def export_excel(
    search: Optional[str] = Query(None),
    major: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Xuất danh sách sinh viên ra file Excel"""
    students = crud.get_all_students_for_export(db, search=search, major=major)
    excel_stream = excel_service.export_students_to_excel(students)
    filename = "Danh_Sach_Sinh_Vien.xlsx"
    encoded_filename = urllib.parse.quote(filename)
    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
    )

@router.get("/export/csv")
def export_csv(
    search: Optional[str] = Query(None),
    major: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Xuất danh sách sinh viên ra file CSV"""
    students = crud.get_all_students_for_export(db, search=search, major=major)
    csv_bytes = excel_service.export_students_to_csv(students)
    filename = "Danh_Sach_Sinh_Vien.csv"
    encoded_filename = urllib.parse.quote(filename)
    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
    )

@router.post("/import", response_model=ImportResult)
async def import_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Tải file Excel (.xlsx/.xls) hoặc CSV để nhập dữ liệu sinh viên"""
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls") or file.filename.endswith(".csv")):
        raise HTTPException(
            status_code=400,
            detail="Định dạng file không hỗ trợ. Vui lòng tải lên file .xlsx, .xls hoặc .csv"
        )

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="File tải lên bị rỗng.")

    result = excel_service.parse_import_file(contents, file.filename.lower(), db)
    return result

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy sinh viên.")
    return student

@router.post("", response_model=StudentResponse, status_code=201)
def create_student(student_in: StudentCreate, db: Session = Depends(get_db)):
    existing = crud.get_student_by_code(db, student_in.student_code)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Mã sinh viên '{student_in.student_code}' đã tồn tại trong hệ thống."
        )
    return crud.create_student(db, student_in)

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, student_in: StudentUpdate, db: Session = Depends(get_db)):
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy sinh viên.")

    if student_in.student_code and student_in.student_code.strip() != student.student_code:
        existing = crud.get_student_by_code(db, student_in.student_code)
        if existing and existing.id != student_id:
            raise HTTPException(
                status_code=400,
                detail=f"Mã sinh viên '{student_in.student_code}' đã tồn tại."
            )

    updated = crud.update_student(db, student_id, student_in)
    return updated

@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    success = crud.delete_student(db, student_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy sinh viên.")
    return {"message": "Xóa sinh viên thành công."}
