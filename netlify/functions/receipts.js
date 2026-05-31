const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    try {
        // Проверяем наличие body
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Отсутствуют данные' })
            };
        }

        const { action, receiptData, employeeLogin, receiptId } = JSON.parse(event.body);

        // ========== СОЗДАНИЕ РАСПИСКИ ==========
        if (action === 'create') {
            // Проверка обязательных полей
            if (!receiptData || !receiptData.fullName || !receiptData.specialtyCode) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Не заполнены обязательные поля' })
                };
            }

            // Получаем счётчик для специальности
            const { data: counterData, error: counterError } = await supabase
                .from('receipt_counters')
                .select('counter')
                .eq('specialty_code', receiptData.specialtyCode)
                .single();

            let counter = 1;
            if (counterData) {
                counter = counterData.counter + 1;
                await supabase
                    .from('receipt_counters')
                    .update({ counter, updated_at: new Date() })
                    .eq('specialty_code', receiptData.specialtyCode);
            } else {
                await supabase
                    .from('receipt_counters')
                    .insert({ 
                        specialty_code: receiptData.specialtyCode, 
                        counter: 1,
                        updated_at: new Date()
                    });
            }

            const receiptNumber = `${receiptData.specialtyCode}-${counter}`;

            // Вставка расписки
            const { data: newReceipt, error: insertError } = await supabase
                .from('receipts')
                .insert({
                    receipt_number: receiptNumber,
                    student_name: receiptData.fullName,
                    specialty_code: receiptData.specialtyCode,
                    diploma_number: receiptData.diplomaNumber || '',
                    diploma_date: receiptData.diplomaDate || null,
                    diploma_issued_by: receiptData.diplomaIssuedBy || '',
                    documents: receiptData.documents || '',
                    photos_count: parseInt(receiptData.photosCount) || 0,
                    score: receiptData.score || '',
                    city: receiptData.city || '',
                    employee_login: receiptData.employeeLogin,
                    employee_name: receiptData.employee,
                    employee_position: receiptData.employeePosition
                })
                .select()
                .single();

            if (insertError) {
                console.error('Ошибка вставки:', insertError);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: false, error: insertError.message })
                };
            }

            // Обновляем счётчик сотрудника (если функция существует)
            try {
                await supabase.rpc('increment_receipt_count', { user_login: receiptData.employeeLogin });
            } catch (rpcError) {
                console.warn('RPC функция не найдена, пропускаем:', rpcError.message);
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    receipt: newReceipt,
                    receiptNumber: receiptNumber
                })
            };
        }

        // ========== ПОЛУЧЕНИЕ РАСПИСОК СОТРУДНИКА ==========
        if (action === 'getByEmployee') {
            if (!employeeLogin) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Не указан сотрудник' })
                };
            }

            const { data: receipts, error } = await supabase
                .from('receipts')
                .select('*')
                .eq('employee_login', employeeLogin)
                .order('created_at', { ascending: false });

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
                body: JSON.stringify({ success: true, receipts: receipts || [] })
            };
        }

        // ========== ПОЛУЧЕНИЕ ВСЕХ РАСПИСОК (ДЛЯ АДМИНА) ==========
        if (action === 'getAll') {
            const { data: receipts, error } = await supabase
                .from('receipts')
                .select('*')
                .order('created_at', { ascending: false });

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
                body: JSON.stringify({ success: true, receipts: receipts || [] })
            };
        }

        // ========== ПОЛУЧЕНИЕ РАСПИСКИ ПО ID ==========
        if (action === 'getById') {
            if (!receiptId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Не указан ID расписки' })
                };
            }

            const { data: receipt, error } = await supabase
                .from('receipts')
                .select('*')
                .eq('id', receiptId)
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
                body: JSON.stringify({ success: true, receipt })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: false, error: 'Неизвестное действие' })
        };

    } catch (error) {
        console.error('Ошибка receipts.js:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};