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

// Вход
app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE login = $1 AND password = $2',
            [login, password]
        );
        if (result.rows.length > 0) {
            const user = result.rows[0];
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
            res.json({ success: false, error: 'Неверный логин или пароль' });
        }
    } catch (err) {
        res.json({ success: false, error: err.message });
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
        
        const today = new Date().toDateString();
        const todayReceipts = receipts.rows.filter(r => {
            const date = new Date(r.created_at);
            return date.toDateString() === today;
        });
        
        res.json({
            totalEmployees: users.rows.filter(u => u.role !== 'admin').length,
            totalReceipts: receipts.rows.length,
            todayReceipts: todayReceipts.length,
            activeUsers: users.rows.filter(u => u.is_active).length
        });
    } catch (err) {
        res.json({ totalEmployees: 0, totalReceipts: 0, todayReceipts: 0, activeUsers: 0 });
    }
});

// Все остальные запросы отдаем index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Открыть: https://priem-pkgod.up.railway.app`);
});