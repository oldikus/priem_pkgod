// supabase-config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/esm/wrapper.mjs';

// ВСТАВЬТЕ ВАШИ ДАННЫЕ ИЗ PROJECT SETTINGS → API
const supabaseUrl = 'https://hbuqzfyamthalvcjdmft.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidXF6ZnlhbXRoYWx2Y2pkbWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMDk5MjAsImV4cCI6MjA5NTc4NTkyMH0.h-ZOdYjYbd-eRlkhMAMoiX7aL7wyL7oXW3GPmMivoms';

// Создаем клиент Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Экспортируем для использования в других файлах
window.supabase = supabase;

console.log('✅ Supabase подключен');