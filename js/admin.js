// ========== АДМИН ПАНЕЛЬ ==========

const currentUser = checkAuth();
if (!currentUser || !(currentUser.role === 'admin' || currentUser.role === 'both')) {
    window.location.href = 'login.html';
}

document.getElementById('adminName').innerHTML = currentUser.name;

function switchTab(tab) {
    var tabs = document.querySelectorAll('.tab-content');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    document.getElementById(tab + 'Tab').classList.add('active');
    
    var btns = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
    }
    if (event && event.target) event.target.classList.add('active');
    
    if (tab === 'stats') loadStats();
    if (tab === 'employees') loadEmployees();
    if (tab === 'specialties') loadSpecialties();
    if (tab === 'documents') loadDocuments();
    if (tab === 'counters') loadCounters();
    if (tab === 'settings') loadSettings();
    if (tab === 'backup') loadBackupInfo();
}

// ========== СТАТИСТИКА ==========
function loadStats() {
    var stats = getSystemStats();
    
    document.getElementById('statsGrid').innerHTML = 
        '<div class="stat-card"><div class="stat-value">' + (stats.totalEmployees || 0) + '</div><div class="stat-label">Сотрудников</div></div>' +
        '<div class="stat-card"><div class="stat-value">' + (stats.totalReceipts || 0) + '</div><div class="stat-label">Всего расписок</div></div>' +
        '<div class="stat-card"><div class="stat-value">' + (stats.todayReceipts || 0) + '</div><div class="stat-label">Сегодня</div></div>' +
        '<div class="stat-card"><div class="stat-value">' + (stats.activeUsers || 0) + '</div><div class="stat-label">Активных</div></div>';
    
    document.getElementById('employeeStatsBody').innerHTML = (stats.employeeStats || []).map(function(emp) {
        return '<tr><td>' + emp.name + '</td><td>' + (emp.position || '-') + '</td><td>' + (emp.receiptCount || 0) + '</td><td><span class="status-badge ' + (emp.isActive ? 'status-active' : 'status-inactive') + '">' + (emp.isActive ? 'Активен' : 'Неактивен') + '</span></td></tr>';
    }).join('');
    
    document.getElementById('specialtyStatsBody').innerHTML = Object.entries(stats.specialtyStats || {}).map(function(item) {
        return '<tr><td>' + item[0] + '</td><td>-</td><td>' + item[1] + '</td></tr>';
    }).join('');
}

// ========== СОТРУДНИКИ ==========
function loadEmployees() {
    var employees = getEmployees();
    document.getElementById('employeesList').innerHTML = employees.map(function(emp) {
        var roleText = '';
        if (emp.role === 'both') roleText = 'Админ+Сотрудник';
        else if (emp.role === 'manager') roleText = 'Руководитель';
        else roleText = 'Сотрудник';
        return '<tr>' +
            '<td>' + emp.name + '</td>' +
            '<td>' + emp.login + '</td>' +
            '<td>' + (emp.position || '-') + '</td>' +
            '<td>' + roleText + '</td>' +
            '<td>' + (emp.receiptCount || 0) + '</td>' +
            '<td><span class="status-badge ' + (emp.isActive ? 'status-active' : 'status-inactive') + '">' + (emp.isActive ? 'Активен' : 'Неактивен') + '</span></td>' +
            '<td><button class="action-btn" onclick="editEmployee(\'' + emp.login + '\')">✏️</button><button class="action-btn" onclick="deleteEmployeeConfirm(\'' + emp.login + '\')">🗑️</button></td>' +
            '</tr>';
    }).join('');
}

function openEmployeeModal() {
    document.getElementById('employeeModalTitle').textContent = 'Добавить сотрудника';
    document.getElementById('editLogin').value = '';
    document.getElementById('empName').value = '';
    document.getElementById('empLogin').value = '';
    document.getElementById('empPassword').value = '';
    document.getElementById('empPosition').value = '';
    document.getElementById('empPhone').value = '';
    document.getElementById('empRole').value = 'employee';
    document.getElementById('empStatus').value = 'true';
    document.getElementById('employeeModal').style.display = 'flex';
}

function editEmployee(login) {
    var users = getAllUsers();
    var emp = null;
    for (var i = 0; i < users.length; i++) {
        if (users[i].login === login) { emp = users[i]; break; }
    }
    if (!emp) return;
    
    document.getElementById('employeeModalTitle').textContent = 'Редактировать сотрудника';
    document.getElementById('editLogin').value = emp.login;
    document.getElementById('empName').value = emp.name;
    document.getElementById('empLogin').value = emp.login;
    document.getElementById('empPassword').value = '';
    document.getElementById('empPosition').value = emp.position || '';
    document.getElementById('empPhone').value = emp.phone || '';
    document.getElementById('empRole').value = emp.role || 'employee';
    document.getElementById('empStatus').value = emp.isActive ? 'true' : 'false';
    document.getElementById('employeeModal').style.display = 'flex';
}

