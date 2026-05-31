// ========== АДМИН ПАНЕЛЬ ==========

const API_BASE_URL = '/.netlify/functions';

const currentUser = checkAuth();
if (!currentUser || !(currentUser.role === 'admin' || currentUser.role === 'both')) {
    window.location.href = 'login.html';
}

document.getElementById('adminName').innerHTML = `👑 ${currentUser.name}`;

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

// ========== СТАТИСТИКА ==========
async function loadStats() {
    try {
        document.getElementById('statsContainer').innerHTML = '<div class="stat-card"><div class="stat-value">Загрузка...</div></div>';
        
        const response = await fetch(`${API_BASE_URL}/stats`);
        const result = await response.json();
        
        if (result.success) {
            const stats = result.stats;
            
            document.getElementById('statsContainer').innerHTML = `
                <div class="stat-card"><div class="stat-label">👥 Сотрудников</div><div class="stat-value">${stats.totalEmployees || 0}</div></div>
                <div class="stat-card"><div class="stat-label">📄 Всего расписок</div><div class="stat-value">${stats.totalReceipts || 0}</div></div>
                <div class="stat-card"><div class="stat-label">📅 Сегодня</div><div class="stat-value">${stats.todayReceipts || 0}</div></div>
                <div class="stat-card"><div class="stat-label">🟢 Активных</div><div class="stat-value">${stats.activeUsers || 0}</div></div>
            `;
            
            if (stats.employeeStats && stats.employeeStats.length) {
                document.getElementById('employeeStatsBody').innerHTML = stats.employeeStats.map(emp => `
                    <tr>
                        <td>${emp.name}</td>
                        <td>${emp.position || '-'}</td>
                        <td>${emp.receiptCount || 0}</td>
                        <td><span class="status-badge ${emp.isActive ? 'status-active' : 'status-inactive'}">${emp.isActive ? 'Активен' : 'Неактивен'}</span></td>
                    </tr>
                `).join('');
            }
            
            if (stats.specialtyStats) {
                document.getElementById('specialtyStatsBody').innerHTML = Object.entries(stats.specialtyStats).map(([code, count]) => `
                    <tr><td>${code}</td><td>-</td><td>${count}</td></tr>
                `).join('');
            }
        } else {
            showToast('Ошибка загрузки статистики', 'error');
        }
    } catch (error) {
        showToast('Ошибка соединения с сервером', 'error');
    }
}

// ========== УПРАВЛЕНИЕ СОТРУДНИКАМИ ==========
async function loadEmployees() {
    try {
        const response = await fetch(`${API_BASE_URL}/employees`);
        const result = await response.json();
        
        if (result.success && result.employees) {
            const employees = result.employees;
            const tbody = document.getElementById('employeesList');
            
            tbody.innerHTML = employees.map(emp => `
                <tr>
                    <td>${emp.name}</td>
                    <td>${emp.login}</td>
                    <td>${emp.position || '-'}</td>
                    <td>${emp.role === 'admin' ? 'Админ' : (emp.role === 'both' ? 'Админ+Сотрудник' : 'Сотрудник')}</td>
                    <td>${emp.can_view_stats ? '✅ Да' : '❌ Нет'}</td>
                    <td><span class="status-badge ${emp.is_active ? 'status-active' : 'status-inactive'}">${emp.is_active ? 'Активен' : 'Неактивен'}</span></td>
                    <td>
                        <button class="action-btn" onclick="editEmployee('${emp.login}')">✏️</button>
                        <button class="action-btn" onclick="deleteEmployeeConfirm('${emp.login}')">🗑️</button>
                    </td>
                </tr>
            `).join('');
        } else {
            showToast('Ошибка загрузки сотрудников', 'error');
        }
    } catch (error) {
        showToast('Ошибка соединения с сервером', 'error');
    }
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
    document.getElementById('empCanViewStats').value = 'false';
    document.getElementById('empStatus').value = 'true';
    document.getElementById('employeeModal').style.display = 'flex';
}

async function editEmployee(login) {
    try {
        const response = await fetch(`${API_BASE_URL}/employees?login=${login}`);
        const result = await response.json();
        
        if (result.success && result.employee) {
            const emp = result.employee;
            document.getElementById('employeeModalTitle').textContent = 'Редактировать сотрудника';
            document.getElementById('editLogin').value = emp.login;
            document.getElementById('empName').value = emp.name;
            document.getElementById('empLogin').value = emp.login;
            document.getElementById('empPassword').value = '';
            document.getElementById('empPosition').value = emp.position || '';
            document.getElementById('empPhone').value = emp.phone || '';
            document.getElementById('empRole').value = emp.role || 'employee';
            document.getElementById('empCanViewStats').value = emp.can_view_stats ? 'true' : 'false';
            document.getElementById('empStatus').value = emp.is_active ? 'true' : 'false';
            document.getElementById('employeeModal').style.display = 'flex';
        }
    } catch (error) {
        showToast('Ошибка загрузки данных сотрудника', 'error');
    }
}

