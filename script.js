// ⚠️ ВАЖНО: ЗАМЕНИТЕ НА URL ВАШЕГО GOOGLE APPS SCRIPT ВЕБ-ПРИЛОЖЕНИЯ
const API_URL = 'https://script.google.com/macros/s/ВАШ_ID_ВЕБ_ПРИЛОЖЕНИЯ/exec';

// Обработчик отправки формы
document.getElementById('receiptForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Показываем загрузку
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    submitBtn.disabled = true;
    
    hideAlert();
    
    // Собираем данные
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        specialty: document.getElementById('specialty').value,
        diplomaNumber: document.getElementById('diplomaNumber').value.trim(),
        diplomaDate: document.getElementById('diplomaDate').value,
        diplomaIssuedBy: document.getElementById('diplomaIssuedBy').value.trim(),
        documents: document.getElementById('documents').value,
        photosCount: document.getElementById('photosCount').value,
        score: document.getElementById('score').value.trim(),
        city: document.getElementById('city').value.trim(),
        employee: document.getElementById('employee').value
    };
    
    // Валидация
    if (!formData.fullName) {
        showAlert('Пожалуйста, заполните ФИО абитуриента', 'error');
        resetButton();
        return;
    }
    
    if (!formData.specialty) {
        showAlert('Пожалуйста, выберите специальность', 'error');
        resetButton();
        return;
    }
    
    // Отправляем запрос
    try {
        const response = await sendRequest(formData);
        
        if (response.success) {
            showAlert(`✅ Расписка №${response.receiptNumber} успешно создана! Сейчас откроется PDF...`, 'success');
            
            // ✅ ОТКРЫВАЕМ PDF В НОВОЙ ВКЛАДКЕ
            window.open(response.pdfUrl, '_blank');
            
            // Очищаем форму (опционально)
            // document.getElementById('receiptForm').reset();
            
            // Показываем кнопку для повторной печати
            showPrintButton(response.pdfUrl, response.receiptNumber);
        } else {
            showAlert('❌ Ошибка: ' + (response.error || 'Неизвестная ошибка'), 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showAlert('❌ Ошибка соединения. Пожалуйста, попробуйте позже.\n' + error.message, 'error');
    } finally {
        resetButton();
    }
});

// Функция отправки запроса
async function sendRequest(formData) {
    // Пробуем fetch с CORS
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (corsError) {
        // Если CORS блокирует, используем JSONP подход через iframe
        console.log('CORS ошибка, используем iframe метод');
        return await sendWithIframe(formData);
    }
}

// Альтернативный метод через iframe (обходит CORS)
function sendWithIframe(formData) {
    return new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.name = 'hiddenFrame_' + Date.now();
        document.body.appendChild(iframe);
        
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = API_URL;
        form.target = iframe.name;
        
        const dataField = document.createElement('input');
        dataField.type = 'hidden';
        dataField.name = 'data';
        dataField.value = JSON.stringify(formData);
        form.appendChild(dataField);
        
        document.body.appendChild(form);
        
        let timeout = setTimeout(() => {
            reject(new Error('Timeout'));
            cleanup();
        }, 30000);
        
        iframe.onload = function() {
            clearTimeout(timeout);
            try {
                const content = iframe.contentDocument || iframe.contentWindow.document;
                const text = content.body.innerText;
                const result = JSON.parse(text);
                resolve(result);
            } catch(e) {
                // Если не JSON, возможно успех
                resolve({ success: true, message: 'Документ создан' });
            } finally {
                cleanup();
            }
        };
        
        function cleanup() {
            iframe.remove();
            form.remove();
        }
        
        form.submit();
    });
}

// Показываем кнопку для повторной печати
function showPrintButton(pdfUrl, receiptNumber) {
    const existingButton = document.getElementById('printAgainBtn');
    if (existingButton) existingButton.remove();
    
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'printAgainBtn';
    buttonContainer.style.marginTop = '15px';
    buttonContainer.style.textAlign = 'center';
    
    const button = document.createElement('button');
    button.innerHTML = '🖨️ Напечатать снова';
    button.style.background = '#4CAF50';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.padding = '10px 20px';
    button.style.borderRadius = '8px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.style.fontWeight = '600';
    button.onclick = () => {
        window.open(pdfUrl, '_blank');
        showAlert('🖨️ Открывается PDF для печати...', 'info');
    };
    
    buttonContainer.appendChild(button);
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.parentNode.insertBefore(buttonContainer, submitBtn.nextSibling);
    
    // Удаляем через 10 секунд
    setTimeout(() => {
        buttonContainer.style.opacity = '0';
        setTimeout(() => buttonContainer.remove(), 500);
    }, 10000);
}

function showAlert(message, type) {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert alert-${type}`;
    alert.style.display = 'block';
    
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => {
            alert.style.display = 'none';
            alert.style.opacity = '1';
        }, 300);
    }, 5000);
}

function hideAlert() {
    const alert = document.getElementById('alert');
    alert.style.display = 'none';
}

function resetButton() {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    btnText.style.display = 'flex';
    btnLoading.style.display = 'none';
    submitBtn.disabled = false;
}

// Добавляем форматирование для поля с документами
document.getElementById('documents').addEventListener('input', function() {
    // Автоматическая замена запятых на переносы строк
    this.value = this.value.replace(/,/g, '\n');
});

// Предзаполнение примера
function setExampleData() {
    document.getElementById('fullName').value = 'Станин Дмитрий Игоревич';
    document.getElementById('specialty').value = '24.02.01 Производство летательных аппаратов';
    document.getElementById('diplomaNumber').value = '25151626';
    document.getElementById('diplomaDate').value = '2024-05-14';
    document.getElementById('diplomaIssuedBy').value = 'ГБОУ ШКОЛА 1576';
    document.getElementById('documents').value = 'Заявление\nАттестат/диплом (оригинал)\nФотокарточки (4 шт)\nМедицинская справка 086/у\nКопия паспорта\nКопия СНИЛС';
    document.getElementById('photosCount').value = '3';
    document.getElementById('score').value = '28';
    document.getElementById('city').value = 'Москва';
}

// Добавляем клавиатурные сокращения
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('receiptForm').dispatchEvent(new Event('submit'));
    }
});