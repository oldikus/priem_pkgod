// auth.js - единая версия для всего проекта

// ========== КОНСТАНТЫ ==========
const STORAGE_KEYS = {
    CURRENT_USER: 'receipt_system_current_user'
};

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function showToast(msg, type) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'}; color: white;
        border-radius: 8px; z-index: 10000; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== АВТОРИЗАЦИЯ ==========
async function login(login, password) {
    console.log('🔐 Попытка входа:', login);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password })
        });
        
        const result = await response.json();
        console.log('📥 Ответ:', result);
        
        if (result.success) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(result.user));
            showToast(`Добро пожаловать, ${result.user.name}!`, 'success');
            return { success: true, user: result.user };
        } else {
            showToast(result.error, 'error');
            return { success: false, error: result.error };
        }
    } catch (err) {
        console.error('❌ Ошибка:', err);
        showToast('Ошибка подключения к серверу', 'error');
        return { success: false, error: err.message };
    }
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.location.href = 'login.html';
}

function checkAuth() {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!user && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
        return null;
    }
    return user ? JSON.parse(user) : null;
}

function getCurrentUser() {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
}

// ========== РАБОТА С РАСПИСКАМИ ==========
async function getAllReceipts() {
    try {
        const response = await fetch('/api/receipts');
        return await response.json();
    } catch (err) {
        console.error('Ошибка получения расписок:', err);
        return [];
    }
}

async function saveReceipt(receiptData) {
    try {
        const response = await fetch('/api/receipts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(receiptData)
        });
        const result = await response.json();
        showToast('Расписка сохранена', 'success');
        return result;
    } catch (err) {
        showToast('Ошибка сохранения', 'error');
        throw err;
    }
}

async function getEmployeeReceipts(employeeLogin) {
    const receipts = await getAllReceipts();
    return receipts.filter(r => r.employee_login === employeeLogin);
}

// ========== РАБОТА С СОТРУДНИКАМИ ==========
async function getEmployees() {
    try {
        const response = await fetch('/api/employees');
        return await response.json();
    } catch (err) {
        console.error('Ошибка получения сотрудников:', err);
        return [];
    }
}

async function getAllUsers() {
    return await getEmployees();
}

async function addEmployee(employeeData) {
    try {
        const response = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        const result = await response.json();
        if (result.success) {
            showToast('Сотрудник добавлен', 'success');
        }
        return result;
    } catch (err) {
        showToast('Ошибка добавления', 'error');
        return { success: false, error: err.message };
    }
}

async function updateEmployee(login, updates) {
    try {
        const response = await fetch(`/api/employees/${login}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const result = await response.json();
        if (result.success) {
            showToast('Сотрудник обновлён', 'success');
        }
        return result;
    } catch (err) {
        showToast('Ошибка обновления', 'error');
        return { success: false, error: err.message };
    }
}

async function deleteEmployee(login) {
    try {
        const response = await fetch(`/api/employees/${login}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
            showToast('Сотрудник удалён', 'success');
        }
        return result;
    } catch (err) {
        showToast('Ошибка удаления', 'error');
        return { success: false, error: err.message };
    }
}

// ========== СТАТИСТИКА ==========
async function getSystemStats() {
    try {
        const response = await fetch('/api/stats');
        return await response.json();
    } catch (err) {
        console.error('Ошибка статистики:', err);
        return {
            totalEmployees: 0,
            totalReceipts: 0,
            todayReceipts: 0,
            activeUsers: 0,
            employeeStats: [],
            specialtyStats: {}
        };
    }
}

// ========== НАСТРОЙКИ ==========
async function getConfig() {
    return {
        documentTypes: ['Паспорт (копия)', 'Аттестат (копия)', 'СНИЛС (копия)', 'Фотография 3x4', 'Заявление'],
        specialties: {
            'Производство летательных аппаратов': { code: 'ЛА', name: 'Производство летательных аппаратов', active: true, order: 1 },
            'Производство авиационных двигателей': { code: 'ПД', name: 'Производство авиационных двигателей', active: true, order: 2 },
            'Сервис на транспорте': { code: 'СТ', name: 'Сервис на транспорте', active: true, order: 11 }
        },
        settings: {
            maxPhotosCount: 4,
            companyName: 'Приемная комиссия',
            companyPhone: '(499) 156-40-01'
        }
    };
}

async function saveConfig(config) {
    localStorage.setItem('receipt_system_config', JSON.stringify(config));
    showToast('Настройки сохранены', 'success');
    return { success: true };
}

function getReceiptCounter(specialtyCode) {
    const counters = JSON.parse(localStorage.getItem('receipt_system_counters') || '{}');
    const next = (counters[specialtyCode] || 0) + 1;
    counters[specialtyCode] = next;
    localStorage.setItem('receipt_system_counters', JSON.stringify(counters));
    return next;
}

// ========== ЭКСПОРТ ВСЕХ ФУНКЦИЙ ==========
window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
window.getCurrentUser = getCurrentUser;
window.getAllReceipts = getAllReceipts;
window.saveReceipt = saveReceipt;
window.getEmployeeReceipts = getEmployeeReceipts;
window.getEmployees = getEmployees;
window.getAllUsers = getAllUsers;
window.addEmployee = addEmployee;
window.updateEmployee = updateEmployee;
window.deleteEmployee = deleteEmployee;
window.getSystemStats = getSystemStats;
window.getConfig = getConfig;
window.saveConfig = saveConfig;
window.getReceiptCounter = getReceiptCounter;
window.showToast = showToast;

console.log('✅ auth.js загружен (единая версия)');