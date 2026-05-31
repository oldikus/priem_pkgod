// ========== АДМИН ПАНЕЛЬ ==========

const currentUser = checkAuth();
if (!currentUser || !(currentUser.role === 'admin' || currentUser.role === 'both')) {
    window.location.href = 'login.html';
}

document.getElementById('adminName').innerHTML = `${currentUser.name}`;

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tab}Tab`).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    
    if (tab === 'stats') loadStats();
    if (tab === 'employees') loadEmployees();
    if (tab === 'specialties') loadSpecialties();
    if (tab === 'documents') loadDocuments();
    if (tab === 'settings') loadSettings();
}

function loadStats() {
    const stats = getSystemStats();
    
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card"><div class="stat-value">${stats.totalEmployees}</div><div class="stat-label">Сотрудников</div></div>
        <div class="stat-card"><div class="stat-value">${stats.totalReceipts}</div><div class="stat-label">Всего расписок</div></div>
        <div class="stat-card"><div class="stat-value">${stats.todayReceipts}</div><div class="stat-label">Сегодня</div></div>
        <div class="stat-card"><div class="stat-value">${stats.activeUsers}</div><div class="stat-label">Активных</div></div>
    `;
    
    document.getElementById('employeeStatsBody').innerHTML = stats.employeeStats.map(emp => `
        <tr><td>${emp.name}</td><td>${emp.position || '-'}</td><td>${emp.receiptCount}</td><td><span class="status-badge ${emp.isActive ? 'status-active' : 'status-inactive'}">${emp.isActive ? 'Активен' : 'Неактивен'}</span></td></tr>
    `).join('');
    
    document.getElementById('specialtyStatsBody').innerHTML = Object.entries(stats.specialtyStats).map(([code, count]) => `
        <tr><td>${code}</td><td>-</td><td>${count}</td></tr>
    `).join('');
}

