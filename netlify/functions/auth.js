const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    try {
        const { action, login, password, userData } = JSON.parse(event.body);

        // Логин
        if (action === 'login') {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('login', login)
                .single();

            if (error || !user) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Пользователь не найден' })
                };
            }

            if (!user.is_active) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Аккаунт деактивирован' })
                };
            }

            if (user.password !== hashPassword(password)) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Неверный пароль' })
                };
            }

            const session = {
                userId: user.id,
                login: user.login,
                name: user.name,
                role: user.role,
                position: user.position,
                canViewStats: user.can_view_stats
            };

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, user: session })
            };
        }

        // Регистрация нового сотрудника
        if (action === 'register') {
            const { data: existing } = await supabase
                .from('users')
                .select('login')
                .eq('login', userData.login)
                .single();

            if (existing) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Логин уже существует' })
                };
            }

            const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                    login: userData.login,
                    password: hashPassword(userData.password),
                    name: userData.name,
                    role: userData.role || 'employee',
                    position: userData.position,
                    phone: userData.phone,
                    can_view_stats: userData.canViewStats || false
                })
                .select()
                .single();

            if (error) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: false, error: error.message })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, user: newUser })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: false, error: 'Неизвестное действие' })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};