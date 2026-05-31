// ========== NETLIFY SERVERLESS FUNCTION ==========
// ДЛЯ ИСПОЛЬЗОВАНИЯ ЭТОЙ ФУНКЦИИ:
// 1. Установите Netlify CLI: npm install -g netlify-cli
// 2. Инициализируйте: netlify init
// 3. Задеплойте: netlify deploy --prod

// ВНИМАНИЕ: Эта функция требует настройки переменных окружения в Netlify:
// - GOOGLE_SERVICE_ACCOUNT_EMAIL
// - GOOGLE_PRIVATE_KEY
// - TEMPLATE_ID
// - FOLDER_ID

const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

// Конфигурация
const CONFIG = {
  templateId: process.env.TEMPLATE_ID || '1F908t3L5AHmjGTgAvZvKdlXAlWapzXd8WwbZ7ZgDKP4',
  folderId: process.env.FOLDER_ID || '19IHs1-jChYGxAm-YDD-6oizWbdjpQbZy',
  
  employees: [
    'Осокин Константин Вячеславович',
    'Цыганкова Юлия Игоревна', 
    'Воробьева Ирина Алексеевна',
    'Ханакова Анастасия Ивановна'
  ],
  
  specialties: {
    '24.02.01 Производство летательных аппаратов': 'ЛА',
    '24.02.02 Производство авиационных двигателей': 'ПД',
    '25.02.03 Техническая эксплуатация электрифицированных и пилотажно-навигационных комплексов': 'ТНК',
    '25.02.06 Производство и обслуживание авиационной техники': 'ПТА',
    '25.02.07 Техническое обслуживание авиационных двигателей': 'ТОД',
    '25.02.01 Техническая эксплуатация летательных аппаратов и двигателей': 'ТЭЛА',
    '25.02.08 Эксплуатация беспилотных авиационных систем': 'ЭБАС',
    '15.02.10 Мехатроника и робототехника (по отраслям)': 'МР',
    '15.02.18 Техническая эксплуатация и обслуживание роботизированного производства (по отраслям)': 'ТРП',
    '27.02.07 Управление качеством продукции, процессов и услуг (по отраслям)': 'УК',
    '43.02.06 Сервис на транспорте (по видам транспорта)': 'СТ',
    '40.02.04 Юриспруденция': 'ЮР'
  }
};

// Инициализация Google Auth
let auth = null;

async function getAuth() {
  if (!auth) {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!serviceAccountEmail || !privateKey) {
      throw new Error('Google Service Account credentials not configured');
    }
    
    auth = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents'
      ]
    });
  }
  return auth;
}

// Генерация номера расписки
function generateReceiptNumber(specialty, counters) {
  const code = CONFIG.specialties[specialty] || 'ОБЩ';
  const currentNumber = (counters[code] || 0) + 1;
  return `${code}-${currentNumber}`;
}

// Форматирование даты
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}

// Сокращение ФИО
function shortenName(fullName) {
  if (!fullName) return '';
  const parts = fullName.split(' ');
  if (parts.length >= 3) {
    return `${parts[0]} ${parts[1].charAt(0)}.${parts[2].charAt(0)}.`;
  }
  return fullName;
}

// Определение должности
function getEmployeePosition(employeeName) {
  if (!employeeName) return 'Специалист';
  if (employeeName.includes('Осокин')) return 'Ответственный секретарь';
  if (employeeName.includes('Цыганкова')) return 'Заместитель ответственного секретаря';
  return 'Специалист';
}

// Создание документа
async function createDocument(docId, replacements) {
  const auth = await getAuth();
  const docs = google.docs({ version: 'v1', auth });
  
  const requests = [];
  
  for (const [placeholder, value] of Object.entries(replacements)) {
    requests.push({
      replaceAllText: {
        containsText: {
          text: placeholder,
          matchCase: true
        },
        replaceText: value
      }
    });
  }
  
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests }
  });
}

// Копирование файла
async function copyFile(fileId, name, folderId) {
  const auth = await getAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  const response = await drive.files.copy({
    fileId: fileId,
    requestBody: {
      name: name,
      parents: [folderId]
    }
  });
  
  return response.data;
}

// Установка прав доступа
async function setFilePermissions(fileId) {
  const auth = await getAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      type: 'anyone',
      role: 'reader'
    }
  });
}

// Основная функция обработки
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  
  try {
    // Парсинг данных
    let requestData;
    if (event.body) {
      requestData = JSON.parse(event.body);
    } else {
      throw new Error('Нет данных');
    }
    
    // Извлечение данных
    const {
      fullName = '',
      specialty = '',
      diplomaNumber = '',
      diplomaDate = '',
      diplomaIssuedBy = '',
      documents = '',
      photosCount = 0,
      score = '',
      city = '',
      employee = CONFIG.employees[0]
    } = requestData;
    
    // Валидация
    if (!fullName) throw new Error('Не заполнено ФИО');
    if (!specialty) throw new Error('Не выбрана специальность');
    
    // Разделение ФИО
    const nameParts = fullName.trim().split(/\s+/);
    const lastName = nameParts[0] || '';
    const firstName = nameParts[1] || '';
    const middleName = nameParts[2] || '';
    
    // Генерация номера (в serverless нужно хранить счетчики в базе)
    const specialtyCode = CONFIG.specialties[specialty] || 'ОБЩ';
    const receiptNumber = `${specialtyCode}-${Date.now()}`; // Временный номер
    
    // Формирование данных для документа
    const now = new Date();
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    
    const replacements = {
      '{НОМЕР_РАСПИСКИ}': receiptNumber,
      '{ФИО_АБИТУРИЕНТА}': fullName,
      '{Фамилия}': lastName,
      '{Имя}': firstName,
      '{Отчество}': middleName,
      '{СПЕЦИАЛЬНОСТЬ}': specialty,
      '{НОМЕР_АТТЕСТАТА}': diplomaNumber || '',
      '{КЕМ_ВЫДАН}': diplomaIssuedBy || '',
      '{ДАТА_ВЫДАЧИ}': formatDate(diplomaDate),
      '{КОЛ_ФОТО}': photosCount.toString(),
      '{Балл}': score || 'не указан',
      '{Город}': city || 'не указан',
      '{ДЕНЬ}': now.getDate().toString(),
      '{МЕСЯЦ}': months[now.getMonth()],
      '{ГОД}': now.getFullYear().toString(),
      '{ДОЛЖНОСТЬ}': getEmployeePosition(employee),
      '{ФИО_СОТРУДНИКА}': shortenName(employee)
    };
    
    // Копирование шаблона
    const fileName = `Расписка_${receiptNumber}_${fullName.replace(/[^a-zа-яё]/gi, '_')}`;
    const copiedFile = await copyFile(CONFIG.templateId, fileName, CONFIG.folderId);
    
    // Заполнение документа
    await createDocument(copiedFile.id, replacements);
    
    // Установка прав
    await setFilePermissions(copiedFile.id);
    
    // Генерация PDF ссылки
    const pdfUrl = `https://docs.google.com/document/d/${copiedFile.id}/export?format=pdf`;
    const docUrl = `https://docs.google.com/document/d/${copiedFile.id}/edit`;
    
    // Успешный ответ
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        receiptNumber: receiptNumber,
        pdfUrl: pdfUrl,
        docUrl: docUrl,
        message: 'Расписка успешно создана'
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Внутренняя ошибка сервера'
      })
    };
  }
};