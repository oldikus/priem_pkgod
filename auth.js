// auth.js - ЧИСТАЯ ВЕРСИЯ ТОЛЬКО ДЛЯ БД

async function login(login, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password })
        });
        const result = await response.json();
        if (result.success) {
            localStorage.setItem('receipt_system_current_user', JSON.stringify(result.user));
            return { success: true, user: result.user };
        }
        return { success: false, error: result.error };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

function logout() {
    localStorage.removeItem('receipt_system_current_user');
    window.location.href = 'login.html';
}

function checkAuth() {
    const user = localStorage.getItem('receipt_system_current_user');
    if (!user && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
        return null;
    }
    return user ? JSON.parse(user) : null;
}

function getCurrentUser() {
    const user = localStorage.getItem('receipt_system_current_user');
    return user ? JSON.parse(user) : null;
}

async function getAllReceipts() {
    const response = await fetch('/api/receipts');
    return response.json();
}

async function saveReceipt(data) {
    const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}

async function getEmployeeReceipts(login) {
    const response = await fetch(`/api/receipts/employee/${login}`);
    return response.json();
}

async function getEmployees() {
    const response = await fetch('/api/users');
    const users = await response.json();
    return users.filter(u => u.role !== 'admin');
}

async function getAllUsers() {
    const response = await fetch('/api/users');
    return response.json();
}

async function addEmployee(data) {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}

async function updateEmployee(login, data) {
    const response = await fetch(`/api/users/${login}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}

async function deleteEmployee(login) {
    const response = await fetch(`/api/users/${login}`, { method: 'DELETE' });
    return response.json();
}

async function getSystemStats() {
    const response = await fetch('/api/stats');
    return response.json();
}

async function getConfig() {
    const response = await fetch('/api/config');
    return response.json();
}

async function saveConfig(config) {
    localStorage.setItem('receipt_system_config_backup', JSON.stringify(config));
    return { success: true };
}

async function getReceiptCounter(specialtyCode) {
    const response = await fetch(`/api/counter/${specialtyCode}`);
    const data = await response.json();
    return data.number;
}

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

console.log('✅ auth.js загружен (полная БД версия)');