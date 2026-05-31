// ========== АДМИН ЛОГИКА ==========

// Проверка прав администратора
const currentUser = checkAuth();
if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = 'login.html';
}

document.getElementById('adminName').textContent = currentUser.name;

// Загрузка статистики
function loadStats() {
    const users = getAllUsers();
    const receipts = JSON.parse(localStorage.getItem('receipt_system_receipts') || '[]');
    const today = new Date().toDateString();
    const todayReceipts = receipts.filter(r => new Date(r.createdAt).toDateString() === today);
    
    document.getElementById('totalEmployees').textContent = users.filter(u => u.role === 'employee').length;
    document.getElementById('totalReceipts').textContent = receipts.length;
    document.getElementById('todayReceipts').textContent = todayReceipts.length;
    document.getElementById('activeUsers').textContent = users.filter(u => u.isActive).length;
}

// Загрузка списка сотрудников
function loadEmployees() {
    const users = getAllUsers();
    const employees = users.filter(u => u.role === 'employee');
    const tbody = document.getElementById('employeesList');
    
    tbody.innerHTML = employees.map(emp => `
        <tr>
            <td>${emp.name}</td>
            <td>${emp.email}</td>
            <td>${emp.position || '-'}</td>
            <td>${emp.phone || '-'}</td>
            <td>
                <span style="color: ${emp.isActive ? '#10b981' : '#ef4444'}">
                    ${emp.isActive ? 'Активен' : 'Неактивен'}
                </span>
            </td>
            <td>
                <button class="btn btn-primary" style="margin-right: 8px;" onclick="editEmployee('${emp.email}')">✏️</button>
                <button class="btn btn-danger" onclick="deleteEmployeeConfirm('${emp.email}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Открытие модального окна добавления
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Добавить сотрудника';
    document.getElementById('editEmail').value = '';
    document.getElementById('empName').value = '';
    document.getElementById('empEmail').value = '';
    document.getElementById('empPassword').value = '';
    document.getElementById('empPosition').value = '';
    document.getElementById('empPhone').value = '';
    document.getElementById('empStatus').value = 'true';
    document.getElementById('employeeModal').style.display = 'flex';
}

// Редактирование сотрудника
function editEmployee(email) {
    const users = getAllUsers();
    const emp = users.find(u => u.email === email);
    if (!emp) return;
    
    document.getElementById('modalTitle').textContent = 'Редактировать сотрудника';
    document.getElementById('editEmail').value = email;
    document.getElementById('empName').value = emp.name;
    document.getElementById('empEmail').value = emp.email;
    document.getElementById('empPassword').value = '';
    document.getElementById('empPosition').value = emp.position || '';
    document.getElementById('empPhone').value = emp.phone || '';
    document.getElementById('empStatus').value = emp.isActive ? 'true' : 'false';
    document.getElementById('employeeModal').style.display = 'flex';
}

// Сохранение сотрудника
function saveEmployee() {
    const editEmail = document.getElementById('editEmail').value;
    const email = document.getElementById('empEmail').value;
    const name = document.getElementById('empName').value;
    const password = document.getElementById('empPassword').value;
    const position = document.getElementById('empPosition').value;
    const phone = document.getElementById('empPhone').value;
    const isActive = document.getElementById('empStatus').value === 'true';
    
    if (!name || !email) {
        alert('Заполните обязательные поля');
        return;
    }
    
    if (editEmail) {
        // Редактирование
        const updates = { name, position, phone, isActive };
        if (password) updates.password = password;
        const result = updateEmployee(editEmail, updates);
        if (result.success) {
            alert('Сотрудник обновлен');
            closeModal();
            loadEmployees();
            loadStats();
        } else {
            alert(result.error);
        }
    } else {
        // Добавление
        if (!password) {
            alert('Введите пароль');
            return;
        }
        const result = addEmployee({ email, name, password, position, phone });
        if (result.success) {
            alert('Сотрудник добавлен');
            closeModal();
            loadEmployees();
            loadStats();
        } else {
            alert(result.error);
        }
    }
}

// Подтверждение удаления
function deleteEmployeeConfirm(email) {
    if (confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
        const result = deleteEmployee(email);
        if (result.success) {
            alert('Сотрудник удален');
            loadEmployees();
            loadStats();
        } else {
            alert(result.error);
        }
    }
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('employeeModal').style.display = 'none';
}

// Инициализация
loadStats();
loadEmployees();

// Закрытие модального окна при клике вне его
window.onclick = (event) => {
    const modal = document.getElementById('employeeModal');
    if (event.target === modal) {
        closeModal();
    }
};