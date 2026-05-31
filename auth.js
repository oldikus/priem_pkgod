// auth.js - для работы с сервером Railway
const STORAGE_KEYS = { CURRENT_USER: 'receipt_system_current_user' };

const API_URL = window.location.origin;

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
        const response = await fetch(`${API_URL}/api/login`, {
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
    const response = await fetch(`${API_URL}/api/receipts`);
    return await response.json();
}

async function saveReceipt(receiptData) {
    const response = await fetch(`${API_URL}/api/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData)
    });
    const result = await response.json();
    showToast('Расписка сохранена', 'success');
    return result;
}

async function getEmployees() {
    const response = await fetch(`${API_URL}/api/employees`);
    return await response.json();
}

async function getSystemStats() {
    const response = await fetch(`${API_URL}/api/stats`);
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

window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
window.getCurrentUser = getCurrentUser;
window.getAllReceipts = getAllReceipts;
window.saveReceipt = saveReceipt;
window.getEmployees = getEmployees;
window.getSystemStats = getSystemStats;
window.getConfig = getConfig;
window.getReceiptCounter = getReceiptCounter;
window.showToast = showToast;

console.log('✅ auth.js загружен (Railway API версия)');