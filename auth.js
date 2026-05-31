// auth.js - Railway API версия
const STORAGE_KEYS = { CURRENT_USER: 'receipt_system_current_user' };

function showToast(msg, type) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'}; color: white;
        border-radius: 8px; z-index: 10000; font-size: 14px;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function login(login, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password })
        });
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(result.user));
            return { success: true, user: result.user };
        }
        return { success: false, error: result.error };
    } catch (err) {
        return { success: false, error: 'Ошибка подключения к серверу' };
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

async function getAllReceipts() {
    const response = await fetch('/api/receipts');
    return await response.json();
}

async function saveReceipt(receiptData) {
    const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData)
    });
    const result = await response.json();
    showToast('Расписка сохранена', 'success');
    return result;
}

async function getEmployeeReceipts(employeeLogin) {
    const receipts = await getAllReceipts();
    return receipts.filter(r => r.employee_login === employeeLogin);
}

async function getEmployees() {
    const response = await fetch('/api/employees');
    return await response.json();
}

async function getAllUsers() {
    const response = await fetch('/api/employees');
    const employees = await response.json();
    const adminResponse = await fetch('/api/users');
    const admins = await adminResponse.json();
    return [...employees, ...admins];
}

async function addEmployee(employeeData) {
    const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData)
    });
    return await response.json();
}

async function updateEmployee(login, updates) {
    const response = await fetch(`/api/employees/${login}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    return await response.json();
}

async function deleteEmployee(login) {
    const response = await fetch(`/api/employees/${login}`, {
        method: 'DELETE'
    });
    return await response.json();
}

async function getSystemStats() {
    const response = await fetch('/api/stats');
    return await response.json();
}

function getReceiptCounter(specialtyCode) {
    const counters = JSON.parse(localStorage.getItem('receipt_system_counters') || '{}');
    const next = (counters[specialtyCode] || 0) + 1;
    counters[specialtyCode] = next;
    localStorage.setItem('receipt_system_counters', JSON.stringify(counters));
    return next;
}

function getConfig() {
    return {
        documentTypes: ['Паспорт (копия)', 'Аттестат (копия)', 'СНИЛС (копия)', 'Фотография 3x4', 'Заявление'],
        specialties: {
            'Производство летательных аппаратов': { code: 'ЛА', active: true, order: 1 },
            'Производство авиационных двигателей': { code: 'ПД', active: true, order: 2 },
            'Сервис на транспорте': { code: 'СТ', active: true, order: 11 }
        },
        settings: { maxPhotosCount: 4, companyName: 'Приемная комиссия', companyPhone: '(499) 156-40-01' }
    };
}

function saveConfig(config) {
    localStorage.setItem('receipt_system_config', JSON.stringify(config));
    return { success: true };
}

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

console.log('✅ auth.js загружен (Railway API)');