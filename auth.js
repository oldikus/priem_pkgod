// auth.js (Firebase версия)
import { db, auth, collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc, signInWithEmailAndPassword } from './firebase-config.js';

const STORAGE_KEYS = {
    CURRENT_USER: 'receipt_system_current_user'
};

// ========== ХЕШИРОВАНИЕ ПАРОЛЯ ==========
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ========== АВТОРИЗАЦИЯ ==========
async function login(login, password) {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('login', '==', login));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return { success: false, error: 'Пользователь не найден' };
        }
        
        const userDoc = querySnapshot.docs[0];
        const user = userDoc.data();
        const hashedPassword = await hashPassword(password);
        
        if (user.password !== hashedPassword) {
            return { success: false, error: 'Неверный пароль' };
        }
        
        if (!user.isActive) {
            return { success: false, error: 'Аккаунт деактивирован' };
        }
        
        const session = {
            userId: userDoc.id,
            login: user.login,
            name: user.name,
            role: user.role,
            position: user.position,
            canViewStats: user.canViewStats,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
        return { success: true, user: session };
        
    } catch (error) {
        return { success: false, error: error.message };
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

// ========== УПРАВЛЕНИЕ РАСПИСКАМИ ==========
async function getAllReceipts() {
    const receiptsRef = collection(db, 'receipts');
    const q = query(receiptsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function saveReceipt(receiptData) {
    const receiptsRef = collection(db, 'receipts');
    const docRef = await addDoc(receiptsRef, {
        ...receiptData,
        createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...receiptData };
}

async function getEmployeeReceipts(employeeLogin) {
    const receiptsRef = collection(db, 'receipts');
    const q = query(receiptsRef, where('employeeLogin', '==', employeeLogin), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ========== УПРАВЛЕНИЕ СОТРУДНИКАМИ ==========
async function getEmployees() {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', 'in', ['employee', 'both', 'manager']));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getAllUsers() {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function addEmployee(employeeData) {
    const hashedPassword = await hashPassword(employeeData.password);
    const usersRef = collection(db, 'users');
    
    const docRef = await addDoc(usersRef, {
        login: employeeData.login,
        password: hashedPassword,
        name: employeeData.name,
        role: employeeData.role || 'employee',
        position: employeeData.position,
        phone: employeeData.phone,
        isActive: true,
        canViewStats: employeeData.role === 'manager' || employeeData.role === 'both',
        receiptCount: 0,
        createdAt: new Date().toISOString()
    });
    
    return { success: true, user: { id: docRef.id, ...employeeData } };
}

async function updateEmployee(login, updates) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('login', '==', login));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return { success: false, error: 'Пользователь не найден' };
    }
    
    const userDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, 'users', userDoc.id), updates);
    return { success: true };
}

async function deleteEmployee(login) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('login', '==', login));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return { success: false, error: 'Пользователь не найден' };
    }
    
    const userDoc = querySnapshot.docs[0];
    await deleteDoc(doc(db, 'users', userDoc.id));
    return { success: true };
}

// ========== СТАТИСТИКА ==========
async function getSystemStats() {
    const users = await getAllUsers();
    const receipts = await getAllReceipts();
    
    const today = new Date().toDateString();
    const todayReceipts = receipts.filter(r => {
        const date = new Date(r.createdAt);
        return date.toDateString() === today;
    });
    
    const employeeStats = users
        .filter(u => u.role !== 'admin')
        .map(u => ({
            name: u.name,
            login: u.login,
            receiptCount: u.receiptCount || 0,
            position: u.position,
            isActive: u.isActive
        }));
    
    const specialtyStats = {};
    receipts.forEach(r => {
        const code = r.specialtyCode;
        if (!specialtyStats[code]) specialtyStats[code] = 0;
        specialtyStats[code]++;
    });
    
    return {
        totalEmployees: users.filter(u => u.role !== 'admin').length,
        totalReceipts: receipts.length,
        todayReceipts: todayReceipts.length,
        activeUsers: users.filter(u => u.isActive).length,
        employeeStats,
        specialtyStats
    };
}

// ========== СЧЁТЧИКИ ==========
function getReceiptCounter(specialtyCode) {
    // В Firebase лучше хранить счётчики в отдельной коллекции
    // Пока используем localStorage для совместимости
    const counters = JSON.parse(localStorage.getItem('receipt_system_counters') || '{}');
    const current = counters[specialtyCode] || 0;
    counters[specialtyCode] = current + 1;
    localStorage.setItem('receipt_system_counters', JSON.stringify(counters));
    return current + 1;
}

// ========== НАСТРОЙКИ ==========
async function getConfig() {
    const settingsRef = collection(db, 'settings');
    const querySnapshot = await getDocs(settingsRef);
    const settings = {};
    querySnapshot.docs.forEach(doc => {
        settings[doc.id] = doc.data().value;
    });
    return settings;
}

// ========== ИНИЦИАЛИЗАЦИЯ НАЧАЛЬНЫХ ДАННЫХ ==========
async function initializeFirebaseData() {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    if (querySnapshot.empty) {
        console.log('📦 Создаём начальные данные...');
        
        const adminPassword = await hashPassword('admin123');
        await addDoc(usersRef, {
            login: 'admin',
            password: adminPassword,
            name: 'Главный Администратор',
            role: 'admin',
            position: 'Главный администратор',
            phone: '+7 (499) 156-40-01',
            isActive: true,
            canViewStats: true,
            receiptCount: 0,
            createdAt: new Date().toISOString()
        });
        
        console.log('✅ Начальные данные созданы');
    }
}

// Запуск инициализации
initializeFirebaseData();

// Экспорт глобальных функций
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
window.getReceiptCounter = getReceiptCounter;

console.log('✅ auth.js (Firebase version) загружен');