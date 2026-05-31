// supabase-config.js (без import)
// Ждем загрузки Supabase SDK
function initSupabase() {
    const supabaseUrl = 'https://hbuqzfyamthalvcjdmft.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidXF6ZnlhbXRoYWx2Y2pkbWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMDk5MjAsImV4cCI6MjA5NTc4NTkyMH0.h-ZOdYjYbd-eRlkhMAMoiX7aL7wyL7oXW3GPmMivoms';

    window.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase инициализирован');
}

// Ждем загрузки Supabase SDK из CDN
function loadSupabaseSDK() {
return new Promise((resolve) => {
    if (window.supabase && window.supabase.createClient) {
        initSupabase();
        resolve();
        return;
    }
    
    // Ждем загрузки скрипта
    const checkInterval = setInterval(() => {
        if (window.supabase && window.supabase.createClient) {
            clearInterval(checkInterval);
            initSupabase();
            resolve();
        }
    }, 100);
});
}

// Загружаем SDK
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
script.onload = () => loadSupabaseSDK();
document.head.appendChild(script);