async function saveEmployee() {
    const editLogin = document.getElementById('editLogin').value;
    const login = document.getElementById('empLogin').value;
    const name = document.getElementById('empName').value;
    const password = document.getElementById('empPassword').value;
    const position = document.getElementById('empPosition').value;
    const phone = document.getElementById('empPhone').value;
    const role = document.getElementById('empRole').value;
    const canViewStats = document.getElementById('empCanViewStats').value === 'true';
    const isActive = document.getElementById('empStatus').value === 'true';
    
    if (!name || !login) {
        showToast('Заполните обязательные поля', 'error');
        return;
    }
    
    try {
        let response;
        if (editLogin) {
            response = await fetch(`${API_BASE_URL}/employees`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    login: editLogin, 
                    updates: { name, position, phone, role, can_view_stats: canViewStats, is_active: isActive, password: password || undefined }
                })
            });
        } else {
            if (!password) {
                showToast('Введите пароль', 'error');
                return;
            }
            response = await fetch(`${API_BASE_URL}/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, name, password, position, phone, role, canViewStats })
            });
        }
        
        const result = await response.json();
        if (result.success) {
            showToast(editLogin ? 'Сотрудник обновлён' : 'Сотрудник добавлен', 'success');
            closeEmployeeModal();
            loadEmployees();
            loadStats();
        } else {
            showToast(result.error, 'error');
        }
    } catch (error) {
        showToast('Ошибка сохранения', 'error');
    }
}

async function deleteEmployeeConfirm(login) {
    if (confirm(`Удалить сотрудника ${login}?`)) {
        try {
            const response = await fetch(`${API_BASE_URL}/employees`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login })
            });
            const result = await response.json();
            if (result.success) {
                showToast('Сотрудник удалён', 'success');
                loadEmployees();
                loadStats();
            } else {
                showToast(result.error, 'error');
            }
        } catch (error) {
            showToast('Ошибка удаления', 'error');
        }
    }
}

function closeEmployeeModal() {
    document.getElementById('employeeModal').style.display = 'none';
}

// ========== УПРАВЛЕНИЕ СПЕЦИАЛЬНОСТЯМИ ==========
async function loadSpecialties() {
    try {
        const response = await fetch(`${API_BASE_URL}/specialties`);
        const result = await response.json();
        
        if (result.success && result.specialties) {
            const specialties = result.specialties;
            const tbody = document.getElementById('specialtiesList');
            
            tbody.innerHTML = specialties.map(spec => `
                <tr>
                    <td>${spec.code}</td>
                    <td>${spec.full_name || spec.name}</td>
                    <td>
                        <input type="number" value="${spec.display_order || 999}" style="width: 60px; background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px; padding: 4px; color: white;" 
                               onchange="updateSpecialtyOrder('${spec.code}', this.value)">
                    </td>
                    <td><span class="status-badge ${spec.active ? 'status-active' : 'status-inactive'}">${spec.active ? 'Активна' : 'Скрыта'}</span></td>
                    <td>
                        <button class="action-btn" onclick="toggleSpecialty('${spec.code}')">${spec.active ? '🔒 Скрыть' : '🔓 Показать'}</button>
                        <button class="action-btn" onclick="editSpecialty('${spec.code}')">✏️</button>
                        <button class="action-btn" onclick="deleteSpecialty('${spec.code}')">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        showToast('Ошибка загрузки специальностей', 'error');
    }
}

async function toggleSpecialty(code) {
    try {
        // Получаем текущий статус
        const getResponse = await fetch(`${API_BASE_URL}/specialties?code=${code}`);
        const getResult = await getResponse.json();
        
        if (getResult.success && getResult.specialty) {
            const newActive = !getResult.specialty.active;
            
            const response = await fetch(`${API_BASE_URL}/specialties`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, updates: { active: newActive } })
            });
            const result = await response.json();
            if (result.success) {
                loadSpecialties();
                showToast(newActive ? 'Специальность активирована' : 'Специальность скрыта', 'success');
            }
        }
    } catch (error) {
        showToast('Ошибка обновления', 'error');
    }
}

