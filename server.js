const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// ==================== ПОЛЬЗОВАТЕЛИ ====================
app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE login = $1 AND password = $2 AND is_active = true',
            [login, password]
        );
        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({
                success: true,
                user: {
                    id: user.id, login: user.login, name: user.name,
                    role: user.role, position: user.position, phone: user.phone,
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

app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, login, name, role, position, phone, is_active, can_view_stats, receipt_count FROM users ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.post('/api/users', async (req, res) => {
    const { login, password, name, role, position, phone } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (login, password, name, role, position, phone, is_active, can_view_stats) VALUES ($1, $2, $3, $4, $5, $6, true, $7) RETURNING *',
            [login, password, name, role || 'employee', position || '', phone || '', role === 'manager' || role === 'both']
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.put('/api/users/:login', async (req, res) => {
    const { login } = req.params;
    const { name, role, position, phone, is_active, password } = req.body;
    try {
        let query = 'UPDATE users SET name = $1, role = $2, position = $3, phone = $4, is_active = $5';
        let params = [name, role, position, phone, is_active];
        if (password) {
            query += ', password = $6';
            params.push(password);
        }
        query += ' WHERE login = $' + (params.length + 1) + ' RETURNING *';
        params.push(login);
        const result = await pool.query(query, params);
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.delete('/api/users/:login', async (req, res) => {
    const { login } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE login = $1', [login]);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// ==================== СПЕЦИАЛЬНОСТИ ====================
app.get('/api/specialties', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM specialties WHERE active = true ORDER BY display_order');
        res.json(result.rows);
    } catch (err) {
        res.json([]);
    }
});

// ==================== ТИПЫ ДОКУМЕНТОВ ====================
app.get('/api/document-types', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM document_types WHERE active = true ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.json([]);
    }
});

// ==================== РАСПИСКИ ====================
app.get('/api/receipts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM receipts ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.json([]);
    }
});

app.post('/api/receipts', async (req, res) => {
    const { receipt_number, full_name, specialty, specialty_code, score, documents, employee, employee_login, employee_position } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO receipts (receipt_number, full_name, specialty, specialty_code, score, documents, employee, employee_login, employee_position, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
            [receipt_number, full_name, specialty, specialty_code, score, documents, employee, employee_login, employee_position]
        );
        await pool.query('UPDATE users SET receipt_count = receipt_count + 1 WHERE login = $1', [employee_login]);
        await pool.query(
            'INSERT INTO counters (specialty_code, current_number) VALUES ($1, 1) ON CONFLICT (specialty_code) DO UPDATE SET current_number = counters.current_number + 1',
            [specialty_code]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/receipts/employee/:login', async (req, res) => {
    const { login } = req.params;
    try {
        const result = await pool.query('SELECT * FROM receipts WHERE employee_login = $1 ORDER BY created_at DESC', [login]);
        res.json(result.rows);
    } catch (err) {
        res.json([]);
    }
});

// ==================== СТАТИСТИКА ====================
app.get('/api/stats', async (req, res) => {
    try {
        const users = await pool.query('SELECT * FROM users');
        const receipts = await pool.query('SELECT * FROM receipts');
        const today = new Date().toDateString();
        const todayReceipts = receipts.rows.filter(r => new Date(r.created_at).toDateString() === today);
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

// ==================== НАСТРОЙКИ ====================
app.get('/api/settings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM settings');
        const settings = {};
        result.rows.forEach(row => { settings[row.key] = row.value; });
        res.json(settings);
    } catch (err) {
        res.json({});
    }
});

// ==================== СЧЕТЧИКИ ====================
app.get('/api/counter/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const result = await pool.query('SELECT current_number FROM counters WHERE specialty_code = $1', [code]);
        const current = result.rows.length > 0 ? result.rows[0].current_number : 0;
        const next = current + 1;
        await pool.query(
            'INSERT INTO counters (specialty_code, current_number) VALUES ($1, $2) ON CONFLICT (specialty_code) DO UPDATE SET current_number = $2',
            [code, next]
        );
        res.json({ number: next });
    } catch (err) {
        res.json({ number: 1 });
    }
});

// ==================== КОНФИГ ====================
app.get('/api/config', async (req, res) => {
    try {
        const [specialties, docTypes, settings] = await Promise.all([
            pool.query('SELECT * FROM specialties WHERE active = true ORDER BY display_order'),
            pool.query('SELECT * FROM document_types WHERE active = true'),
            pool.query('SELECT * FROM settings')
        ]);
        const specialtiesMap = {};
        specialties.rows.forEach(s => {
            specialtiesMap[s.full_name || s.name] = {
                code: s.code, name: s.name, active: s.active, order: s.display_order
            };
        });
        const settingsObj = {};
        settings.rows.forEach(s => { settingsObj[s.key] = s.value; });
        res.json({
            documentTypes: docTypes.rows.map(d => d.name),
            specialties: specialtiesMap,
            settings: {
                maxPhotosCount: parseInt(settingsObj.max_photos_count) || 4,
                companyName: settingsObj.company_name || 'Приемная комиссия',
                companyPhone: settingsObj.company_phone || '(499) 156-40-01'
            }
        });
    } catch (err) {
        res.json({
            documentTypes: ['Заявление', 'Аттестат', 'Копия паспорта', 'Копия СНИЛС', 'Фотокарточки (4 шт)'],
            specialties: {},
            settings: { maxPhotosCount: 4, companyName: 'Приемная комиссия', companyPhone: '(499) 156-40-01' }
        });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});