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
      '15.02.18 Техническая эксплуатация и обслуживание роботизированного производства (по отраслям)': {
          code: 'ТРП',
          name: 'Техническая эксплуатация роботизированного производства',
          active: true,
          order: 9
      },
      '27.02.07 Управление качеством продукции, процессов и услуг (по отраслям)': {
          code: 'УК',
          name: 'Управление качеством продукции, процессов и услуг (по отраслям)',
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

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С КОНФИГУРАЦИЕЙ ==========

function getConfig() {
  const saved = localStorage.getItem('system_config');
  if (saved) {
      try {
          const parsed = JSON.parse(saved);
          // Глубокое слияние
          SYSTEM_CONFIG = {
              specialties: { ...SYSTEM_CONFIG.specialties, ...(parsed.specialties || {}) },
              documentTypes: parsed.documentTypes || SYSTEM_CONFIG.documentTypes,
              settings: { ...SYSTEM_CONFIG.settings, ...(parsed.settings || {}) }
          };
      } catch (e) {
          console.warn('Ошибка парсинга конфигурации');
      }
  }
  return SYSTEM_CONFIG;
}

function saveConfig(config) {
  SYSTEM_CONFIG = config;
  localStorage.setItem('system_config', JSON.stringify(config));
  console.log('✅ Конфигурация сохранена');
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function getActiveSpecialties() {
  const config = getConfig();
  return Object.entries(config.specialties)
      .filter(([_, data]) => data.active)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([key, data]) => ({
          value: key,
          label: `${data.code} - ${data.name}`,
          code: data.code
      }));
}

function getSpecialtyCode(specialtyName) {
  const config = getConfig();
  return config.specialties[specialtyName]?.code || 'ОБЩ';
}

function getDocumentTypes() {
  return getConfig().documentTypes;
}

function getSpecialtyByCode(code) {
  const config = getConfig();
  for (const [name, data] of Object.entries(config.specialties)) {
      if (data.code === code) return name;
  }
  return null;
}

function updateSpecialty(name, data) {
  const config = getConfig();
  config.specialties[name] = { ...config.specialties[name], ...data };
  saveConfig(config);
}

function addDocumentType(doc) {
  const config = getConfig();
  if (!config.documentTypes.includes(doc)) {
      config.documentTypes.push(doc);
      saveConfig(config);
  }
}

function removeDocumentType(doc) {
  const config = getConfig();
  const index = config.documentTypes.indexOf(doc);
  if (index !== -1) {
      config.documentTypes.splice(index, 1);
      saveConfig(config);
  }
}

// ========== ЭКСПОРТ ДЛЯ ГЛОБАЛЬНОГО ИСПОЛЬЗОВАНИЯ ==========
if (typeof window !== 'undefined') {
  window.getConfig = getConfig;
  window.saveConfig = saveConfig;
  window.getActiveSpecialties = getActiveSpecialties;
  window.getSpecialtyCode = getSpecialtyCode;
  window.getDocumentTypes = getDocumentTypes;
  window.getSpecialtyByCode = getSpecialtyByCode;
  window.updateSpecialty = updateSpecialty;
  window.addDocumentType = addDocumentType;
  window.removeDocumentType = removeDocumentType;
}

console.log('✅ config.js загружен');