let cases = [];

function generateCaseCode() {
    const year = new Date().getFullYear();
    const num = cases.length > 0 ? Math.max(...cases.map(c => parseInt(c.code.split('-')[2]))) + 1 : 1;
    return `H-${year}-${String(num).padStart(5, '0')}`;
}

function saveCases() {
    localStorage.setItem('cases', JSON.stringify(cases));
}

function loadCases() {
    const stored = localStorage.getItem('cases');
    if (stored) {
        cases = JSON.parse(stored);
    }
    return cases;
}

function addCase(caseData) {
    const newCase = {
        id: Date.now(),
        code: generateCaseCode(),
        ...caseData,
        createdAt: new Date().toISOString(),
        history: [
            {
                status: caseData.status,
                note: 'تم إنشاء الحالة',
                date: new Date().toISOString(),
                user: caseData.createdBy || 'مستخدم غير محدد'
            }
        ]
    };
    cases.unshift(newCase);
    saveCases();
    return newCase;
}

function updateCaseStatus(caseId, newStatus, note, userName) {
    const item = cases.find(c => c.id === caseId);
    if (item) {
        item.status = newStatus;
        item.history.push({
            status: newStatus,
            note: note || 'تم تحديث الحالة',
            date: new Date().toISOString(),
            user: userName
        });
        saveCases();
        return true;
    }
    return false;
}

function deleteCase(caseId) {
    cases = cases.filter(c => c.id !== caseId);
    saveCases();
}

function getStats() {
    return {
        total: cases.length,
        open: cases.filter(c => c.status === 'مفتوح').length,
        inProgress: cases.filter(c => c.status === 'قيد المتابعة').length,
        closed: cases.filter(c => c.status === 'مغلق').length
    };
}

loadCases();
