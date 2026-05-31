// auth.js (Supabase версия с отладкой)
const STORAGE_KEYS = {
    CURRENT_USER: 'receipt_system_current_user'
};

// Ждем загрузки Supabase
function waitForSupabase() {
    return new Promise((resolve) => {
        if (window.supabaseClient) {
            resolve(window.supabaseClient);
            return;
        }
        const checkInterval = setInterval(() => {
            if (window.supabaseClient) {
                clearInterval(checkInterval);
                resolve(window.supabaseClient);
            }
        }, 100);
        
        // Таймаут через 5 секунд
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error('❌ Таймаут: Supabase не загрузился');
            resolve(null);
        }, 5000);
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
    console.log('🔐 Попытка входа:', login);
    
    try {
        const supabase = await waitForSupabase();
        
        if (!supabase) {
            console.error('❌ Supabase не инициализирован');
            return { success: false, error: 'Ошибка подключения к базе данных' };
        }
        
        console.log('✅ Supabase готов');
        
        // Хешируем пароль
        const hashedPassword = await hashPassword(password);
        console.log('Пароль захэширован');
        
        // Ищем пользователя
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('login', login);
        
        if (error) {
            console.error('❌ Ошибка запроса:', error);
            return { success: false, error: 'Ошибка базы данных: ' + error.message };
        }
        
        console.log('Результат запроса:', users);
        
        if (!users || users.length === 0) {
            console.log('❌ Пользователь не найден');
            return { success: false, error: 'Пользователь не найден' };
        }
        
        const user = users[0];
        console.log('Найден пользователь:', user.login, user.role);
        
        // Проверка пароля
        let passwordValid = false;
        
        if (user.password === hashedPassword) {
            passwordValid = true;
            console.log('✅ Пароль верный (хеш)');
        } else if (user.password === password) {
            passwordValid = true;
            console.log('✅ Пароль верный (plain), обновляем...');
            // Обновляем пароль на хеш
            await supabase
                .from('users')
                .update({ password: hashedPassword })
                .eq('login', login);
        } else {
            console.log('❌ Неверный пароль');
        }
        
        if (!passwordValid) {
            return { success: false, error: 'Неверный пароль' };
        }
        
        if (!user.is_active) {
            console.log('❌ Аккаунт деактивирован');
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
        console.log('✅ Вход выполнен успешно');
        return { success: true, user: session };
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
        return { success: false, error: error.message };
    }
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.location.href = 'login.html';
}

function checkAuth() {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!user && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('login')) {
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
    const supabase = await waitForSupabase();
    if (!supabase) return [];
    
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
    const supabase = await waitForSupabase();
    if (!supabase) throw new Error('Supabase не инициализирован');
    
    const { data, error } = await supabase
        .from('receipts')
        .insert([receiptData])
        .select();
    
    if (error) throw error;
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
    if (!supabase) return { success: false, error: 'Supabase не инициализирован' };
    
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
    const supabase = await waitForSupabase();
    if (!supabase) return { success: false, error: 'Supabase не инициализирован' };
    
    if (updates.password) {
        updates.password = await hashPassword(updates.password);
    }
    
    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('login', login);
    
    if (error) return { success: false, error: error.message };
    return { success: true };
}

async function deleteEmployee(login) {
    const supabase = await waitForSupabase();
    if (!supabase) return { success: false, error: 'Supabase не инициализирован' };
    
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
    const supabase = await waitForSupabase();
    if (!supabase) {
        // Возвращаем стандартную конфигурацию
        return {
            documentTypes: ['Паспорт (копия)', 'Аттестат (копия)', 'СНИЛС (копия)', 'Фотография 3x4', 'Заявление'],
            specialties: {},
            settings: {
                maxPhotosCount: 4,
                companyName: 'Приемная комиссия',
                companyPhone: '(499) 156-40-01'
            }
        };
    }
    
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
    const { data: settings } = await supabase
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
    const supabase = await waitForSupabase();
    if (!supabase) return { success: false, error: 'Supabase не инициализирован' };
    
    const settings = [
        { key: 'max_photos_count', value: String(config.settings.maxPhotosCount) },
        { key: 'company_name', value: config.settings.companyName },
        { key: 'company_phone', value: config.settings.companyPhone }
    ];
    
    for (const setting of settings) {
        await supabase
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

// Функция для показа уведомлений
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '12px 20px';
    toast.style.backgroundColor = type === 'error' ? '#ef4444' : '#10b981';
    toast.style.color = 'white';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '10000';
    toast.style.fontSize = '14px';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
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
window.showToast = showToast;

console.log('✅ auth.js (Supabase version) загружен');