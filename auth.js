// auth.js - Supabase версия
const STORAGE_KEYS = { CURRENT_USER: 'receipt_system_current_user' };

function showToast(msg, type) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'}; color: white;
        border-radius: 8px; z-index: 10000; font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function waitForSupabase() {
    return new Promise((resolve) => {
        if (window.supabase) {
            resolve(window.supabase);
            return;
        }
        const checkInterval = setInterval(() => {
            if (window.supabase) {
                clearInterval(checkInterval);
                resolve(window.supabase);
            }
        }, 100);
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error('❌ Таймаут Supabase');
            resolve(null);
        }, 10000);
    });
}

async function login(login, password) {
    console.log('🔐 Попытка входа:', login);
    
    const supabase = await waitForSupabase();
    if (!supabase) {
        return { success: false, error: 'Ошибка подключения к БД' };
    }
    
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('login', login)
            .eq('password', password);
        
        if (error) {
            console.error('Ошибка запроса:', error);
            return { success: false, error: 'Ошибка базы данных' };
        }
        
        if (!users || users.length === 0) {
            return { success: false, error: 'Неверный логин или пароль' };
        }
        
        const user = users[0];
        
        if (!user.is_active) {
            return { success: false, error: 'Аккаунт деактивирован' };
        }
        
        const session = {
            userId: user.id,
            login: user.login,
            name: user.name,
            role: user.role,
            position: user.position,
            canViewStats: user.can_view_stats,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
        console.log('✅ Вход выполнен:', user.name);
        showToast(`Добро пожаловать, ${user.name}!`, 'success');
        return { success: true, user: session };
        
    } catch (error) {
        console.error('Ошибка:', error);
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

async function getAllReceipts() {
    const supabase = await waitForSupabase();
    if (!supabase) return [];
    
    const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) return [];
    return data || [];
}

async function saveReceipt(receiptData) {
    const supabase = await waitForSupabase();
    if (!supabase) throw new Error('Нет подключения');
    
    const { data, error } = await supabase
        .from('receipts')
        .insert([receiptData])
        .select();
    
    if (error) throw error;
    showToast('Расписка сохранена', 'success');
    return data[0];
}

async function getEmployeeReceipts(employeeLogin) {
    const supabase = await waitForSupabase();
    if (!supabase) return [];
    
    const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('employee_login', employeeLogin)
        .order('created_at', { ascending: false });
    
    if (error) return [];
    return data || [];
}

async function getEmployees() {
    const supabase = await waitForSupabase();
    if (!supabase) return [];
    
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin');
    
    if (error) return [];
    return data || [];
}

async function getAllUsers() {
    const supabase = await waitForSupabase();
    if (!supabase) return [];
    
    const { data, error } = await supabase
        .from('users')
        .select('*');
    
    if (error) return [];
    return data || [];
}

async function addEmployee(employeeData) {
    const supabase = await waitForSupabase();
    if (!supabase) return { success: false, error: 'Нет подключения' };
    
    const { error } = await supabase
        .from('users')
        .insert([{
            login: employeeData.login,
            password: employeeData.password,
            name: employeeData.name,
            role: employeeData.role || 'employee',
            position: employeeData.position,
            phone: employeeData.phone,
            is_active: true,
            can_view_stats: employeeData.role === 'manager' || employeeData.role === 'both'
        }]);
    
    if (error) return { success: false, error: error.message };
    showToast('Сотрудник добавлен', 'success');
    return { success: true };
}

async function updateEmployee(login, updates) {
    const supabase = await waitForSupabase();
    if (!supabase) return { success: false, error: 'Нет подключения' };
    
    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('login', login);
    
    if (error) return { success: false, error: error.message };
    showToast('Сотрудник обновлен', 'success');
    return { success: true };
}

async function deleteEmployee(login) {
    const supabase = await waitForSupabase();
    if (!supabase) return { success: false, error: 'Нет подключения' };
    
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('login', login);
    
    if (error) return { success: false, error: error.message };
    showToast('Сотрудник удален', 'success');
    return { success: true };
}

async function getSystemStats() {
    const users = await getAllUsers();
    const receipts = await getAllReceipts();
    
    const today = new Date().toDateString();
    const todayReceipts = receipts.filter(r => {
        const date = new Date(r.created_at);
        return date.toDateString() === today;
    });
    
    return {
        totalEmployees: users.filter(u => u.role !== 'admin').length,
        totalReceipts: receipts.length,
        todayReceipts: todayReceipts.length,
        activeUsers: users.filter(u => u.is_active).length,
        employeeStats: users.filter(u => u.role !== 'admin').map(u => ({
            name: u.name, receiptCount: u.receipt_count || 0, position: u.position, isActive: u.is_active
        })),
        specialtyStats: receipts.reduce((acc, r) => {
            acc[r.specialty] = (acc[r.specialty] || 0) + 1;
            return acc;
        }, {})
    };
}

async function getConfig() {
    const supabase = await waitForSupabase();
    if (!supabase) {
        return {
            documentTypes: ['Паспорт (копия)', 'Аттестат (копия)'],
            specialties: {},
            settings: { maxPhotosCount: 4, companyName: 'Приемная комиссия', companyPhone: '(499) 156-40-01' }
        };
    }
    
    const config = {
        documentTypes: [],
        specialties: {},
        settings: { maxPhotosCount: 4, companyName: 'Приемная комиссия', companyPhone: '(499) 156-40-01' }
    };
    
    // Загружаем специальности
    const { data: specialties } = await supabase
        .from('specialties')
        .select('*')
        .eq('active', true)
        .order('display_order');
    
    if (specialties) {
        specialties.forEach(s => {
            config.specialties[s.name] = {
                code: s.code,
                name: s.name,
                active: s.active,
                order: s.display_order
            };
        });
    }
    
    // Загружаем типы документов
    const { data: docs } = await supabase
        .from('document_types')
        .select('name')
        .eq('active', true);
    
    if (docs) {
        config.documentTypes = docs.map(d => d.name);
    }
    
    // Загружаем настройки
    const { data: settings } = await supabase
        .from('settings')
        .select('*');
    
    if (settings) {
        settings.forEach(s => {
            if (s.key === 'max_photos_count') config.settings.maxPhotosCount = parseInt(s.value);
            if (s.key === 'company_name') config.settings.companyName = s.value;
            if (s.key === 'company_phone') config.settings.companyPhone = s.value;
        });
    }
    
    return config;
}

function getReceiptCounter(specialtyCode) {
    const counters = JSON.parse(localStorage.getItem('receipt_system_counters') || '{}');
    const next = (counters[specialtyCode] || 0) + 1;
    counters[specialtyCode] = next;
    localStorage.setItem('receipt_system_counters', JSON.stringify(counters));
    return next;
}

// Экспорт
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
window.getReceiptCounter = getReceiptCounter;
window.showToast = showToast;

console.log('✅ auth.js загружен');