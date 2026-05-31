// ========== СИСТЕМА АВТОРИЗАЦИИ (LOCAL STORAGE) ==========

const STORAGE_KEYS = {
    USERS: 'receipt_system_users',
    CURRENT_USER: 'receipt_system_current_user',
    RECEIPTS: 'receipt_system_receipts',
    COUNTERS: 'receipt_system_counters'
};

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

// ИНИЦИАЛИЗАЦИЯ ПОЛЬЗОВАТЕЛЕЙ
function initializeUsers() {
    const existing = localStorage.getItem(STORAGE_KEYS.USERS);
    if (existing) return JSON.parse(existing);
    
    const users = {
        'admin': {
            id: 'admin_1',
            login: 'admin',
            password: hashPassword('admin123'),
            name: 'Главный Администратор',
            role: 'admin',
            position: 'Главный администратор',
            phone: '+7 (499) 156-40-01',
            createdAt: new Date().toISOString(),
            isActive: true,
            canViewStats: true,
            receiptCount: 0
        },
        'osokin': {
            id: 'emp_1',
            login: 'osokin',
            password: hashPassword('123456'),
            name: 'Осокин Константин Вячеславович',
            role: 'both',
            position: 'Ответственный секретарь',
            phone: '+7 (499) 156-40-02',
            createdAt: new Date().toISOString(),
            isActive: true,
            canViewStats: true,
            receiptCount: 0
        },
        'tsygankova': {
            id: 'emp_2',
            login: 'tsygankova',
            password: hashPassword('123456'),
            name: 'Цыганкова Юлия Игоревна',
            role: 'both',
            position: 'Заместитель ответственного секретаря',
            phone: '+7 (499) 156-40-03',
            createdAt: new Date().toISOString(),
            isActive: true,
            canViewStats: true,
            receiptCount: 0
        },
        'vorobyeva': {
            id: 'emp_3',
            login: 'vorobyeva',
            password: hashPassword('123456'),
            name: 'Воробьева Ирина Алексеевна',
            role: 'employee',
            position: 'Специалист',
            phone: '+7 (499) 156-40-04',
            createdAt: new Date().toISOString(),
            isActive: true,
            canViewStats: false,
            receiptCount: 0
        },
        'khanakova': {
            id: 'emp_4',
            login: 'khanakova',
            password: hashPassword('123456'),
            name: 'Ханакова Анастасия Ивановна',
            role: 'employee',
            position: 'Специалист',
            phone: '+7 (499) 156-40-05',
            createdAt: new Date().toISOString(),
            isActive: true,
            canViewStats: false,
            receiptCount: 0
        }
    };
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    if (!localStorage.getItem(STORAGE_KEYS.RECEIPTS)) {
        localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COUNTERS)) {
        localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify({}));
    }
    
    return users;
}

// ВХОД
function login(login, password) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
    const user = users[login];
    
    if (!user) return { success: false, error: 'Пользователь не найден' };
    if (!user.isActive) return { success: false, error: 'Аккаунт деактивирован' };
    if (user.password !== hashPassword(password)) return { success: false, error: 'Неверный пароль' };
    
    const session = {
        userId: user.id,
        login: user.login,
        name: user.name,
        role: user.role,
        position: user.position,
        phone: user.phone,
        canViewStats: user.canViewStats || false,
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
    return { success: true, user: session };
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.location.href = 'login.html';
}

function checkAuth() {
    const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) {
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return null;
    }
    return JSON.parse(currentUser);
}

function getCurrentUser() {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
}

function isAdmin() {
    const user = getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'both');
}

function canViewStats() {
    const user = getCurrentUser();
    return user && (user.canViewStats || user.role === 'admin');
}

// ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==========

function getAllUsers() {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
    return Object.values(users);
}

function getEmployees() {
    const users = getAllUsers();
    return users.filter(u => u.role === 'employee' || u.role === 'both');
}

function addEmployee(employeeData) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
    
    if (users[employeeData.login]) {
        return { success: false, error: 'Логин уже существует' };
    }
    
    const newUser = {
        id: 'emp_' + Date.now(),
        login: employeeData.login,
        password: hashPassword(employeeData.password),
        name: employeeData.name,
        role: employeeData.role || 'employee',
        position: employeeData.position,
        phone: employeeData.phone,
        createdAt: new Date().toISOString(),
        isActive: true,
        receiptCount: 0,
        canViewStats: employeeData.canViewStats || false
    };
    
    users[employeeData.login] = newUser;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true, user: newUser };
}

function updateEmployee(login, updates) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
    if (!users[login]) return { success: false, error: 'Пользователь не найден' };
    if (updates.password) updates.password = hashPassword(updates.password);
    users[login] = { ...users[login], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true };
}

function deleteEmployee(login) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
    if (!users[login]) return { success: false, error: 'Пользователь не найден' };
    if (users[login].login === 'admin') return { success: false, error: 'Нельзя удалить администратора' };
    delete users[login];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true };
}

// ========== УПРАВЛЕНИЕ РАСПИСКАМИ ==========

function saveReceipt(receiptData) {
    const receipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
    receipts.push({
        ...receiptData,
        id: 'receipt_' + Date.now(),
        createdAt: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
    
    // Обновляем счётчик сотрудника
    const currentUser = getCurrentUser();
    if (currentUser) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
        const user = users[currentUser.login];
        if (user) {
            user.receiptCount = (user.receiptCount || 0) + 1;
            users[currentUser.login] = user;
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
    }
}

function getReceipts(filters = {}) {
    let receipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
    if (filters.employeeLogin) {
        receipts = receipts.filter(r => r.employeeLogin === filters.employeeLogin);
    }
    return receipts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getEmployeeReceipts(employeeLogin) {
    return getReceipts({ employeeLogin });
}

function getReceiptCounter(specialtyCode) {
    const counters = JSON.parse(localStorage.getItem(STORAGE_KEYS.COUNTERS) || '{}');
    const current = counters[specialtyCode] || 0;
    counters[specialtyCode] = current + 1;
    localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters));
    return current + 1;
}

// ========== СТАТИСТИКА ==========

function getSystemStats() {
    const users = getAllUsers();
    const receipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
    const today = new Date().toDateString();
    const todayReceipts = receipts.filter(r => new Date(r.createdAt).toDateString() === today);
    
    const employeeStats = getEmployees().map(emp => ({
        name: emp.name,
        login: emp.login,
        receiptCount: emp.receiptCount || 0,
        position: emp.position,
        isActive: emp.isActive
    }));
    
    const specialtyStats = {};
    receipts.forEach(receipt => {
        const code = receipt.specialtyCode;
        if (!specialtyStats[code]) specialtyStats[code] = 0;
        specialtyStats[code]++;
    });
    
    return {
        totalEmployees: users.filter(u => u.role === 'employee' || u.role === 'both').length,
        totalReceipts: receipts.length,
        todayReceipts: todayReceipts.length,
        activeUsers: users.filter(u => u.isActive).length,
        employeeStats,
        specialtyStats
    };
}

// ИНИЦИАЛИЗАЦИЯ
initializeUsers();

console.log('✅ auth.js загружен, система готова');