function saveEmployee() {
    var editLogin = document.getElementById('editLogin').value;
    var login = document.getElementById('empLogin').value;
    var name = document.getElementById('empName').value;
    var password = document.getElementById('empPassword').value;
    var position = document.getElementById('empPosition').value;
    var phone = document.getElementById('empPhone').value;
    var role = document.getElementById('empRole').value;
    var isActive = document.getElementById('empStatus').value === 'true';
    
    if (!name || !login) {
        showToast('Заполните обязательные поля', 'error');
        return;
    }
    
    var result;
    if (editLogin) {
        var updates = { name: name, position: position, phone: phone, role: role, isActive: isActive };
        if (password) updates.password = password;
        result = updateEmployee(editLogin, updates);
    } else {
        if (!password) { showToast('Введите пароль', 'error'); return; }
        result = addEmployee({ login: login, name: name, password: password, position: position, phone: phone, role: role });
    }
    
    if (result.success) {
        showToast(editLogin ? 'Сотрудник обновлён' : 'Сотрудник добавлен', 'success');
        closeEmployeeModal();
        loadEmployees();
        loadStats();
    } else {
        showToast(result.error, 'error');
    }
}

function deleteEmployeeConfirm(login) {
    if (confirm('Удалить сотрудника ' + login + '?')) {
        var result = deleteEmployee(login);
        if (result.success) {
            showToast('Сотрудник удалён', 'success');
            loadEmployees();
            loadStats();
        } else {
            showToast(result.error, 'error');
        }
    }
}

function closeEmployeeModal() { 
    document.getElementById('employeeModal').style.display = 'none'; 
}

