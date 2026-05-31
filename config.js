// ========== КОНФИГУРАЦИЯ СИСТЕМЫ ==========

// API адрес для Netlify Functions
const API_BASE_URL = '/.netlify/functions';

let SYSTEM_CONFIG = {
    // Специальности
    specialties: {
      '24.02.01 Производство летательных аппаратов': {
        code: 'ЛА',
        name: 'Производство летательных аппаратов',
        active: true,
        order: 1
      },
      '24.02.02 Производство авиационных двигателей': {
        code: 'ПД',
        name: 'Производство авиационных двигателей',
        active: true,
        order: 2
      },
      '25.02.03 Техническая эксплуатация электрифицированных и пилотажно-навигационных комплексов': {
        code: 'ТНК',
        name: 'Техническая эксплуатация электрифицированных комплексов',
        active: true,
        order: 3
      },
      '25.02.06 Производство и обслуживание авиационной техники': {
        code: 'ПТА',
        name: 'Производство и обслуживание авиационной техники',
        active: true,
        order: 4
      },
      '25.02.07 Техническое обслуживание авиационных двигателей': {
        code: 'ТОД',
        name: 'Техническое обслуживание авиационных двигателей',
        active: true,
        order: 5
      },
      '25.02.01 Техническая эксплуатация летательных аппаратов и двигателей': {
        code: 'ТЭЛА',
        name: 'Техническая эксплуатация летательных аппаратов и двигателей',
        active: true,
        order: 6
      },
      '25.02.08 Эксплуатация беспилотных авиационных систем': {
        code: 'ЭБАС',
        name: 'Эксплуатация беспилотных авиационных систем',
        active: true,
        order: 7
      },
      '15.02.10 Мехатроника и робототехника (по отраслям)': {
        code: 'МР',
        name: 'Мехатроника и робототехника',
        active: true,
        order: 8
      },
      '15.02.18 Техническая эксплуатация и обслуживание роботизированного производства': {
        code: 'ТРП',
        name: 'Техническая эксплуатация роботизированного производства',
        active: true,
        order: 9
      },
      '27.02.07 Управление качеством продукции, процессов и услуг': {
        code: 'УК',
        name: 'Управление качеством',
        active: true,
        order: 10
      },
      '43.02.06 Сервис на транспорте (по видам транспорта)': {
        code: 'СТ',
        name: 'Сервис на транспорте',
        active: true,
        order: 11
      },
      '40.02.04 Юриспруденция': {
        code: 'ЮР',
        name: 'Юриспруденция',
        active: true,
        order: 12
      }
    },
    
    // Типы документов
    documentTypes: [
      'Заявление',
      'Аттестат/диплом (оригинал)',
      'Аттестат/диплом (копия)',
      'Фотокарточки (4 шт)',
      'Медицинская справка 086/у',
      'Медицинская справка 063/у',
      'Копия паспорта',
      'Копия мед.полиса',
      'Копия СНИЛС',
      'Другие документы'
    ],
    
    // Настройки системы
    settings: {
      maxPhotosCount: 4,
      requireDiplomaNumber: false,
      requireScore: false,
      receiptPrefix: 'РАС',
      companyName: 'Приемная комиссия',
      companyPhone: '(499) 156-40-01'
    }
  };
  
  // ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ЛОКАЛЬНЫМ ХРАНИЛИЩЕМ ==========
  
  function getConfig() {
    const saved = localStorage.getItem('system_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        SYSTEM_CONFIG = { ...SYSTEM_CONFIG, ...parsed };
      } catch(e) {
        console.warn('Ошибка парсинга сохранённой конфигурации');
      }
    }
    return SYSTEM_CONFIG;
  }
  
  function saveConfig(config) {
    SYSTEM_CONFIG = config;
    localStorage.setItem('system_config', JSON.stringify(config));
    // Асинхронно синхронизируем с сервером (не ждём результата)
    syncConfigToServer(config).catch(e => console.warn('Ошибка синхронизации:', e));
  }
  
  // ========== СИНХРОНИЗАЦИЯ С СЕРВЕРОМ (SUPABASE) ==========
  
  async function syncConfigToServer(config) {
    try {
      // Синхронизация настроек
      await fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'sync', 
          settings: config.settings 
        })
      });
      
      // Синхронизация специальностей
      await fetch(`${API_BASE_URL}/specialties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'sync', 
          specialties: config.specialties 
        })
      });
      
      // Синхронизация типов документов
      await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'sync', 
          documents: config.documentTypes 
        })
      });
      
      console.log('✅ Конфигурация синхронизирована с сервером');
    } catch (error) {
      console.warn('⚠️ Не удалось синхронизировать с сервером:', error);
    }
  }
  
  // ========== ЗАГРУЗКА КОНФИГУРАЦИИ С СЕРВЕРА ==========
  
  async function loadConfigFromServer() {
    try {
      // Загрузка настроек
      const settingsRes = await fetch(`${API_BASE_URL}/settings`);
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings) {
          SYSTEM_CONFIG.settings = { 
            ...SYSTEM_CONFIG.settings, 
            maxPhotosCount: settingsData.settings.max_photos || 4,
            companyName: settingsData.settings.company_name || SYSTEM_CONFIG.settings.companyName,
            companyPhone: settingsData.settings.company_phone || SYSTEM_CONFIG.settings.companyPhone
          };
        }
      }
      
      // Загрузка специальностей
      const specialtiesRes = await fetch(`${API_BASE_URL}/specialties`);
      if (specialtiesRes.ok) {
        const specialtiesData = await specialtiesRes.json();
        if (specialtiesData.success && specialtiesData.specialties) {
          const specialtiesObj = {};
          specialtiesData.specialties.forEach(s => {
            const fullName = s.full_name || s.name;
            specialtiesObj[fullName] = {
              code: s.code,
              name: s.name,
              active: s.active !== false,
              order: s.display_order || 999
            };
          });
          // Сохраняем только если есть данные
          if (Object.keys(specialtiesObj).length > 0) {
            SYSTEM_CONFIG.specialties = specialtiesObj;
          }
        }
      }
      
      // Загрузка типов документов
      const docsRes = await fetch(`${API_BASE_URL}/documents`);
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        if (docsData.success && docsData.documents && docsData.documents.length > 0) {
          SYSTEM_CONFIG.documentTypes = docsData.documents.map(d => d.name);
        }
      }
      
      // Сохраняем в localStorage
      localStorage.setItem('system_config', JSON.stringify(SYSTEM_CONFIG));
      console.log('✅ Конфигурация загружена с сервера');
      return SYSTEM_CONFIG;
    } catch (error) {
      console.warn('⚠️ Не удалось загрузить конфигурацию с сервера, используем локальную:', error);
      return SYSTEM_CONFIG;
    }
  }
  
  // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
  
  function getActiveSpecialties() {
    const config = getConfig();
    return Object.entries(config.specialties)
      .filter(([_, data]) => data.active)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([key, data]) => ({ value: key, label: `${data.code} - ${data.name}` }));
  }
  
  function getSpecialtyCode(specialtyName) {
    const config = getConfig();
    return config.specialties[specialtyName]?.code || 'ОБЩ';
  }
  
  function getDocumentTypes() {
    return getConfig().documentTypes;
  }
  
  // ========== АВТОМАТИЧЕСКАЯ ЗАГРУЗКА ПРИ СТАРТЕ ==========
  
  // Загружаем конфигурацию с сервера при загрузке страницы (асинхронно, не блокируем UI)
  if (typeof window !== 'undefined') {
    // Не ждём, загружаем в фоне
    loadConfigFromServer().catch(e => console.warn('Ошибка загрузки конфигурации:', e));
  }
  
  // Делаем функции глобальными для использования в HTML
  if (typeof window !== 'undefined') {
    window.getConfig = getConfig;
    window.saveConfig = saveConfig;
    window.getActiveSpecialties = getActiveSpecialties;
    window.getSpecialtyCode = getSpecialtyCode;
    window.getDocumentTypes = getDocumentTypes;
    window.loadConfigFromServer = loadConfigFromServer;
  }
  
  console.log('✅ config.js загружен');