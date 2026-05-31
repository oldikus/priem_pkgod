// netlify/functions/supabase-client.js
const { createClient } = require('@supabase/supabase-js');

// Переменные окружения автоматически подхватываются Netlify
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Проверка наличия переменных окружения
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Ошибка: SUPABASE_URL и SUPABASE_ANON_KEY должны быть установлены в переменных окружения Netlify');
    console.error('   Добавьте их в: Site settings → Environment variables');
}

// Создание клиента Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,  // Отключаем сохранение сессии на сервере
        autoRefreshToken: false
    }
});

// Проверка подключения (опционально)
async function checkConnection() {
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('✅ Supabase подключен успешно');
    } catch (error) {
        console.error('❌ Ошибка подключения к Supabase:', error.message);
    }
}

// Выполняем проверку при загрузке (не блокирует выполнение)
checkConnection();

module.exports = { supabase };