// ========== СИСТЕМА АВТОРИЗАЦИИ ==========

const STORAGE_KEYS = {
    USERS: 'receipt_system_users',
    CURRENT_USER: 'receipt_system_current_user',
    RECEIPTS: 'receipt_system_receipts',
    COUNTERS: 'receipt_system_counters'
};

// Хеширование пароля
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

// ========== ИНИЦИАЛИЗАЦИЯ ПОЛЬЗОВАТЕЛЕЙ ==========
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
            position: 'Специалист архива',
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
            position: 'Специалист архива',
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

// ========== ОСНОВНЫЕ ФУНКЦИИ АВТОРИЗАЦИИ ==========

// Вход в систему
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
        canViewStats: user.canViewStats || user.role === 'admin' || user.role === 'both' || user.role === 'manager',
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
    return { success: true, user: session };
}

// Выход из системы
function logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.location.href = 'login.html';
}

// Проверка авторизации (с редиректом)
function checkAuth() {
    const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) {
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
            window.location.href = 'login.html';
        }
        return null;
    }
    return JSON.parse(currentUser);
}

// Получить текущего пользователя (без редиректа)
function getCurrentUser() {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
}

// Проверка прав администратора
function isAdmin() {
    const user = getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'both');
}

// Проверка доступа к статистике
function canViewStats() {
    const user = getCurrentUser();
    return user && (user.canViewStats || user.role === 'admin' || user.role === 'both' || user.role === 'manager');
}

// ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==========

// Получить всех пользователей
function getAllUsers() {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
    return Object.values(users);
}

// Получить только сотрудников (не админов)
function getEmployees() {
    const users = getAllUsers();
    return users.filter(function(u) { 
        return u.role === 'employee' || u.role === 'both' || u.role === 'manager';
    });
}

// Добавить сотрудника
function addEmployee(employeeData) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
    
    if (users[employeeData.login]) {
        return { success: false, error: 'Логин уже существует' };
    }
    
    const canViewStats = employeeData.role === 'manager' || employeeData.role === 'both' || employeeData.role === 'admin';
    
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
        canViewStats: canViewStats
    };
    
    users[employeeData.login] = newUser;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true, user: newUser };
}

// Обновить сотрудника
function updateEmployee(login, updates) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
    if (!users[login]) return { success: false, error: 'Пользователь не найден' };
    if (updates.password) updates.password = hashPassword(updates.password);
    // Обновляем canViewStats на основе роли
    if (updates.role) {
        updates.canViewStats = updates.role === 'manager' || updates.role === 'both' || updates.role === 'admin';
    }
    users[login] = Object.assign({}, users[login], updates);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true };
}

// Удалить сотрудника
function deleteEmployee(login) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
    if (!users[login]) return { success: false, error: 'Пользователь не найден' };
    if (users[login].login === 'admin') return { success: false, error: 'Нельзя удалить главного администратора' };
    delete users[login];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true };
}

// ========== УПРАВЛЕНИЕ РАСПИСКАМИ ==========

// Сохранить расписку
function saveReceipt(receiptData) {
    const receipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
    receipts.push(Object.assign({}, receiptData, {
        id: 'receipt_' + Date.now(),
        createdAt: new Date().toISOString()
    }));
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
    
    // Обновляем счётчик сотрудника
    const currentUser = getCurrentUser();
    if (currentUser && (currentUser.role === 'employee' || currentUser.role === 'both' || currentUser.role === 'manager')) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
        const user = users[currentUser.login];
        if (user) {
            user.receiptCount = (user.receiptCount || 0) + 1;
            users[currentUser.login] = user;
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
    }
}

// Получить расписки с фильтрами
function getReceipts(filters) {
    filters = filters || {};
    let receipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
    if (filters.employeeLogin) {
        receipts = receipts.filter(function(r) { return r.employeeLogin === filters.employeeLogin; });
    }
    return receipts.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
}

// Получить все расписки
function getAllReceipts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
}

// Получить расписки сотрудника
function getEmployeeReceipts(employeeLogin) {
    return getReceipts({ employeeLogin: employeeLogin });
}

// Получить счётчик для специальности
function getReceiptCounter(specialtyCode) {
    const counters = JSON.parse(localStorage.getItem(STORAGE_KEYS.COUNTERS) || '{}');
    const current = counters[specialtyCode] || 0;
    counters[specialtyCode] = current + 1;
    localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters));
    return current + 1;
}

// ========== СТАТИСТИКА ==========

// Получить статистику системы
function getSystemStats() {
    const users = getAllUsers();
    const receipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
    const today = new Date().toDateString();
    const todayReceipts = receipts.filter(function(r) { 
        return new Date(r.createdAt).toDateString() === today; 
    });
    
    const employeeStats = getEmployees().map(function(emp) {
        return {
            name: emp.name,
            login: emp.login,
            receiptCount: emp.receiptCount || 0,
            position: emp.position,
            isActive: emp.isActive,
            role: emp.role
        };
    });
    
    const specialtyStats = {};
    for (var i = 0; i < receipts.length; i++) {
        var code = receipts[i].specialtyCode;
        if (!specialtyStats[code]) specialtyStats[code] = 0;
        specialtyStats[code]++;
    }
    
    const monthlyStats = {};
    for (var i = 0; i < receipts.length; i++) {
        var month = new Date(receipts[i].createdAt).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
        if (!monthlyStats[month]) monthlyStats[month] = 0;
        monthlyStats[month]++;
    }
    
    return {
        totalEmployees: users.filter(function(u) { return u.role !== 'admin'; }).length,
        totalReceipts: receipts.length,
        todayReceipts: todayReceipts.length,
        activeUsers: users.filter(function(u) { return u.isActive; }).length,
        employeeStats: employeeStats,
        specialtyStats: specialtyStats,
        monthlyStats: monthlyStats,
        lastReceipts: receipts.slice(0, 10)
    };
}

// Сбросить все счётчики
function resetAllCounters() {
    localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify({}));
}

// ========== ЭКСПОРТ ДЛЯ ГЛОБАЛЬНОГО ИСПОЛЬЗОВАНИЯ ==========
if (typeof window !== 'undefined') {
    window.login = login;
    window.logout = logout;
    window.checkAuth = checkAuth;
    window.getCurrentUser = getCurrentUser;
    window.isAdmin = isAdmin;
    window.canViewStats = canViewStats;
    
    window.getAllUsers = getAllUsers;
    window.getEmployees = getEmployees;
    window.addEmployee = addEmployee;
    window.updateEmployee = updateEmployee;
    window.deleteEmployee = deleteEmployee;
    
    window.saveReceipt = saveReceipt;
    window.getReceipts = getReceipts;
    window.getAllReceipts = getAllReceipts;
    window.getEmployeeReceipts = getEmployeeReceipts;
    window.getReceiptCounter = getReceiptCounter;
    
    window.getSystemStats = getSystemStats;
    window.resetAllCounters = resetAllCounters;
}

// ИНИЦИАЛИЗАЦИЯ
initializeUsers();

console.log('✅ auth.js загружен');
console.log('📊 Доступные пользователи:', Object.keys(JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}')).join(', '));