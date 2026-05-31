// auth.js (Supabase версия без import)
const STORAGE_KEYS = {
    CURRENT_USER: 'receipt_system_current_user'
};

// Ждем загрузки Supabase
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
    });
}

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
        await waitForSupabase();
        
        // Хешируем пароль
        const hashedPassword = await hashPassword(password);
        
        // Ищем пользователя
        const { data: users, error } = await window.supabase
            .from('users')
            .select('*')
            .eq('login', login);
        
        if (error) throw error;
        
        if (!users || users.length === 0) {
            return { success: false, error: 'Пользователь не найден' };
        }
        
        const user = users[0];
        
        // Проверка пароля (сравниваем с хешем)
        let passwordValid = false;
        
        if (user.password === hashedPassword) {
            passwordValid = true;
        } else if (user.password === password) {
            // Для обратной совместимости с plain паролями
            passwordValid = true;
            // Обновляем пароль на хеш
            await window.supabase
                .from('users')
                .update({ password: hashedPassword })
                .eq('login', login);
        }
        
        if (!passwordValid) {
            return { success: false, error: 'Неверный пароль' };
        }
        
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
        console.error('Login error:', error);
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
    await waitForSupabase();
    
    const { data, error } = await window.supabase
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
    await waitForSupabase();
    
    const { data, error } = await window.supabase
        .from('receipts')
        .insert([receiptData])
        .select();
    
    if (error) throw error;
    return data[0];
}

async function getEmployeeReceipts(employeeLogin) {
    await waitForSupabase();
    
    const { data, error } = await window.supabase
        .from('receipts')
        .select('*')
        .eq('employee_login', employeeLogin)
        .order('created_at', { ascending: false });
    
    if (error) return [];
    return data || [];
}

async function getEmployees() {
    await waitForSupabase();
    
    const { data, error } = await window.supabase
        .from('users')
        .select('*')
        .neq('role', 'admin');
    
    if (error) return [];
    return data || [];
}

async function getAllUsers() {
    await waitForSupabase();
    
    const { data, error } = await window.supabase
        .from('users')
        .select('*');
    
    if (error) return [];
    return data || [];
}

async function addEmployee(employeeData) {
    await waitForSupabase();
    
    const hashedPassword = await hashPassword(employeeData.password);
    
    const { data, error } = await window.supabase
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
    await waitForSupabase();
    
    // Если обновляем пароль, хешируем его
    if (updates.password) {
        updates.password = await hashPassword(updates.password);
    }
    
    const { data, error } = await window.supabase
        .from('users')
        .update(updates)
        .eq('login', login);
    
    if (error) return { success: false, error: error.message };
    return { success: true };
}

async function deleteEmployee(login) {
    await waitForSupabase();
    
    const { error } = await window.supabase
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
    await waitForSupabase();
    
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
    const { data: specialties } = await window.supabase
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
    const { data: docs } = await window.supabase
        .from('document_types')
        .select('name')
        .eq('active', true);
    
    if (docs) {
        config.documentTypes = docs.map(d => d.name);
    }
    
    // Загружаем настройки
    const { data: settings } = await window.supabase
        .from('settings')
        .select('*');
    
    if (settings) {
        settings.forEach(setting => {
            if (setting.key === 'max_photos_count') config.settings.maxPhotosCount = parseInt(setting.value);
            if (setting.key === 'company_name') config.settings.companyName = setting.value;
            if (setting.key === 'company_phone') config.settings.companyPhone = setting.value;
        });
    }
    
    return config;
}

async function saveConfig(config) {
    await waitForSupabase();
    
    // Сохраняем настройки
    const settings = [
        { key: 'max_photos_count', value: String(config.settings.maxPhotosCount) },
        { key: 'company_name', value: config.settings.companyName },
        { key: 'company_phone', value: config.settings.companyPhone }
    ];
    
    for (const setting of settings) {
        await window.supabase
            .from('settings')
            .upsert(setting, { onConflict: 'key' });
    }
    
    return { success: true };
}

function getReceiptCounter(specialtyCode) {
    const counters = JSON.parse(localStorage.getItem('receipt_system_counters') || '{}');
    const current = counters[specialtyCode] || 0;
    counters[specialtyCode] = current + 1;
    localStorage.setItem('receipt_system_counters', JSON.stringify(counters));
    return current + 1;
}

// Сохраняем функции в глобальный объект window
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

console.log('✅ auth.js (Supabase version) загружен');