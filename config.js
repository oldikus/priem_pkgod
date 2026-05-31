// ========== КОНФИГУРАЦИЯ СИСТЕМЫ ==========

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
  
  // Функции для работы с конфигурацией
  function getConfig() {
    const saved = localStorage.getItem('system_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        SYSTEM_CONFIG = { ...SYSTEM_CONFIG, ...parsed };
      } catch(e) {}
    }
    return SYSTEM_CONFIG;
  }
  
  function saveConfig(config) {
    SYSTEM_CONFIG = config;
    localStorage.setItem('system_config', JSON.stringify(config));
  }
  
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