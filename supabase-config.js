
const SUPABASE_URL = 'https://hbuqzfyamthalvcjdmft.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidXF6ZnlhbXRoYWx2Y2pkbWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMDk5MjAsImV4cCI6MjA5NTc4NTkyMH0.h-ZOdYjYbd-eRlkhMAMoiX7aL7wyL7oXW3GPmMivoms';
// Создаем глобальную переменную
window.SUPABASE_CONFIG = { url: SUPABASE_URL, key: SUPABASE_ANON_KEY };

// Загружаем Supabase SDK
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
script.onload = () => {
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase подключен');
    console.log('📍 URL:', SUPABASE_URL);
};
document.head.appendChild(script);