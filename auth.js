const users = [
    { username: "admin", password: "Admin@2026", role: "admin", name: "المدير العام" },
    { username: "coordinator", password: "Coord@2026", role: "coordinator", name: "منسق النظام" },
    { username: "follower", password: "Follow@2026", role: "follower", name: "متابع" },
    { username: "viewer", password: "View@2026", role: "viewer", name: "مشاهد" }
];

const rolePermissions = {
    admin: { canAdd: true, canEdit: true, canDelete: true, canExport: true, canViewAll: true },
    coordinator: { canAdd: true, canEdit: true, canDelete: false, canExport: true, canViewAll: true },
    follower: { canAdd: false, canEdit: true, canDelete: false, canExport: false, canViewAll: true },
    viewer: { canAdd: false, canEdit: false, canDelete: false, canExport: true, canViewAll: true }
};

function login(username, password, role) {
    const user = users.find(u => 
        u.username === username && 
        u.password === password && 
        u.role === role
    );
    if (user) {
        const session = {
            username: user.username,
            name: user.name,
            role: user.role,
            permissions: rolePermissions[user.role],
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('currentUser', JSON.stringify(session));
        return { success: true, user: session };
    }
    return { success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" };
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function checkAuth(requiredPermission = null) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    if (requiredPermission && !user.permissions[requiredPermission]) {
        alert('⚠️ ليس لديك صلاحية للوصول إلى هذا القسم');
        return null;
    }
    return user;
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const role = document.getElementById('userRole').value;
            
            if (!username || !password || !role) {
                alert('❌ أكمل جميع الحقول');
                return;
            }
            
            const result = login(username, password, role);
            if (result.success) {
                alert(`✅ مرحباً بك ${result.user.name}`);
                window.location.href = 'index.html';
            } else {
                alert(`❌ ${result.message}`);
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        const user = getCurrentUser();
        if (user) {
            userInfo.textContent = user.name;
        }
    }
});