function loadEmployees() {
    const employees = getEmployees();
    document.getElementById('employeesList').innerHTML = employees.map(emp => `
        <tr>
            <td>${emp.name}</td><td>${emp.login}</td><td>${emp.position || '-'}</td>
            <td>${emp.role === 'both' ? 'Админ+Сотрудник' : (emp.role === 'manager' ? 'Руководитель' : 'Сотрудник')}</td>
            <td>${emp.receiptCount || 0}</td>
            <td><span class="status-badge ${emp.isActive ? 'status-active' : 'status-inactive'}">${emp.isActive ? 'Активен' : 'Неактивен'}</span></td>
            <td><button class="action-btn" onclick="editEmployee('${emp.login}')">✏️</button><button class="action-btn" onclick="deleteEmployeeConfirm('${emp.login}')">🗑️</button></td>
        </tr>
    `).join('');
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
    const users = getAllUsers();
    const emp = users.find(u => u.login === login);
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
    const editLogin = document.getElementById('editLogin').value;
    const login = document.getElementById('empLogin').value;
    const name = document.getElementById('empName').value;
    const password = document.getElementById('empPassword').value;
    const position = document.getElementById('empPosition').value;
    const phone = document.getElementById('empPhone').value;
    const role = document.getElementById('empRole').value;
    const isActive = document.getElementById('empStatus').value === 'true';
    
    if (!name || !login) {
        showToast('Заполните обязательные поля', 'error');
        return;
    }
    
    let result;
    if (editLogin) {
        const updates = { name, position, phone, role, isActive };
        if (password) updates.password = password;
        result = updateEmployee(editLogin, updates);
    } else {
        if (!password) { showToast('Введите пароль', 'error'); return; }
        result = addEmployee({ login, name, password, position, phone, role });
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
    if (confirm(`Удалить сотрудника ${login}?`)) {
        const result = deleteEmployee(login);
        if (result.success) {
            showToast('Сотрудник удалён', 'success');
            loadEmployees();
            loadStats();
        } else {
            showToast(result.error, 'error');
        }
    }
}

function closeEmployeeModal() { document.getElementById('employeeModal').style.display = 'none'; }

// ========== СПЕЦИАЛЬНОСТИ ==========
function loadSpecialties() {
    const config = getConfig();
    document.getElementById('specialtiesList').innerHTML = Object.entries(config.specialties)
        .sort((a, b) => (a[1].order || 999) - (b[1].order || 999))
        .map(([key, data]) => `
            <tr>
                <td>${data.code}</td><td>${key}</td>
                <td><input type="number" value="${data.order || 999}" style="width: 60px;" onchange="updateSpecialtyOrder('${key}', this.value)"></td>
                <td><span class="status-badge ${data.active !== false ? 'status-active' : 'status-inactive'}">${data.active !== false ? 'Активна' : 'Скрыта'}</span></td>
                <td><button class="action-btn" onclick="toggleSpecialty('${key}')">${data.active !== false ? '🔒' : '🔓'}</button><button class="action-btn" onclick="editSpecialty('${key}')">✏️</button><button class="action-btn" onclick="deleteSpecialty('${key}')">🗑️</button></td>
            </tr>
        `).join('');
}

function toggleSpecialty(key) {
    const config = getConfig();
    if (config.specialties[key]) {
        config.specialties[key].active = !config.specialties[key].active;
        saveConfig(config);
        loadSpecialties();
        showToast('Статус обновлён', 'success');
    }
}

function updateSpecialtyOrder(key, order) {
    const config = getConfig();
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
    const config = getConfig();
    const data = config.specialties[key];
    document.getElementById('specialtyModalTitle').textContent = 'Редактировать специальность';
    document.getElementById('editSpecialtyKey').value = key;
    document.getElementById('specialtyCode').value = data.code;
    document.getElementById('specialtyName').value = key;
    document.getElementById('specialtyOrder').value = data.order || 99;
    document.getElementById('specialtyModal').style.display = 'flex';
}

function saveSpecialty() {
    const oldKey = document.getElementById('editSpecialtyKey').value;
    const code = document.getElementById('specialtyCode').value;
    const name = document.getElementById('specialtyName').value;
    const order = parseInt(document.getElementById('specialtyOrder').value);
    
    if (!code || !name) { showToast('Заполните все поля', 'error'); return; }
    
    const config = getConfig();
    if (oldKey && oldKey !== name) delete config.specialties[oldKey];
    config.specialties[name] = { code, name: name.split(' ').slice(1).join(' ') || name, active: true, order };
    saveConfig(config);
    closeSpecialtyModal();
    loadSpecialties();
    showToast('Специальность сохранена', 'success');
}

function deleteSpecialty(key) {
    if (confirm('Удалить специальность?')) {
        const config = getConfig();
        delete config.specialties[key];
        saveConfig(config);
        loadSpecialties();
        showToast('Специальность удалена', 'success');
    }
}

function closeSpecialtyModal() { document.getElementById('specialtyModal').style.display = 'none'; }

// ========== ДОКУМЕНТЫ ==========
function loadDocuments() {
    const config = getConfig();
    document.getElementById('documentsList').innerHTML = config.documentTypes.map((doc, index) => `
        <tr>
            <td>${doc}</td>
            <td><button class="action-btn" onclick="editDocument(${index})">✏️</button><button class="action-btn" onclick="deleteDocument(${index})">🗑️</button></td>
        </tr>
    `).join('');
}

function openDocumentModal() {
    const newDoc = prompt('Введите название документа:');
    if (newDoc) {
        const config = getConfig();
        config.documentTypes.push(newDoc);
        saveConfig(config);
        loadDocuments();
        showToast('Документ добавлен', 'success');
    }
}

function editDocument(index) {
    const config = getConfig();
    const newName = prompt('Редактировать документ:', config.documentTypes[index]);
    if (newName) {
        config.documentTypes[index] = newName;
        saveConfig(config);
        loadDocuments();
        showToast('Документ обновлён', 'success');
    }
}

function deleteDocument(index) {
    if (confirm('Удалить документ?')) {
        const config = getConfig();
        config.documentTypes.splice(index, 1);
        saveConfig(config);
        loadDocuments();
        showToast('Документ удалён', 'success');
    }
}

// ========== НАСТРОЙКИ ==========
function loadSettings() {
    const config = getConfig();
    document.getElementById('maxPhotos').value = config.settings.maxPhotosCount || 4;
    document.getElementById('companyName').value = config.settings.companyName || 'Приемная комиссия';
    document.getElementById('companyPhone').value = config.settings.companyPhone || '(499) 156-40-01';
}

function saveSettings() {
    const config = getConfig();
    config.settings = {
        maxPhotosCount: parseInt(document.getElementById('maxPhotos').value),
        companyName: document.getElementById('companyName').value,
        companyPhone: document.getElementById('companyPhone').value
    };
    saveConfig(config);
    showToast('Настройки сохранены', 'success');
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = type === 'success' ? '#10b981' : '#ef4444';
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Инициализация
loadStats();

window.onclick = (event) => {
    if (event.target === document.getElementById('employeeModal')) closeEmployeeModal();
    if (event.target === document.getElementById('specialtyModal')) closeSpecialtyModal();
};