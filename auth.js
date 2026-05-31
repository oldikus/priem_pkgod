// ========== СИСТЕМА АВТОРИЗАЦИИ С ИНТЕГРАЦИЕЙ СОТРУДНИКОВ ==========

const STORAGE_KEYS = {
    USERS: 'receipt_system_users',
    CURRENT_USER: 'receipt_system_current_user',
    RECEIPTS: 'receipt_system_receipts',
    COUNTERS: 'receipt_system_counters'
};

// Инициализация системы
function initializeSystem() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        const defaultUsers = {
            'admin@college.ru': {
                id: 'admin_1',
                email: 'admin@college.ru',
                password: hashPassword('admin123'),
                name: 'Администратор Системы',
                role: 'admin',
                position: 'Главный администратор',
                phone: '+7 (499) 156-40-01',
                createdAt: new Date().toISOString(),
                isActive: true,
                canEditSpecialties: true,
                canEditEmployees: true,
                canViewAllReceipts: true
            },
            'osokin@college.ru': {
                id: 'emp_1',
                email: 'osokin@college.ru',
                password: hashPassword('123456'),
                name: 'Осокин Константин Вячеславович',
                role: 'employee',
                position: 'Ответственный секретарь',
                phone: '+7 (499) 156-40-02',
                createdAt: new Date().toISOString(),
                isActive: true,
                receiptCount: 0
            },
            'tsygankova@college.ru': {
                id: 'emp_2',
                email: 'tsygankova@college.ru',
                password: hashPassword('123456'),
                name: 'Цыганкова Юлия Игоревна',
                role: 'employee',
                position: 'Заместитель ответственного секретаря',
                phone: '+7 (499) 156-40-03',
                createdAt: new Date().toISOString(),
                isActive: true,
                receiptCount: 0
            },
            'vorobyeva@college.ru': {
                id: 'emp_3',
                email: 'vorobyeva@college.ru',
                password: hashPassword('123456'),
                name: 'Воробьева Ирина Алексеевна',
                role: 'employee',
                position: 'Специалист',
                phone: '+7 (499) 156-40-04',
                createdAt: new Date().toISOString(),
                isActive: true,
                receiptCount: 0
            },
            'khanakova@college.ru': {
                id: 'emp_4',
                email: 'khanakova@college.ru',
                password: hashPassword('123456'),
                name: 'Ханакова Анастасия Ивановна',
                role: 'employee',
                position: 'Специалист',
                phone: '+7 (499) 156-40-05',
                createdAt: new Date().toISOString(),
                isActive: true,
                receiptCount: 0
            }
        };
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.COUNTERS)) {
        localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify({}));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.RECEIPTS)) {
        localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify([]));
    }
}

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

// Вход в систему
function login(email, password) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
    const user = users[email];
    
    if (!user) {
        return { success: false, error: 'Пользователь не найден' };
    }
    
    if (!user.isActive) {
        return { success: false, error: 'Аккаунт деактивирован' };
    }
    
    if (user.password !== hashPassword(password)) {
        return { success: false, error: 'Неверный пароль' };
    }
    
    // Создаем сессию с полными данными сотрудника
    const session = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        position: user.position,
        phone: user.phone,
        loginTime: new Date().toISOString(),
        token: generateToken()
    };
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
    
    return { success: true, user: session };
}

function generateToken() {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.location.href = 'login.html';
}

function checkAuth() {
    const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(currentUser);
}

function getCurrentUser() {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
}

function checkRole(allowedRoles) {
    const user = checkAuth();
    if (!user) return false;
    return allowedRoles.includes(user.role);
}

// ========== УПРАВЛЕНИЕ СОТРУДНИКАМИ ==========

function getAllUsers() {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
    return Object.values(users);
}

function getEmployees() {
    const users = getAllUsers();
    return users.filter(u => u.role === 'employee');
}

function addEmployee(employeeData) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
    
    if (users[employeeData.email]) {
        return { success: false, error: 'Пользователь с таким email уже существует' };
    }
    
    const newUser = {
        id: 'emp_' + Date.now(),
        email: employeeData.email,
        password: hashPassword(employeeData.password),
        name: employeeData.name,
        role: 'employee',
        position: employeeData.position,
        phone: employeeData.phone,
        createdAt: new Date().toISOString(),
        isActive: true,
        receiptCount: 0
    };
    
    users[employeeData.email] = newUser;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    return { success: true, user: newUser };
}

function updateEmployee(email, updates) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
    
    if (!users[email]) {
        return { success: false, error: 'Пользователь не найден' };
    }
    
    if (updates.password) {
        updates.password = hashPassword(updates.password);
    }
    
    users[email] = { ...users[email], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    return { success: true };
}

function deleteEmployee(email) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
    
    if (!users[email]) {
        return { success: false, error: 'Пользователь не найден' };
    }
    
    if (users[email].role === 'admin') {
        return { success: false, error: 'Нельзя удалить администратора' };
    }
    
    delete users[email];
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
    
    // Обновляем счетчик сотрудника
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === 'employee') {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
        const user = users[currentUser.email];
        if (user) {
            user.receiptCount = (user.receiptCount || 0) + 1;
            users[currentUser.email] = user;
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
    }
}

function getReceipts(filters = {}) {
    let receipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
    
    if (filters.employeeEmail) {
        receipts = receipts.filter(r => r.employeeEmail === filters.employeeEmail);
    }
    
    if (filters.startDate) {
        receipts = receipts.filter(r => new Date(r.createdAt) >= new Date(filters.startDate));
    }
    
    if (filters.endDate) {
        receipts = receipts.filter(r => new Date(r.createdAt) <= new Date(filters.endDate));
    }
    
    return receipts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getEmployeeReceipts(employeeEmail) {
    return getReceipts({ employeeEmail });
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
    
    // Статистика по сотрудникам
    const employeeStats = getEmployees().map(emp => ({
        name: emp.name,
        email: emp.email,
        receiptCount: emp.receiptCount || 0,
        position: emp.position,
        isActive: emp.isActive
    }));
    
    // Статистика по специальностям
    const specialtyStats = {};
    receipts.forEach(receipt => {
        const code = receipt.specialtyCode;
        if (!specialtyStats[code]) specialtyStats[code] = 0;
        specialtyStats[code]++;
    });
    
    return {
        totalEmployees: users.filter(u => u.role === 'employee').length,
        totalReceipts: receipts.length,
        todayReceipts: todayReceipts.length,
        activeUsers: users.filter(u => u.isActive).length,
        employeeStats,
        specialtyStats,
        lastReceipts: receipts.slice(0, 10)
    };
}

// Инициализация
initializeSystem();