/**
 * Hệ thống Quản lý Sinh viên - Frontend Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Trạng thái ứng dụng
    let state = {
        page: 1,
        limit: 10,
        search: '',
        major: '',
        selectedFile: null
    };

    // Modal Instances Bootstrap
    const modalAdd = new bootstrap.Modal(document.getElementById('modalAddStudent'));
    const modalEdit = new bootstrap.Modal(document.getElementById('modalEditStudent'));
    const modalImport = new bootstrap.Modal(document.getElementById('modalImport'));

    // DOM Elements
    const studentTableBody = document.getElementById('student-table-body');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const filterMajor = document.getElementById('filter-major');
    const pageSizeSelect = document.getElementById('page-size');
    const paginationNav = document.getElementById('pagination-nav');
    const paginationInfo = document.getElementById('pagination-info');

    // Thống kê Elements
    const statTotal = document.getElementById('stat-total');
    const statAvg = document.getElementById('stat-avg');
    const statHighest = document.getElementById('stat-highest');
    const statLowest = document.getElementById('stat-lowest');
    const statMajors = document.getElementById('stat-majors');

    // Nút xuất file
    const btnExportExcel = document.getElementById('btn-export-excel');
    const btnExportCsv = document.getElementById('btn-export-csv');

    // Form Elements
    const formAdd = document.getElementById('form-add-student');
    const formEdit = document.getElementById('form-edit-student');

    // Dropzone Elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const selectedFileName = document.getElementById('selected-file-name');
    const btnSubmitImport = document.getElementById('btn-submit-import');
    const importProgress = document.getElementById('import-progress');
    const importResultContainer = document.getElementById('import-result-container');
    const importResultSummary = document.getElementById('import-result-summary');
    const importErrorTableContainer = document.getElementById('import-error-table-container');
    const importErrorBody = document.getElementById('import-error-body');

    // --- TIỆN ÍCH THÔNG BÁO SWEETALERT2 ---
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    function showToast(icon, title) {
        Toast.fire({ icon, title });
    }

    // --- TẢI THỐNG KÊ DASHBOARD ---
    async function loadStats() {
        try {
            const res = await fetch('/api/students/stats');
            if (!res.ok) throw new Error();
            const data = await res.json();
            statTotal.textContent = data.total_students.toLocaleString();
            statAvg.textContent = data.avg_gpa.toFixed(2);
            statHighest.textContent = data.highest_gpa.toFixed(2);
            statLowest.textContent = data.lowest_gpa.toFixed(2);
            statMajors.textContent = data.majors_count;
        } catch (e) {
            console.error("Lỗi khi tải thống kê:", e);
        }
    }

    // --- TẢI DANH SÁCH CHUYÊN NGÀNH VÀO DROPDOWN LỌC ---
    async function loadMajors() {
        try {
            const res = await fetch('/api/students/majors');
            if (!res.ok) throw new Error();
            const majors = await res.json();
            const currentSelected = filterMajor.value;

            filterMajor.innerHTML = '<option value="">Tất cả chuyên ngành</option>';
            majors.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m;
                if (m === currentSelected) opt.selected = true;
                filterMajor.appendChild(opt);
            });
        } catch (e) {
            console.error("Lỗi khi tải danh sách ngành:", e);
        }
    }

    // --- TẢI DANH SÁCH SINH VIÊN ---
    async function loadStudents() {
        loadingState.classList.remove('d-none');
        emptyState.classList.add('d-none');
        studentTableBody.innerHTML = '';

        const params = new URLSearchParams({
            page: state.page,
            limit: state.limit
        });
        if (state.search) params.append('search', state.search);
        if (state.major) params.append('major', state.major);

        try {
            const res = await fetch(`/api/students?${params.toString()}`);
            if (!res.ok) throw new Error("Không thể tải danh sách sinh viên");
            const data = await res.json();

            loadingState.classList.add('d-none');

            if (data.total === 0) {
                emptyState.classList.remove('d-none');
                paginationInfo.textContent = 'Đang hiển thị 0 trên 0 sinh viên';
                paginationNav.innerHTML = '';
                return;
            }

            renderTable(data.items, (state.page - 1) * state.limit);
            renderPagination(data.page, data.total_pages, data.total);
        } catch (e) {
            loadingState.classList.add('d-none');
            showToast('error', 'Có lỗi xảy ra khi tải dữ liệu!');
        }
    }

    // --- RENDER BẢNG DỮ LIỆU ---
    function renderTable(students, offset) {
        studentTableBody.innerHTML = '';

        students.forEach((s, idx) => {
            const tr = document.createElement('tr');

            // Định dạng GPA và Badge
            let gpaBadgeClass = 'badge-poor';
            let gpaLevel = 'Yếu';
            const gpa = s.gpa || 0;
            if (gpa >= 8.5) {
                gpaBadgeClass = 'badge-excellent';
                gpaLevel = 'Xuất sắc';
            } else if (gpa >= 8.0) {
                gpaBadgeClass = 'badge-excellent';
                gpaLevel = 'Giỏi';
            } else if (gpa >= 6.5) {
                gpaBadgeClass = 'badge-good';
                gpaLevel = 'Khá';
            } else if (gpa >= 5.0) {
                gpaBadgeClass = 'badge-average';
                gpaLevel = 'Trung bình';
            }

            // Giới tính badge
            const genderBadge = s.gender === 'Nữ'
                ? '<span class="badge bg-danger-subtle text-danger"><i class="fa-solid fa-venus me-1"></i>Nữ</span>'
                : (s.gender === 'Nam'
                    ? '<span class="badge bg-primary-subtle text-primary"><i class="fa-solid fa-mars me-1"></i>Nam</span>'
                    : '<span class="badge bg-secondary-subtle text-secondary">Khác</span>');

            tr.innerHTML = `
                <td class="text-center text-muted">${offset + idx + 1}</td>
                <td><span class="badge bg-light text-dark border px-2 py-1 font-monospace fw-bold">${escapeHtml(s.student_code)}</span></td>
                <td>
                    <div class="fw-semibold text-dark">${escapeHtml(s.full_name)}</div>
                </td>
                <td>${genderBadge}</td>
                <td><small class="text-muted"><i class="fa-regular fa-calendar me-1"></i>${s.date_of_birth || '—'}</small></td>
                <td><span class="badge bg-info-subtle text-info-emphasis px-2 py-1">${escapeHtml(s.major)}</span></td>
                <td class="text-center">
                    <span class="badge-gpa ${gpaBadgeClass}" title="${gpaLevel}">${gpa.toFixed(2)}</span>
                </td>
                <td>
                    <div class="small text-muted">
                        ${s.email ? `<div><i class="fa-regular fa-envelope me-1 text-primary"></i>${escapeHtml(s.email)}</div>` : ''}
                        ${s.phone ? `<div><i class="fa-solid fa-phone fa-xs me-1 text-success"></i>${escapeHtml(s.phone)}</div>` : ''}
                        ${!s.email && !s.phone ? '<span class="text-muted fst-italic">Chưa có liên hệ</span>' : ''}
                    </div>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-warning action-btn me-1 btn-edit" data-id="${s.id}" title="Sửa thông tin">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger action-btn btn-delete" data-id="${s.id}" data-name="${escapeHtml(s.full_name)}" title="Xóa">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;

            studentTableBody.appendChild(tr);
        });

        // Gắn sự kiện nút Sửa
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.getAttribute('data-id')));
        });

        // Gắn sự kiện nút Xóa
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => confirmDelete(btn.getAttribute('data-id'), btn.getAttribute('data-name')));
        });
    }

    // --- RENDER PHÂN TRANG ---
    function renderPagination(currentPage, totalPages, totalItems) {
        const startItem = (currentPage - 1) * state.limit + 1;
        const endItem = Math.min(currentPage * state.limit, totalItems);
        paginationInfo.textContent = `Đang hiển thị ${startItem} - ${endItem} trên tổng số ${totalItems.toLocaleString()} sinh viên`;

        paginationNav.innerHTML = '';
        if (totalPages <= 1) return;

        // Nút Trang Trước
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#"><i class="fa-solid fa-chevron-left"></i></a>`;
        prevLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                state.page--;
                loadStudents();
            }
        });
        paginationNav.appendChild(prevLi);

        // Hiển thị các số trang
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            paginationNav.appendChild(createPageItem(1));
            if (startPage > 2) {
                const dots = document.createElement('li');
                dots.className = 'page-item disabled';
                dots.innerHTML = '<span class="page-link">...</span>';
                paginationNav.appendChild(dots);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationNav.appendChild(createPageItem(i, i === currentPage));
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const dots = document.createElement('li');
                dots.className = 'page-item disabled';
                dots.innerHTML = '<span class="page-link">...</span>';
                paginationNav.appendChild(dots);
            }
            paginationNav.appendChild(createPageItem(totalPages));
        }

        // Nút Trang Sau
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#"><i class="fa-solid fa-chevron-right"></i></a>`;
        nextLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) {
                state.page++;
                loadStudents();
            }
        });
        paginationNav.appendChild(nextLi);
    }

    function createPageItem(pageNum, isActive = false) {
        const li = document.createElement('li');
        li.className = `page-item ${isActive ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${pageNum}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            if (state.page !== pageNum) {
                state.page = pageNum;
                loadStudents();
            }
        });
        return li;
    }

    // --- TÌM KIẾM VÀ LỌC ---
    let searchDebounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            state.search = e.target.value.trim();
            state.page = 1;
            loadStudents();
        }, 300);
    });

    filterMajor.addEventListener('change', (e) => {
        state.major = e.target.value;
        state.page = 1;
        loadStudents();
    });

    pageSizeSelect.addEventListener('change', (e) => {
        state.limit = parseInt(e.target.value);
        state.page = 1;
        loadStudents();
    });

    // --- XUẤT DỮ LIỆU EXCEL & CSV ---
    btnExportExcel.addEventListener('click', (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (state.search) params.append('search', state.search);
        if (state.major) params.append('major', state.major);
        window.location.href = `/api/students/export/excel?${params.toString()}`;
    });

    btnExportCsv.addEventListener('click', (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (state.search) params.append('search', state.search);
        if (state.major) params.append('major', state.major);
        window.location.href = `/api/students/export/csv?${params.toString()}`;
    });

    // --- THÊM MỚI SINH VIÊN ---
    formAdd.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(formAdd);
        const payload = {
            student_code: formData.get('student_code').trim(),
            full_name: formData.get('full_name').trim(),
            major: formData.get('major').trim(),
            gender: formData.get('gender') || 'Nam',
            gpa: parseFloat(formData.get('gpa')) || 0.0,
            date_of_birth: formData.get('date_of_birth') || null,
            phone: formData.get('phone') ? formData.get('phone').trim() : null,
            email: formData.get('email') ? formData.get('email').trim() : null
        };

        try {
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Không thể thêm sinh viên');
            }

            modalAdd.hide();
            formAdd.reset();
            showToast('success', 'Thêm sinh viên thành công!');
            loadStudents();
            loadStats();
            loadMajors();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Không thể thêm sinh viên',
                text: err.message
            });
        }
    });

    // --- MỞ MODAL SỬA SINH VIÊN ---
    async function openEditModal(studentId) {
        try {
            const res = await fetch(`/api/students/${studentId}`);
            if (!res.ok) throw new Error();
            const s = await res.json();

            document.getElementById('edit-student-id').value = s.id;
            document.getElementById('edit-student-code').value = s.student_code;
            document.getElementById('edit-full-name').value = s.full_name;
            document.getElementById('edit-gender').value = s.gender || 'Nam';
            document.getElementById('edit-major').value = s.major;
            document.getElementById('edit-gpa').value = s.gpa !== null ? s.gpa : '';
            document.getElementById('edit-date_of_birth').value = s.date_of_birth || '';
            document.getElementById('edit-phone').value = s.phone || '';
            document.getElementById('edit-email').value = s.email || '';

            modalEdit.show();
        } catch (e) {
            showToast('error', 'Không thể lấy thông tin sinh viên');
        }
    }

    // --- CẬP NHẬT SINH VIÊN ---
    formEdit.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('edit-student-id').value;
        const payload = {
            student_code: document.getElementById('edit-student-code').value.trim(),
            full_name: document.getElementById('edit-full-name').value.trim(),
            gender: document.getElementById('edit-gender').value,
            major: document.getElementById('edit-major').value.trim(),
            gpa: parseFloat(document.getElementById('edit-gpa').value) || 0.0,
            date_of_birth: document.getElementById('edit-date_of_birth').value || null,
            phone: document.getElementById('edit-phone').value.trim() || null,
            email: document.getElementById('edit-email').value.trim() || null
        };

        try {
            const res = await fetch(`/api/students/${studentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Không thể cập nhật');
            }

            modalEdit.hide();
            showToast('success', 'Cập nhật thông tin thành công!');
            loadStudents();
            loadStats();
            loadMajors();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi cập nhật',
                text: err.message
            });
        }
    });

    // --- XÓA SINH VIÊN ---
    function confirmDelete(id, name) {
        Swal.fire({
            title: 'Xác nhận xóa?',
            html: `Bạn có chắc chắn muốn xóa sinh viên <strong>${name}</strong>? Thao tác này không thể hoàn tác!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="fa-solid fa-trash me-1"></i> Xóa vĩnh viễn',
            cancelButtonText: 'Hủy bỏ'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error();

                    showToast('success', 'Đã xóa sinh viên thành công!');
                    loadStudents();
                    loadStats();
                    loadMajors();
                } catch (e) {
                    showToast('error', 'Không thể xóa sinh viên');
                }
            }
        });
    }

    // --- XỬ LÝ KÉO THẢ VÀ NHẬP FILE EXCEL/CSV ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) handleFileSelected(files[0]);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFileSelected(fileInput.files[0]);
    });

    function handleFileSelected(file) {
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!validExtensions.includes(ext)) {
            Swal.fire('Định dạng không hợp lệ', 'Vui lòng chọn file định dạng .xlsx, .xls hoặc .csv', 'error');
            return;
        }

        state.selectedFile = file;
        selectedFileName.textContent = `Đã chọn: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        selectedFileName.classList.remove('d-none');
        btnSubmitImport.removeAttribute('disabled');

        // Reset kết quả trước đó
        importResultContainer.classList.add('d-none');
    }

    btnSubmitImport.addEventListener('click', async () => {
        if (!state.selectedFile) return;

        const formData = new FormData();
        formData.append('file', state.selectedFile);

        btnSubmitImport.setAttribute('disabled', 'true');
        importProgress.classList.remove('d-none');
        importResultContainer.classList.add('d-none');

        try {
            const res = await fetch('/api/students/import', {
                method: 'POST',
                body: formData
            });

            const result = await res.json();
            importProgress.classList.add('d-none');
            btnSubmitImport.removeAttribute('disabled');

            if (!res.ok) {
                throw new Error(result.detail || 'Lỗi xử lý file');
            }

            // Hiển thị kết quả
            importResultContainer.classList.remove('d-none');

            if (result.error_count === 0) {
                importResultSummary.className = 'alert alert-success mb-3';
                importResultSummary.innerHTML = `<strong>Thành công!</strong> Đã nhập thành công toàn bộ <strong>${result.success_count}</strong> sinh viên.`;
                importErrorTableContainer.classList.add('d-none');
            } else {
                importResultSummary.className = 'alert alert-warning mb-3';
                importResultSummary.innerHTML = `Hoàn tất với cảnh báo: Đã nhập thành công <strong>${result.success_count}</strong> sinh viên. Có <strong>${result.error_count}</strong> dòng bị lỗi hoặc bỏ qua.`;

                // Hiển thị danh sách lỗi
                importErrorTableContainer.classList.remove('d-none');
                importErrorBody.innerHTML = '';
                result.errors.forEach(err => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="text-center fw-bold">${err.row}</td>
                        <td>${err.student_code ? `<code>${escapeHtml(err.student_code)}</code>` : '<span class="text-muted">—</span>'}</td>
                        <td class="text-danger">${escapeHtml(err.error)}</td>
                    `;
                    importErrorBody.appendChild(tr);
                });
            }

            // Reload lại bảng và stats
            loadStudents();
            loadStats();
            loadMajors();

        } catch (err) {
            importProgress.classList.add('d-none');
            btnSubmitImport.removeAttribute('disabled');
            Swal.fire('Lỗi khi nhập file', err.message, 'error');
        }
    });

    // Reset modal khi đóng
    document.getElementById('modalImport').addEventListener('hidden.bs.modal', () => {
        state.selectedFile = null;
        fileInput.value = '';
        selectedFileName.classList.add('d-none');
        btnSubmitImport.setAttribute('disabled', 'true');
        importResultContainer.classList.add('d-none');
        importProgress.classList.add('d-none');
    });

    // Helper escape HTML tránh XSS
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- KHỞI ĐỘNG BAN ĐẦU ---
    loadStats();
    loadMajors();
    loadStudents();
});