async function updateSpecialtyOrder(code, order) {
    try {
        const response = await fetch(`${API_BASE_URL}/specialties`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, updates: { display_order: parseInt(order) } })
        });
        const result = await response.json();
        if (result.success) {
            loadSpecialties();
            showToast('Порядок обновлён', 'success');
        }
    } catch (error) {
        showToast('Ошибка обновления', 'error');
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

async function editSpecialty(code) {
    try {
        const response = await fetch(`${API_BASE_URL}/specialties?code=${code}`);
        const result = await response.json();
        if (result.success && result.specialty) {
            const spec = result.specialty;
            document.getElementById('specialtyModalTitle').textContent = 'Редактировать специальность';
            document.getElementById('editSpecialtyKey').value = spec.code;
            document.getElementById('specialtyCode').value = spec.code;
            document.getElementById('specialtyName').value = spec.full_name || spec.name;
            document.getElementById('specialtyOrder').value = spec.display_order || 99;
            document.getElementById('specialtyModal').style.display = 'flex';
        }
    } catch (error) {
        showToast('Ошибка загрузки', 'error');
    }
}

async function saveSpecialty() {
    const oldCode = document.getElementById('editSpecialtyKey').value;
    const code = document.getElementById('specialtyCode').value;
    const name = document.getElementById('specialtyName').value;
    const order = parseInt(document.getElementById('specialtyOrder').value);
    
    if (!code || !name) {
        showToast('Заполните все поля', 'error');
        return;
    }
    
    try {
        let response;
        
        if (oldCode) {
            // Редактирование
            response = await fetch(`${API_BASE_URL}/specialties`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    code: oldCode, 
                    updates: { 
                        code: code,
                        full_name: name, 
                        display_order: order 
                    } 
                })
            });
        } else {
            // Создание
            response = await fetch(`${API_BASE_URL}/specialties`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, name, display_order: order })
            });
        }
        
        const result = await response.json();
        if (result.success) {
            showToast(oldCode ? 'Специальность обновлена' : 'Специальность добавлена', 'success');
            closeSpecialtyModal();
            loadSpecialties();
        } else {
            showToast(result.error, 'error');
        }
    } catch (error) {
        showToast('Ошибка сохранения', 'error');
    }
}

async function deleteSpecialty(code) {
    if (confirm('Удалить специальность?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/specialties`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const result = await response.json();
            if (result.success) {
                showToast('Специальность удалена', 'success');
                loadSpecialties();
            } else {
                showToast(result.error, 'error');
            }
        } catch (error) {
            showToast('Ошибка удаления', 'error');
        }
    }
}

function closeSpecialtyModal() {
    document.getElementById('specialtyModal').style.display = 'none';
}

// ========== УПРАВЛЕНИЕ ДОКУМЕНТАМИ ==========
async function loadDocuments() {
    try {
        const response = await fetch(`${API_BASE_URL}/documents`);
        const result = await response.json();
        
        if (result.success && result.documents) {
            const tbody = document.getElementById('documentsList');
            tbody.innerHTML = result.documents.map((doc, index) => `
                <tr>
                    <td>${doc.name}</td>
                    <td>
                        <button class="action-btn" onclick="editDocument('${doc.name}')">✏️</button>
                        <button class="action-btn" onclick="deleteDocument('${doc.name}')">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        showToast('Ошибка загрузки документов', 'error');
    }
}

async function openDocumentModal() {
    const newDoc = prompt('Введите название документа:');
    if (newDoc) {
        try {
            const response = await fetch(`${API_BASE_URL}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newDoc })
            });
            const result = await response.json();
            if (result.success) {
                showToast('Документ добавлен', 'success');
                loadDocuments();
            } else {
                showToast(result.error, 'error');
            }
        } catch (error) {
            showToast('Ошибка добавления', 'error');
        }
    }
}

async function editDocument(name) {
    const newName = prompt('Редактировать документ:', name);
    if (newName && newName !== name) {
        try {
            const response = await fetch(`${API_BASE_URL}/documents`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldName: name, newName })
            });
            const result = await response.json();
            if (result.success) {
                showToast('Документ обновлён', 'success');
                loadDocuments();
            } else {
                showToast(result.error, 'error');
            }
        } catch (error) {
            showToast('Ошибка обновления', 'error');
        }
    }
}

async function deleteDocument(name) {
    if (confirm(`Удалить документ "${name}"?`)) {
        try {
            const response = await fetch(`${API_BASE_URL}/documents`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const result = await response.json();
            if (result.success) {
                showToast('Документ удалён', 'success');
                loadDocuments();
            } else {
                showToast(result.error, 'error');
            }
        } catch (error) {
            showToast('Ошибка удаления', 'error');
        }
    }
}

// ========== НАСТРОЙКИ ==========
async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        const result = await response.json();
        if (result.success && result.settings) {
            const settings = result.settings;
            document.getElementById('maxPhotos').value = settings.max_photos || 4;
            document.getElementById('companyName').value = settings.company_name || 'Приемная комиссия';
            document.getElementById('companyPhone').value = settings.company_phone || '(499) 156-40-01';
        }
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
    }
}

async function saveSettings() {
    const settings = {
        max_photos: parseInt(document.getElementById('maxPhotos').value),
        company_name: document.getElementById('companyName').value,
        company_phone: document.getElementById('companyPhone').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        const result = await response.json();
        if (result.success) {
            showToast('Настройки сохранены', 'success');
        } else {
            showToast(result.error, 'error');
        }
    } catch (error) {
        showToast('Ошибка сохранения', 'error');
    }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = type === 'success' ? 'var(--success)' : 'var(--danger)';
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