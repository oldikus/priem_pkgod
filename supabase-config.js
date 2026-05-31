
    const SUPABASE_URL = 'https://hbuqzfyamthalvcjdmft.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidXF6ZnlhbXRoYWx2Y2pkbWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMDk5MjAsImV4cCI6MjA5NTc4NTkyMH0.h-ZOdYjYbd-eRlkhMAMoiX7aL7wyL7oXW3GPmMivoms';
// Загружаем Supabase SDK
function initSupabase() {
    if (window.supabase && window.supabase.createClient) {
        window._supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase инициализирован');
        
        // Создаем глобальную переменную
        window.supabaseClient = window._supabase;
        
        // Проверяем подключение
        testConnection();
    }
}

// Тест подключения
async function testConnection() {
    try {
        const { data, error } = await window.supabaseClient
            .from('users')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('❌ Ошибка подключения к Supabase:', error);
        } else {
            console.log('✅ Supabase подключен успешно');
        }
    } catch (e) {
        console.error('❌ Ошибка:', e);
    }
}

// Загружаем SDK
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
script.onload = () => {
    console.log('📦 Supabase SDK загружен');
    initSupabase();
};
document.head.appendChild(script);

// Ждем готовности
window.waitForSupabase = function() {
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
        
        // Таймаут через 10 секунд
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error('❌ Таймаут ожидания Supabase');
            resolve(null);
        }, 10000);
    });
};