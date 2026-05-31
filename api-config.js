// ========== API КОНФИГУРАЦИЯ ==========

// Адреса API на Netlify
const API_BASE_URL = '/.netlify/functions';

// Эндпоинты API
const API_ENDPOINTS = {
    AUTH: `${API_BASE_URL}/auth`,
    RECEIPTS: `${API_BASE_URL}/receipts`,
    SPECIALTIES: `${API_BASE_URL}/specialties`,
    DOCUMENTS: `${API_BASE_URL}/documents`,
    EMPLOYEES: `${API_BASE_URL}/employees`,
    STATS: `${API_BASE_URL}/stats`,
    SETTINGS: `${API_BASE_URL}/settings`
};

// Функция для запросов к API
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    // Добавляем тело запроса для методов, которые его поддерживают
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(endpoint, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        return { success: false, error: error.message };
    }
}

// Специализированные функции
const API = {
    // ========== АВТОРИЗАЦИЯ ==========
    login: (login, password) => apiRequest(API_ENDPOINTS.AUTH, 'POST', { action: 'login', login, password }),
    register: (userData) => apiRequest(API_ENDPOINTS.AUTH, 'POST', { action: 'register', userData }),
    logout: () => {
        localStorage.removeItem('receipt_system_current_user');
        window.location.href = 'login.html';
    },
    getCurrentUser: () => {
        const user = localStorage.getItem('receipt_system_current_user');
        return user ? JSON.parse(user) : null;
    },
    
    // ========== РАСПИСКИ ==========
    createReceipt: (receiptData) => apiRequest(API_ENDPOINTS.RECEIPTS, 'POST', { action: 'create', receiptData }),
    getMyReceipts: (employeeLogin) => apiRequest(API_ENDPOINTS.RECEIPTS, 'POST', { action: 'getByEmployee', employeeLogin }),
    getAllReceipts: () => apiRequest(API_ENDPOINTS.RECEIPTS, 'GET', { action: 'getAll' }),
    getReceiptById: (receiptId) => apiRequest(API_ENDPOINTS.RECEIPTS, 'POST', { action: 'getById', receiptId }),
    
    // ========== СПЕЦИАЛЬНОСТИ ==========
    getSpecialties: () => apiRequest(API_ENDPOINTS.SPECIALTIES, 'GET'),
    getSpecialty: (code) => apiRequest(API_ENDPOINTS.SPECIALTIES, 'GET', { code }),
    addSpecialty: (code, name, displayOrder) => apiRequest(API_ENDPOINTS.SPECIALTIES, 'POST', { code, name, display_order: displayOrder }),
    updateSpecialty: (code, updates) => apiRequest(API_ENDPOINTS.SPECIALTIES, 'PUT', { code, updates }),
    deleteSpecialty: (code) => apiRequest(API_ENDPOINTS.SPECIALTIES, 'DELETE', { code }),
    
    // ========== ТИПЫ ДОКУМЕНТОВ ==========
    getDocuments: () => apiRequest(API_ENDPOINTS.DOCUMENTS, 'GET'),
    addDocument: (name) => apiRequest(API_ENDPOINTS.DOCUMENTS, 'POST', { name }),
    updateDocument: (oldName, newName) => apiRequest(API_ENDPOINTS.DOCUMENTS, 'PUT', { oldName, newName }),
    deleteDocument: (name) => apiRequest(API_ENDPOINTS.DOCUMENTS, 'DELETE', { name }),
    
    // ========== СОТРУДНИКИ ==========
    getEmployees: () => apiRequest(API_ENDPOINTS.EMPLOYEES, 'GET'),
    getEmployee: (login) => apiRequest(API_ENDPOINTS.EMPLOYEES, 'GET', { login }),
    addEmployee: (employee) => apiRequest(API_ENDPOINTS.EMPLOYEES, 'POST', employee),
    updateEmployee: (login, updates) => apiRequest(API_ENDPOINTS.EMPLOYEES, 'PUT', { login, updates }),
    deleteEmployee: (login) => apiRequest(API_ENDPOINTS.EMPLOYEES, 'DELETE', { login }),
    
    // ========== СТАТИСТИКА ==========
    getStats: () => apiRequest(API_ENDPOINTS.STATS, 'GET'),
    
    // ========== НАСТРОЙКИ ==========
    getSettings: () => apiRequest(API_ENDPOINTS.SETTINGS, 'GET'),
    updateSettings: (settings) => apiRequest(API_ENDPOINTS.SETTINGS, 'PUT', settings)
};

// Экспортируем (для ES модулей и CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, API_BASE_URL, API_ENDPOINTS };
}

// Также делаем глобальным для использования в HTML
if (typeof window !== 'undefined') {
    window.API = API;
    window.API_BASE_URL = API_BASE_URL;
}