const STORAGE_KEYS = { USERS: 'receipt_system_users', CURRENT_USER: 'receipt_system_current_user', RECEIPTS: 'receipt_system_receipts', COUNTERS: 'receipt_system_counters' };
function hashPassword(pwd) { let hash = 0; for (let i=0; i<pwd.length; i++) { hash = ((hash<<5)-hash)+pwd.charCodeAt(i); hash &= hash; } return hash.toString(); }

function initializeUsers() {
  if (localStorage.getItem(STORAGE_KEYS.USERS)) return;
  let users = {
    'admin': { id:'admin_1', login:'admin', password:hashPassword('admin123'), name:'Главный Администратор', role:'admin', position:'Главный администратор', phone:'+7 (499) 156-40-01', isActive:true, canViewStats:true, receiptCount:0 },
    'osokin': { id:'emp_1', login:'osokin', password:hashPassword('123456'), name:'Осокин Константин Вячеславович', role:'both', position:'Ответственный секретарь', isActive:true, canViewStats:true, receiptCount:0 },
    'tsygankova': { id:'emp_2', login:'tsygankova', password:hashPassword('123456'), name:'Цыганкова Юлия Игоревна', role:'both', position:'Заместитель ответственного секретаря', isActive:true, canViewStats:true, receiptCount:0 }
  };
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  if (!localStorage.getItem(STORAGE_KEYS.RECEIPTS)) localStorage.setItem(STORAGE_KEYS.RECEIPTS, '[]');
  if (!localStorage.getItem(STORAGE_KEYS.COUNTERS)) localStorage.setItem(STORAGE_KEYS.COUNTERS, '{}');
}

function login(login, password) {
  let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}');
  let user = users[login];
  if (!user) return { success: false, error: 'Пользователь не найден' };
  if (!user.isActive) return { success: false, error: 'Аккаунт деактивирован' };
  if (user.password !== hashPassword(password)) return { success: false, error: 'Неверный пароль' };
  let session = { userId: user.id, login: user.login, name: user.name, role: user.role, position: user.position, phone: user.phone, canViewStats: user.canViewStats || user.role==='admin'||user.role==='both', loginTime: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
  return { success: true, user: session };
}
function logout() { localStorage.removeItem(STORAGE_KEYS.CURRENT_USER); window.location.href = 'login.html'; }
function checkAuth() { let cu = localStorage.getItem(STORAGE_KEYS.CURRENT_USER); if (!cu && !window.location.pathname.includes('login.html')) { window.location.href = 'login.html'; return null; } return cu ? JSON.parse(cu) : null; }
function getCurrentUser() { let u = localStorage.getItem(STORAGE_KEYS.CURRENT_USER); return u ? JSON.parse(u) : null; }
function isAdmin() { let u = getCurrentUser(); return u && (u.role === 'admin' || u.role === 'both'); }
function getAllUsers() { return Object.values(JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}')); }
function getEmployees() { return getAllUsers().filter(u => u.role !== 'admin'); }
function addEmployee(emp) { let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '{}'); if (users[emp.login]) return { success: false, error: 'Логин существует' }; let newUser = { id:'emp_'+Date.now(), login:emp.login, password:hashPassword(emp.password), name:emp.name, role:emp.role||'employee', position:emp.position, phone:emp.phone, isActive:true, canViewStats:(emp.role==='manager'||emp.role==='both'), receiptCount:0 }; users[emp.login]=newUser; localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); return { success: true }; }
function updateEmployee(login, updates) { let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)||'{}'); if (!users[login]) return { success: false }; if (updates.password) updates.password = hashPassword(updates.password); if (updates.role) updates.canViewStats = (updates.role==='manager'||updates.role==='both'); users[login] = { ...users[login], ...updates }; localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); return { success: true }; }
function deleteEmployee(login) { let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)||'{}'); if (login==='admin') return { success: false, error: 'Нельзя удалить admin' }; delete users[login]; localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); return { success: true }; }
function saveReceipt(receipt) { let receipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS)||'[]'); let newReceipt = { ...receipt, id:'receipt_'+Date.now()+'_'+Math.random(), createdAt: new Date().toISOString() }; receipts.push(newReceipt); localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts)); let cur = getCurrentUser(); if (cur && cur.role !== 'admin') { let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)||'{}'); if(users[cur.login]) { users[cur.login].receiptCount = (users[cur.login].receiptCount||0)+1; localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); } } }
function getAllReceipts() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS)||'[]'); }
function getEmployeeReceipts(login) { return getAllReceipts().filter(r => r.employeeLogin === login).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); }
function getReceiptCounter(code) { let counters = JSON.parse(localStorage.getItem(STORAGE_KEYS.COUNTERS)||'{}'); let current = counters[code]||0; counters[code]=current+1; localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters)); return current+1; }
function getSystemStats() { let receipts = getAllReceipts(); let today = new Date().toDateString(); let todayReceipts = receipts.filter(r => new Date(r.createdAt).toDateString() === today); let employees = getEmployees(); let employeeStats = employees.map(e => ({ name:e.name, login:e.login, receiptCount:e.receiptCount||0, position:e.position, isActive:e.isActive })); let specialtyStats = {}; receipts.forEach(r => { let code = r.specialtyCode; if(code) specialtyStats[code] = (specialtyStats[code]||0)+1; }); return { totalReceipts: receipts.length, todayReceipts: todayReceipts.length, totalEmployees: employees.length, activeUsers: getAllUsers().filter(u=>u.isActive).length, employeeStats, specialtyStats }; }
window.login=login; window.logout=logout; window.checkAuth=checkAuth; window.getCurrentUser=getCurrentUser; window.isAdmin=isAdmin; window.getAllUsers=getAllUsers; window.getEmployees=getEmployees; window.addEmployee=addEmployee; window.updateEmployee=updateEmployee; window.deleteEmployee=deleteEmployee; window.saveReceipt=saveReceipt; window.getAllReceipts=getAllReceipts; window.getEmployeeReceipts=getEmployeeReceipts; window.getReceiptCounter=getReceiptCounter; window.getSystemStats=getSystemStats;
initializeUsers();
console.log('✅ auth.js loaded');