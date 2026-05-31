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

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С КОНФИГУРАЦИЕЙ ==========

function getConfig() {
  var saved = localStorage.getItem('system_config');
  if (saved) {
      try {
          var parsed = JSON.parse(saved);
          SYSTEM_CONFIG = {
              specialties: Object.assign({}, SYSTEM_CONFIG.specialties, parsed.specialties || {}),
              documentTypes: parsed.documentTypes || SYSTEM_CONFIG.documentTypes,
              settings: Object.assign({}, SYSTEM_CONFIG.settings, parsed.settings || {})
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
  var config = getConfig();
  var entries = Object.entries(config.specialties);
  var filtered = [];
  for (var i = 0; i < entries.length; i++) {
      var item = entries[i];
      if (item[1].active) {
          filtered.push(item);
      }
  }
  filtered.sort(function(a, b) { return a[1].order - b[1].order; });
  return filtered.map(function(item) {
      return {
          value: item[0],
          label: item[1].code + ' - ' + item[1].name,
          code: item[1].code
      };
  });
}

function getSpecialtyCode(specialtyName) {
  var config = getConfig();
  var spec = config.specialties[specialtyName];
  return spec ? spec.code : 'ОБЩ';
}

function getDocumentTypes() {
  return getConfig().documentTypes;
}

function getSpecialtyByCode(code) {
  var config = getConfig();
  var entries = Object.entries(config.specialties);
  for (var i = 0; i < entries.length; i++) {
      var name = entries[i][0];
      var data = entries[i][1];
      if (data.code === code) {
          return name;
      }
  }
  return null;
}

function getSpecialtyNameByCode(code) {
  var config = getConfig();
  var entries = Object.entries(config.specialties);
  for (var i = 0; i < entries.length; i++) {
      var data = entries[i][1];
      if (data.code === code) {
          return data.name;
      }
  }
  return null;
}

function getAllSpecialties() {
  var config = getConfig();
  var entries = Object.entries(config.specialties);
  entries.sort(function(a, b) { return a[1].order - b[1].order; });
  return entries.map(function(item) {
      return {
          fullName: item[0],
          code: item[1].code,
          name: item[1].name,
          active: item[1].active,
          order: item[1].order
      };
  });
}

function updateSpecialty(fullName, data) {
  var config = getConfig();
  if (config.specialties[fullName]) {
      config.specialties[fullName] = Object.assign({}, config.specialties[fullName], data);
      saveConfig(config);
      return true;
  }
  return false;
}

function addSpecialty(fullName, code, name, order) {
  var config = getConfig();
  if (config.specialties[fullName]) {
      return false;
  }
  config.specialties[fullName] = {
      code: code,
      name: name,
      active: true,
      order: order || 99
  };
  saveConfig(config);
  return true;
}

function removeSpecialty(fullName) {
  var config = getConfig();
  if (config.specialties[fullName]) {
      delete config.specialties[fullName];
      saveConfig(config);
      return true;
  }
  return false;
}

function addDocumentType(doc) {
  var config = getConfig();
  if (config.documentTypes.indexOf(doc) === -1) {
      config.documentTypes.push(doc);
      saveConfig(config);
      return true;
  }
  return false;
}

function removeDocumentType(doc) {
  var config = getConfig();
  var index = config.documentTypes.indexOf(doc);
  if (index !== -1) {
      config.documentTypes.splice(index, 1);
      saveConfig(config);
      return true;
  }
  return false;
}

function updateDocumentType(oldName, newName) {
  var config = getConfig();
  var index = config.documentTypes.indexOf(oldName);
  if (index !== -1) {
      config.documentTypes[index] = newName;
      saveConfig(config);
      return true;
  }
  return false;
}

function getSystemSettings() {
  return getConfig().settings;
}

function updateSystemSettings(settings) {
  var config = getConfig();
  config.settings = Object.assign({}, config.settings, settings);
  saveConfig(config);
  return true;
}

// ========== ЭКСПОРТ ДЛЯ ГЛОБАЛЬНОГО ИСПОЛЬЗОВАНИЯ ==========
if (typeof window !== 'undefined') {
  window.getConfig = getConfig;
  window.saveConfig = saveConfig;
  window.getActiveSpecialties = getActiveSpecialties;
  window.getSpecialtyCode = getSpecialtyCode;
  window.getDocumentTypes = getDocumentTypes;
  window.getSpecialtyByCode = getSpecialtyByCode;
  window.getSpecialtyNameByCode = getSpecialtyNameByCode;
  window.getAllSpecialties = getAllSpecialties;
  window.updateSpecialty = updateSpecialty;
  window.addSpecialty = addSpecialty;
  window.removeSpecialty = removeSpecialty;
  window.addDocumentType = addDocumentType;
  window.removeDocumentType = removeDocumentType;
  window.updateDocumentType = updateDocumentType;
  window.getSystemSettings = getSystemSettings;
  window.updateSystemSettings = updateSystemSettings;
}

console.log('✅ config.js загружен');