// ========== СИСТЕМА АВТОРИЗАЦИИ (API VERSION) ==========

const API_BASE_URL = '/.netlify/functions';

const STORAGE_KEYS = {
    CURRENT_USER: 'receipt_system_current_user'
};

// ========== ОСНОВНЫЕ ФУНКЦИИ ==========

// Функция входа через API
async function login(login, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', login, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(result.user));
            return { success: true, user: result.user };
        } else {
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        return { success: false, error: 'Ошибка соединения с сервером' };
    }
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
        if (window.location.pathname !== '/login.html' && !window.location.pathname.includes('login')) {
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
    return user && (user.canViewStats || user.role === 'admin');
}

// ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (ЧЕРЕЗ API) ==========

// Получить всех пользователей
async function getAllUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/employees`);
        const result = await response.json();
        if (result.success) {
            return result.employees || [];
        }
        return [];
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        return [];
    }
}

// Получить только сотрудников
async function getEmployees() {
    const users = await getAllUsers();
    return users.filter(u => u.role === 'employee' || u.role === 'both');
}

// Добавить сотрудника
async function addEmployee(employeeData) {
    try {
        const response = await fetch(`${API_BASE_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Ошибка добавления сотрудника:', error);
        return { success: false, error: error.message };
    }
}

// Обновить сотрудника
async function updateEmployee(login, updates) {
    try {
        const response = await fetch(`${API_BASE_URL}/employees`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, updates })
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Ошибка обновления сотрудника:', error);
        return { success: false, error: error.message };
    }
}

// Удалить сотрудника
async function deleteEmployee(login) {
    try {
        const response = await fetch(`${API_BASE_URL}/employees`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login })
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Ошибка удаления сотрудника:', error);
        return { success: false, error: error.message };
    }
}

// ========== УПРАВЛЕНИЕ РАСПИСКАМИ ==========

// Сохранить расписку
async function saveReceipt(receiptData) {
    try {
        const response = await fetch(`${API_BASE_URL}/receipts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', receiptData })
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Ошибка создания расписки:', error);
        return { success: false, error: error.message };
    }
}

// Получить расписки сотрудника
async function getEmployeeReceipts(employeeLogin) {
    try {
        const response = await fetch(`${API_BASE_URL}/receipts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getByEmployee', employeeLogin })
        });
        const result = await response.json();
        return result.success ? result.receipts : [];
    } catch (error) {
        console.error('Ошибка загрузки расписок:', error);
        return [];
    }
}

// Получить все расписки (для админа)
async function getAllReceipts() {
    try {
        const response = await fetch(`${API_BASE_URL}/receipts`);
        const result = await response.json();
        return result.success ? result.receipts : [];
    } catch (error) {
        console.error('Ошибка загрузки расписок:', error);
        return [];
    }
}

// Получить счётчик для специальности
async function getReceiptCounter(specialtyCode) {
    // Эта логика теперь на сервере
    try {
        const response = await fetch(`${API_BASE_URL}/receipts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getCounter', specialtyCode })
        });
        const result = await response.json();
        return result.success ? result.counter : 1;
    } catch (error) {
        console.error('Ошибка получения счётчика:', error);
        return Date.now();
    }
}

// ========== СТАТИСТИКА ==========

// Получить статистику системы
async function getSystemStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const result = await response.json();
        if (result.success) {
            return result.stats;
        }
        return {
            totalEmployees: 0,
            totalReceipts: 0,
            todayReceipts: 0,
            activeUsers: 0,
            employeeStats: [],
            specialtyStats: {},
            monthlyStats: {},
            lastReceipts: []
        };
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        return {
            totalEmployees: 0,
            totalReceipts: 0,
            todayReceipts: 0,
            activeUsers: 0,
            employeeStats: [],
            specialtyStats: {},
            monthlyStats: {},
            lastReceipts: []
        };
    }
}

// ========== НАСТРОЙКИ ==========

// Получить настройки
async function getSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        const result = await response.json();
        if (result.success) {
            return result.settings;
        }
        return {
            max_photos: 4,
            company_name: 'Приемная комиссия',
            company_phone: '(499) 156-40-01'
        };
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        return {
            max_photos: 4,
            company_name: 'Приемная комиссия',
            company_phone: '(499) 156-40-01'
        };
    }
}

// Сохранить настройки
async function saveSettings(settings) {
    try {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        return { success: false, error: error.message };
    }
}

// ========== ЭКСПОРТ ДЛЯ ИСПОЛЬЗОВАНИЯ В HTML ==========

// Делаем функции глобальными для использования в HTML
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
    window.getEmployeeReceipts = getEmployeeReceipts;
    window.getAllReceipts = getAllReceipts;
    window.getReceiptCounter = getReceiptCounter;
    
    window.getSystemStats = getSystemStats;
    
    window.getSettings = getSettings;
    window.saveSettings = saveSettings;
}

console.log('✅ auth.js (API version) загружен');