const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к БД
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// ========== API ЭНДПОИНТЫ ==========

// Вход (с отладкой)
app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    console.log('🔐 Попытка входа:', login, password);
    
    try {
        // Проверяем подключение к БД
        const testQuery = await pool.query('SELECT NOW()');
        console.log('✅ БД подключена:', testQuery.rows[0]);
        
        // Ищем пользователя
        const result = await pool.query(
            'SELECT * FROM users WHERE login = $1 AND password = $2',
            [login, password]
        );
        
        console.log('📊 Результат запроса:', result.rows.length, 'пользователей');
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('✅ Пользователь найден:', user.login, user.role);
            
            res.json({
                success: true,
                user: {
                    id: user.id,
                    login: user.login,
                    name: user.name,
                    role: user.role,
                    position: user.position,
                    canViewStats: user.can_view_stats
                }
            });
        } else {
            console.log('❌ Пользователь не найден');
            res.json({ success: false, error: 'Неверный логин или пароль' });
        }
    } catch (err) {
        console.error('❌ Ошибка:', err.message);
        res.json({ success: false, error: 'Ошибка сервера: ' + err.message });
    }
});

// Получить все расписки
app.get('/api/receipts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM receipts ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.json([]);
    }
});

// Сохранить расписку
app.post('/api/receipts', async (req, res) => {
    const { receipt_number, full_name, specialty, specialty_code, score, documents, employee, employee_login, employee_position } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO receipts (receipt_number, full_name, specialty, specialty_code, score, documents, employee, employee_login, employee_position, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
            [receipt_number, full_name, specialty, specialty_code, score, documents, employee, employee_login, employee_position]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить сотрудников
app.get('/api/employees', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE role != 'admin'");
        res.json(result.rows);
    } catch (err) {
        res.json([]);
    }
});

// Статистика
app.get('/api/stats', async (req, res) => {
    try {
        const users = await pool.query("SELECT * FROM users");
        const receipts = await pool.query("SELECT * FROM receipts");
        
        res.json({
            totalEmployees: users.rows.filter(u => u.role !== 'admin').length,
            totalReceipts: receipts.rows.length,
            todayReceipts: receipts.rows.filter(r => {
                const date = new Date(r.created_at);
                return date.toDateString() === new Date().toDateString();
            }).length,
            activeUsers: users.rows.filter(u => u.is_active).length
        });
    } catch (err) {
        res.json({ totalEmployees: 0, totalReceipts: 0, todayReceipts: 0, activeUsers: 0 });
    }
});

// Создание таблиц при запуске
async function initDB() {
    try {
        console.log('📦 Инициализация базы данных...');
        
        // Таблица пользователей
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                login TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT DEFAULT 'employee',
                position TEXT,
                phone TEXT,
                is_active BOOLEAN DEFAULT true,
                can_view_stats BOOLEAN DEFAULT false,
                receipt_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Таблица users создана/проверена');
        
        // Таблица расписок
        await pool.query(`
            CREATE TABLE IF NOT EXISTS receipts (
                id SERIAL PRIMARY KEY,
                receipt_number TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                specialty TEXT NOT NULL,
                specialty_code TEXT,
                score TEXT,
                diploma_number TEXT,
                diploma_date DATE,
                documents TEXT,
                photos_count INTEGER DEFAULT 0,
                employee TEXT NOT NULL,
                employee_login TEXT NOT NULL,
                employee_position TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Таблица receipts создана/проверена');
        
        // Добавляем пользователей если нет
        const checkUsers = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(checkUsers.rows[0].count) === 0) {
            console.log('📝 Добавляем пользователей...');
            await pool.query(`
                INSERT INTO users (login, password, name, role, position, phone, is_active, can_view_stats) VALUES
                ('admin', 'admin123', 'Главный Администратор', 'admin', 'Главный администратор', '+7 (499) 156-40-01', true, true),
                ('osokin', '123456', 'Осокин Олег Олегович', 'manager', 'Ответственный секретарь', '', true, true),
                ('tsygankova', '123456', 'Цыганкова Наталья Александровна', 'manager', 'Зам. ответственного секретаря', '', true, true),
                ('vorobyeva', '123456', 'Воробьева Виктория Валерьевна', 'employee', 'Специалист', '', true, false),
                ('khanakova', '123456', 'Ханакова Татьяна Михайловна', 'employee', 'Специалист', '', true, false)
                ON CONFLICT (login) DO NOTHING
            `);
            console.log('✅ Пользователи добавлены');
        }
        
        console.log('✅ База данных готова!');
    } catch (err) {
        console.error('❌ Ошибка инициализации БД:', err.message);
    }
}

// Запуск инициализации
initDB();

// Все остальные запросы отдаем index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Слушаем на всех интерфейсах
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Открыть: https://priem-pkgod.up.railway.app`);
});