// ========== СПЕЦИАЛЬНОСТИ ==========
function loadSpecialties() {
    var config = getConfig();
    var entries = Object.entries(config.specialties);
    entries.sort(function(a, b) { return (a[1].order || 999) - (b[1].order || 999); });
    
    document.getElementById('specialtiesList').innerHTML = entries.map(function(item) {
        var key = item[0];
        var data = item[1];
        return '<tr>' +
            '<td>' + data.code + '</td>' +
            '<td>' + key + '</td>' +
            '<td><input type="number" value="' + (data.order || 999) + '" style="width:60px" onchange="updateSpecialtyOrder(\'' + key.replace(/'/g, "\\'") + '\', this.value)"></td>' +
            '<td><span class="status-badge ' + (data.active !== false ? 'status-active' : 'status-inactive') + '">' + (data.active !== false ? 'Активна' : 'Скрыта') + '</span></td>' +
            '<td><button class="action-btn" onclick="toggleSpecialty(\'' + key.replace(/'/g, "\\'") + '\')">' + (data.active !== false ? '🔒' : '🔓') + '</button><button class="action-btn" onclick="editSpecialty(\'' + key.replace(/'/g, "\\'") + '\')">✏️</button><button class="action-btn" onclick="deleteSpecialty(\'' + key.replace(/'/g, "\\'") + '\')">🗑️</button></td>' +
            '</tr>';
    }).join('');
}

function toggleSpecialty(key) {
    var config = getConfig();
    if (config.specialties[key]) {
        config.specialties[key].active = !config.specialties[key].active;
        saveConfig(config);
        loadSpecialties();
        showToast('Статус обновлён', 'success');
    }
}

function updateSpecialtyOrder(key, order) {
    var config = getConfig();
    if (config.specialties[key]) {
        config.specialties[key].order = parseInt(order);
        saveConfig(config);
        loadSpecialties();
        showToast('Порядок обновлён', 'success');
    }
}

function openSpecialtyModal() {
    document.getElementById('specialtyModalTitle').textContent = 'Добавить специальность';
    document.getElementById('editSpecialtyKey').value = '';
    document.getElementById('specialtyCode').value = '';
    document.getElementById('specialtyName').value = '';
    document.getElementById('specialtyOrder').value = '99';
    document.getElementById('specialtyModal').style.display = 'flex';
}

function editSpecialty(key) {
    var config = getConfig();
    var data = config.specialties[key];
    document.getElementById('specialtyModalTitle').textContent = 'Редактировать специальность';
    document.getElementById('editSpecialtyKey').value = key;
    document.getElementById('specialtyCode').value = data.code;
    document.getElementById('specialtyName').value = key;
    document.getElementById('specialtyOrder').value = data.order || 99;
    document.getElementById('specialtyModal').style.display = 'flex';
}

function saveSpecialty() {
    var oldKey = document.getElementById('editSpecialtyKey').value;
    var code = document.getElementById('specialtyCode').value;
    var name = document.getElementById('specialtyName').value;
    var order = parseInt(document.getElementById('specialtyOrder').value);
    
    if (!code || !name) { showToast('Заполните все поля', 'error'); return; }
    
    var config = getConfig();
    if (oldKey && oldKey !== name) delete config.specialties[oldKey];
    config.specialties[name] = { code: code, name: name.split(' ').slice(1).join(' ') || name, active: true, order: order };
    saveConfig(config);
    closeSpecialtyModal();
    loadSpecialties();
    showToast('Специальность сохранена', 'success');
}

function deleteSpecialty(key) {
    if (confirm('Удалить специальность?')) {
        var config = getConfig();
        delete config.specialties[key];
        saveConfig(config);
        loadSpecialties();
        showToast('Специальность удалена', 'success');
    }
}

function closeSpecialtyModal() { 
    document.getElementById('specialtyModal').style.display = 'none'; 
}

// ========== ДОКУМЕНТЫ ==========
function loadDocuments() {
    var config = getConfig();
    document.getElementById('documentsList').innerHTML = config.documentTypes.map(function(doc, index) {
        return '<tr><td>' + doc + '</td><td><button class="action-btn" onclick="editDocument(' + index + ')">✏️</button><button class="action-btn" onclick="deleteDocument(' + index + ')">🗑️</button></td></tr>';
    }).join('');
}

function openDocumentModal() {
    var newDoc = prompt('Введите название документа:');
    if (newDoc) {
        var config = getConfig();
        config.documentTypes.push(newDoc);
        saveConfig(config);
        loadDocuments();
        showToast('Документ добавлен', 'success');
    }
}

function editDocument(index) {
    var config = getConfig();
    var newName = prompt('Редактировать документ:', config.documentTypes[index]);
    if (newName) {
        config.documentTypes[index] = newName;
        saveConfig(config);
        loadDocuments();
        showToast('Документ обновлён', 'success');
    }
}

function deleteDocument(index) {
    if (confirm('Удалить документ?')) {
        var config = getConfig();
        config.documentTypes.splice(index, 1);
        saveConfig(config);
        loadDocuments();
        showToast('Документ удалён', 'success');
    }
}

// ========== НУМЕРАЦИЯ РАСПИСОК ==========
function loadCounters() {
    var counters = JSON.parse(localStorage.getItem('receipt_system_counters') || '{}');
    var config = getConfig();
    var entries = Object.entries(config.specialties);
    
    document.getElementById('countersList').innerHTML = entries.map(function(item) {
        var name = item[0];
        var data = item[1];
        var current = counters[data.code] || 0;
        return '<tr>' +
            '<td>' + data.code + '</td>' +
            '<td>' + name.substring(0, 40) + '...</td>' +
            '<td>' + current + '</td>' +
            '<td><input type="number" id="newCounter_' + data.code + '" value="' + current + '" style="width:80px"></td>' +
            '<td><button class="action-btn" onclick="updateCounter(\'' + data.code + '\')">Установить</button><button class="action-btn" onclick="resetCounter(\'' + data.code + '\')">Сбросить</button></td>' +
            '</tr>';
    }).join('');
}

function updateCounter(code) {
    var newVal = parseInt(document.getElementById('newCounter_' + code).value) || 0;
    var counters = JSON.parse(localStorage.getItem('receipt_system_counters') || '{}');
    counters[code] = newVal;
    localStorage.setItem('receipt_system_counters', JSON.stringify(counters));
    showToast('Счётчик ' + code + ' установлен на ' + newVal, 'success');
    loadCounters();
}

function resetCounter(code) {
    if (confirm('Сбросить счётчик ' + code + ' в 0?')) {
        var counters = JSON.parse(localStorage.getItem('receipt_system_counters') || '{}');
        counters[code] = 0;
        localStorage.setItem('receipt_system_counters', JSON.stringify(counters));
        showToast('Счётчик ' + code + ' сброшен', 'success');
        loadCounters();
    }
}

function resetAllCounters() {
    if (confirm('Сбросить ВСЕ счётчики расписок в 0?')) {
        localStorage.setItem('receipt_system_counters', JSON.stringify({}));
        showToast('Все счётчики сброшены', 'success');
        loadCounters();
    }
}

// ========== НАСТРОЙКИ ==========
function loadSettings() {
    var config = getConfig();
    var maxPhotos = document.getElementById('maxPhotos');
    var companyName = document.getElementById('companyName');
    var companyPhone = document.getElementById('companyPhone');
    if (maxPhotos) maxPhotos.value = config.settings.maxPhotosCount || 4;
    if (companyName) companyName.value = config.settings.companyName || 'Приемная комиссия';
    if (companyPhone) companyPhone.value = config.settings.companyPhone || '(499) 156-40-01';
}

function saveSettings() {
    var config = getConfig();
    config.settings = {
        maxPhotosCount: parseInt(document.getElementById('maxPhotos').value),
        companyName: document.getElementById('companyName').value,
        companyPhone: document.getElementById('companyPhone').value
    };
    saveConfig(config);
    showToast('Настройки сохранены', 'success');
}

// ========== РЕЗЕРВНОЕ КОПИРОВАНИЕ ==========
function loadBackupInfo() {
    var infoDiv = document.getElementById('backupInfo');
    if (infoDiv) {
        infoDiv.innerHTML = '<p>📁 Последнее резервное копирование: ' + (localStorage.getItem('last_backup_date') || 'не выполнялось') + '</p>' +
            '<p style="margin-top: 8px;">💡 Совет: регулярно создавайте резервные копии для безопасности данных.</p>';
    }
}

function backupData() {
    var backup = {
        users: JSON.parse(localStorage.getItem('receipt_system_users') || '{}'),
        receipts: JSON.parse(localStorage.getItem('receipt_system_receipts') || '[]'),
        counters: JSON.parse(localStorage.getItem('receipt_system_counters') || '{}'),
        config: getConfig(),
        date: new Date().toISOString()
    };
    var blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'backup_' + new Date().toISOString().slice(0,19) + '.json';
    link.click();
    localStorage.setItem('last_backup_date', new Date().toLocaleString());
    loadBackupInfo();
    showToast('Резервная копия создана', 'success');
}

function restoreData() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function(ev) {
            try {
                var backup = JSON.parse(ev.target.result);
                if (backup.users) localStorage.setItem('receipt_system_users', JSON.stringify(backup.users));
                if (backup.receipts) localStorage.setItem('receipt_system_receipts', JSON.stringify(backup.receipts));
                if (backup.counters) localStorage.setItem('receipt_system_counters', JSON.stringify(backup.counters));
                if (backup.config) saveConfig(backup.config);
                showToast('Данные восстановлены', 'success');
                setTimeout(function() { location.reload(); }, 1000);
            } catch(err) { 
                showToast('Ошибка при восстановлении', 'error'); 
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function exportToExcel() {
    var receipts = getAllReceipts();
    var data = receipts.map(function(r) {
        return {
            'ФИО': r.fullName,
            'Специальность': r.specialty,
            'Баллы ГИА': r.score,
            'Номер аттестата': r.diplomaNumber,
            'Дата выдачи': r.diplomaDate,
            'Сотрудник': r.employee,
            'Дата создания': new Date(r.createdAt).toLocaleString()
        };
    });
    var ws = XLSX.utils.json_to_sheet(data);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Расписки');
    XLSX.writeFile(wb, 'export_' + new Date().toISOString().slice(0,10) + '.xlsx');
    showToast('Экспорт выполнен', 'success');
}

function importFromExcel() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls, .csv';
    input.onchange = function(e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function(ev) {
            var data = new Uint8Array(ev.target.result);
            var workbook = XLSX.read(data, { type: 'array' });
            var sheet = workbook.Sheets[workbook.SheetNames[0]];
            var rows = XLSX.utils.sheet_to_json(sheet);
            var receipts = getAllReceipts();
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                if (row['ФИО'] && row['Специальность']) {
                    receipts.push({
                        id: 'receipt_' + Date.now() + Math.random(),
                        fullName: row['ФИО'],
                        specialty: row['Специальность'],
                        score: row['Баллы ГИА'] || '',
                        diplomaNumber: row['Номер аттестата'] || '',
                        diplomaDate: row['Дата выдачи'] || '',
                        employee: currentUser.name,
                        employeeLogin: currentUser.login,
                        employeePosition: currentUser.position,
                        createdAt: new Date().toISOString()
                    });
                }
            }
            localStorage.setItem('receipt_system_receipts', JSON.stringify(receipts));
            showToast('Данные импортированы', 'success');
            setTimeout(function() { location.reload(); }, 1000);
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========
function showToast(message, type) {
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = type === 'success' ? '#10b981' : '#ef4444';
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
}

// Инициализация
loadStats();

window.onclick = function(event) {
    var empModal = document.getElementById('employeeModal');
    var specModal = document.getElementById('specialtyModal');
    if (event.target === empModal) closeEmployeeModal();
    if (event.target === specModal) closeSpecialtyModal();
};