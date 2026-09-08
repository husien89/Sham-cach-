document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth();
    if (!user) return;

    const userInfo = document.getElementById('userInfo');
    if (userInfo) userInfo.textContent = user.name;

    const today = new Date().toISOString().split('T')[0];
    const caseDate = document.getElementById('caseDate');
    const caseCode = document.getElementById('caseCode');
    if (caseDate) caseDate.value = today;
    if (caseCode) caseCode.value = generateCaseCode();

    renderStats();
    renderCases();

    const addForm = document.getElementById('addCaseForm');
    if (addForm) {
        addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!user.permissions.canAdd) {
                alert('⚠️ ليس لديك صلاحية إضافة حالات');
                return;
            }
            const newCase = addCase({
                date: document.getElementById('caseDate').value,
                owner: document.getElementById('caseOwner').value.trim(),
                phone: document.getElementById('casePhone').value.trim(),
                type: document.getElementById('caseType').value,
                description: document.getElementById('caseDescription').value.trim(),
                priority: document.getElementById('casePriority').value,
                responsible: document.getElementById('caseResponsible').value.trim(),
                status: document.getElementById('caseStatus').value,
                createdBy: user.name
            });
            alert(`✅ تم حفظ الحالة: ${newCase.code}`);
            e.target.reset();
            document.getElementById('caseDate').value = today;
            document.getElementById('caseCode').value = generateCaseCode();
            renderStats();
            renderCases();
        });
    }

    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    if (searchInput) searchInput.addEventListener('input', renderCases);
    if (filterStatus) filterStatus.addEventListener('change', renderCases);
});

function renderStats() {
    const stats = getStats();
    const totalEl = document.getElementById('statTotal');
    const openEl = document.getElementById('statOpen');
    const progressEl = document.getElementById('statProgress');
    const closedEl = document.getElementById('statClosed');
    
    if (totalEl) totalEl.textContent = stats.total;
    if (openEl) openEl.textContent = stats.open;
    if (progressEl) progressEl.textContent = stats.inProgress;
    if (closedEl) closedEl.textContent = stats.closed;
}

function renderCases() {
    const container = document.getElementById('casesContainer');
    if (!container) return;
    
    const searchTerm = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
    const filterStatus = document.getElementById('filterStatus')?.value || 'الكل';

    let filtered = cases.filter(c => {
        const matchSearch = !searchTerm || 
            c.code.toLowerCase().includes(searchTerm) ||
            c.owner.toLowerCase().includes(searchTerm) ||
            c.phone.includes(searchTerm) ||
            c.description.toLowerCase().includes(searchTerm);
        const matchStatus = filterStatus === 'الكل' || c.status === filterStatus;
        return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#8E8E93; padding:20px;">لا توجد حالات مطابقة</p>`;
        return;
    }

    const user = getCurrentUser();
    container.innerHTML = filtered.map(c => `
        <div class="case-item status-${c.status === 'مفتوح' ? 'open' : c.status === 'قيد المتابعة' ? 'progress' : c.status === 'مؤجل' ? 'pending' : 'closed'}">
            <div class="case-header-row">
                <span class="case-code-text">${c.code}</span>
                <span class="case-status-tag tag-${c.status === 'مفتوح' ? 'open' : c.status === 'قيد المتابعة' ? 'progress' : c.status === 'مؤجل' ? 'pending' : 'closed'}">${c.status}</span>
            </div>
            <div class="case-info-row"><span class="case-label">صاحب الحالة:</span><strong>${c.owner}</strong></div>
            <div class="case-info-row"><span class="case-label">الهاتف:</span><strong>${c.phone || '—'}</strong></div>
            <div class="case-info-row"><span class="case-label">النوع:</span><strong>${c.type}</strong></div>
            <div class="case-info-row"><span class="case-label">الأولوية:</span><strong>${c.priority}</strong></div>
            <div class="case-info-row"><span class="case-label">المسؤول:</span><strong>${c.responsible || 'غير محدد'}</strong></div>
            <div class="case-info-row"><span class="case-label">التاريخ:</span><strong>${c.date}</strong></div>
            <div class="case-info-row"><span class="case-label">الوصف:</span><strong>${c.description}</strong></div>
            <div class="case-actions-row">
                ${user?.permissions?.canEdit ? `<button class="btn-edit" onclick="updateStatusPrompt(${c.id})">تحديث</button>` : ''}
                <button class="btn-history" onclick="showHistory(${c.id})">سجل</button>
                ${user?.permissions?.canDelete ? `<button class="btn-delete" onclick="confirmDelete(${c.id})">حذف</button>` : ''}
            </div>
        </div>
    `).join('');
}

function updateStatusPrompt(caseId) {
    const user = getCurrentUser();
    if (!user || !user.permissions.canEdit) {
        alert('⚠️ ليس لديك صلاحية التحديث');
        return;
    }
    const newStatus = prompt('الحالة الجديدة:\nمفتوح — قيد المتابعة — مؤجل — مغلق — ملغى');
    if (!newStatus) return;
    const note = prompt('ملاحظة التحديث:');
    updateCaseStatus(caseId, newStatus, note || '', user.name);
    renderStats();
    renderCases();
    alert('✅ تم التحديث');
}

function showHistory(caseId) {
    const item = cases.find(c => c.id === caseId);
    if (!item) return;
    const historyText = item.history.map(h => 
        `الحالة: ${h.status}\nملاحظة: ${h.note}\nالوقت: ${new Date(h.date).toLocaleString('ar-SA')}\nالمستخدم: ${h.user}\n────────────────`
    ).join('\n');
    alert(`سجل التحديثات — ${item.code}\n────────────────\n${historyText}`);
}

function confirmDelete(caseId) {
    if (!confirm('⚠️ هل أنت متأكد من الحذف؟ لا يمكن التراجع!')) return;
    deleteCase(caseId);
    renderStats();
    renderCases();
    alert('✅ تم الحذف');
}
