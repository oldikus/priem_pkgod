// auth.js (Supabase версия)
const STORAGE_KEYS = {
    CURRENT_USER: 'receipt_system_current_user'
};

// Хеширование пароля
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Вход через Supabase
async function login(login, password) {
    try {
        // Сначала хешируем пароль (как в БД)
        const hashedPassword = await hashPassword(password);
        
        // Ищем пользователя
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('login', login)
            .eq('password', hashedPassword);
        
        if (error) throw error;
        
        if (!users || users.length === 0) {
            // Пробуем с plain паролем (для существующих данных)
            const { data: plainUsers } = await supabase
                .from('users')
                .select('*')
                .eq('login', login)
                .eq('password', password);
            
            if (!plainUsers || plainUsers.length === 0) {
                return { success: false, error: 'Неверный логин или пароль' };
            }
            users = plainUsers;
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

// ========== РАБОТА С ДАННЫМИ ==========

async function getAllReceipts() {
    const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Ошибка получения расписок:', error);
        return [];
    }
    return data || [];
}

async function saveReceipt(receiptData) {
    const { data, error } = await supabase
        .from('receipts')
        .insert([receiptData])
        .select();
    
    if (error) throw error;
    return data[0];
}

async function getEmployeeReceipts(employeeLogin) {
    const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('employee_login', employeeLogin)
        .order('created_at', { ascending: false });
    
    if (error) return [];
    return data || [];
}

async function getEmployees() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin');
    
    if (error) return [];
    return data || [];
}

async function getAllUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('*');
    
    if (error) return [];
    return data || [];
}

async function addEmployee(employeeData) {
    const hashedPassword = await hashPassword(employeeData.password);
    
    const { data, error } = await supabase
        .from('users')
        .insert([{
            login: employeeData.login,
            password: hashedPassword,
            name: employeeData.name,
            role: employeeData.role || 'employee',
            position: employeeData.position,
            phone: employeeData.phone,
            is_active: true,
            can_view_stats: employeeData.role === 'manager' || employeeData.role === 'both'
        }])
        .select();
    
    if (error) return { success: false, error: error.message };
    return { success: true, user: data[0] };
}

async function updateEmployee(login, updates) {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('login', login);
    
    if (error) return { success: false, error: error.message };
    return { success: true };
}

async function deleteEmployee(login) {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('login', login);
    
    if (error) return { success: false, error: error.message };
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
    
    const employeeStats = users
        .filter(u => u.role !== 'admin')
        .map(u => ({
            name: u.name,
            login: u.login,
            receiptCount: u.receipt_count || 0,
            position: u.position,
            isActive: u.is_active
        }));
    
    const specialtyStats = {};
    receipts.forEach(r => {
        const spec = r.specialty;
        if (!specialtyStats[spec]) specialtyStats[spec] = 0;
        specialtyStats[spec]++;
    });
    
    return {
        totalEmployees: users.filter(u => u.role !== 'admin').length,
        totalReceipts: receipts.length,
        todayReceipts: todayReceipts.length,
        activeUsers: users.filter(u => u.is_active).length,
        employeeStats,
        specialtyStats
    };
}

async function getConfig() {
    const { data, error } = await supabase
        .from('settings')
        .select('*');
    
    if (error) return {};
    
    const config = {
        documentTypes: [],
        specialties: {},
        settings: {
            maxPhotosCount: 4,
            companyName: 'Приемная комиссия',
            companyPhone: '(499) 156-40-01'
        }
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
    if (data) {
        data.forEach(setting => {
            if (setting.key === 'max_photos_count') config.settings.maxPhotosCount = parseInt(setting.value);
            if (setting.key === 'company_name') config.settings.companyName = setting.value;
            if (setting.key === 'company_phone') config.settings.companyPhone = setting.value;
        });
    }
    
    return config;
}

function getReceiptCounter(specialtyCode) {
    // Получаем счётчик из localStorage (можно перенести в БД)
    const counters = JSON.parse(localStorage.getItem('receipt_system_counters') || '{}');
    const current = counters[specialtyCode] || 0;
    counters[specialtyCode] = current + 1;
    localStorage.setItem('receipt_system_counters', JSON.stringify(counters));
    return current + 1;
}

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
window.getConfig = getConfig;
window.getReceiptCounter = getReceiptCounter;

console.log('✅ auth.js (Supabase version) загружен');