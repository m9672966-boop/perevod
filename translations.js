let currentSearchTimeout = null;
let editingId = null;
let currentUserEmail = '';
let visibleLanguages = ['russian', 'english', 'german', 'french', 'spanish', 'polish', 'kazakh', 'italian', 'belarusian', 'ukrainian', 'dutch', 'kyrgyz', 'uzbek', 'armenian'];
const allLanguages = [
  { id: 'russian', name: 'Русский' },
  { id: 'english', name: 'Английский' },
  { id: 'german', name: 'Немецкий' },
  { id: 'french', name: 'Французский' },
  { id: 'spanish', name: 'Испанский' },
  { id: 'polish', name: 'Польский' },
  { id: 'kazakh', name: 'Казахский' },
  { id: 'italian', name: 'Итальянский' },
  { id: 'belarusian', name: 'Белорусский' },
  { id: 'ukrainian', name: 'Украинский' },
  { id: 'dutch', name: 'Голландский' },
  { id: 'kyrgyz', name: 'Киргизский' },
  { id: 'uzbek', name: 'Узбекский' },
  { id: 'armenian', name: 'Армянский' }
];

// Список разрешенных почт
const ALLOWED_EMAILS = [
  'mantsurova_e@panna.ru',
  'kulyabina_v@panna.ru', 
  'semenchenko_d@panna.ru',
  'pyatnitskaya_n@panna.ru',
  'tolstokorova_m@panna.ru'
];

// Сохранение настроек в localStorage
function saveSettings() {
  localStorage.setItem('visibleLanguages', JSON.stringify(visibleLanguages));
}

// Загрузка настроек из localStorage
function loadSettings() {
  const saved = localStorage.getItem('visibleLanguages');
  if (saved) {
    visibleLanguages = JSON.parse(saved);
  }
}

// Функция для запроса email
function requestEmail() {
  const email = prompt('Введите ваш email для доступа к редактированию:');
  if (email) {
    // Проверяем email на сервере
    fetch('/api/check-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': email
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        currentUserEmail = email;
        localStorage.setItem('userEmail', email);
        updateUserDisplay();
        alert('Доступ разрешен!');
      } else {
        alert('Доступ запрещен. Ваш email не в списке разрешенных.');
        requestEmail(); // Запрашиваем снова
      }
    })
    .catch(error => {
      console.error('Ошибка проверки email:', error);
      alert('Ошибка проверки доступа');
    });
  }
}

// Обновление отображения информации о пользователе
function updateUserDisplay() {
  const userInfo = document.getElementById('userInfo');
  const currentUserSpan = document.getElementById('currentUser');
  
  if (currentUserEmail) {
    userInfo.style.display = 'block';
    currentUserSpan.textContent = currentUserEmail;
  } else {
    userInfo.style.display = 'none';
  }
}

// Выход из системы
function logout() {
  currentUserEmail = '';
  localStorage.removeItem('userEmail');
  updateUserDisplay();
  requestEmail();
}

// Инициализация фильтров языков
function initLanguageFilters() {
  const filtersContainer = document.getElementById('languageFilters');
  filtersContainer.innerHTML = '';
  
  allLanguages.forEach(lang => {
    const isChecked = visibleLanguages.includes(lang.id);
    
    const filterDiv = document.createElement('div');
    filterDiv.className = 'language-filter';
    filterDiv.innerHTML = `
      <input type="checkbox" id="filter-${lang.id}" name="language" 
             value="${lang.id}" ${isChecked ? 'checked' : ''} 
             onchange="applyLanguageFilter()">
      <label for="filter-${lang.id}">${lang.name}</label>
    `;
    
    filtersContainer.appendChild(filterDiv);
  });
}

// Инициализация формы добавления
function initAddForm() {
  const formContainer = document.getElementById('addForm');
  formContainer.innerHTML = '';
  
  // Русский всегда виден
  formContainer.innerHTML += `
    <div class="form-group">
      <label for="russianInput">Русский *</label>
      <input type="text" id="russianInput" required>
    </div>
  `;
  
  // Остальные языки
  allLanguages.filter(lang => lang.id !== 'russian').forEach(lang => {
    const isVisible = visibleLanguages.includes(lang.id);
    formContainer.innerHTML += `
      <div class="form-group" id="${lang.id}Container" style="display: ${isVisible ? 'block' : 'none'}">
        <label for="${lang.id}Input">${lang.name}</label>
        <input type="text" id="${lang.id}Input">
      </div>
    `;
  });
}

async function searchTranslations() {
  const searchTerm = document.getElementById('searchInput').value.trim();
  
  if (currentSearchTimeout) {
    clearTimeout(currentSearchTimeout);
  }
  
  currentSearchTimeout = setTimeout(async () => {
    try {
      const response = await fetch(`/api/translations?search=${encodeURIComponent(searchTerm)}`);
      const translations = await response.json();
      displayResults(translations);
    } catch (error) {
      console.error('Ошибка поиска:', error);
      document.getElementById('results').innerHTML = `
        <div class="error">Ошибка при поиске переводов</div>
      `;
    }
  }, 300);
}

function displayResults(translations) {
  const resultsDiv = document.getElementById('results');
  
  if (translations.length === 0) {
    resultsDiv.innerHTML = '<div class="loading">Переводы не найдены</div>';
    return;
  }
  
  let html = `
    <table>
      <thead>
        <tr>
          <th>Русский</th>
  `;
  
  // Добавляем заголовки только для видимых языков
  allLanguages.forEach(lang => {
    if (lang.id !== 'russian' && visibleLanguages.includes(lang.id)) {
      html += `<th>${lang.name}</th>`;
    }
  });
  
  html += `
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  translations.forEach(translation => {
    html += `
      <tr>
        <td>${escapeHtml(translation.russian)}</td>
    `;
    
    // Добавляем ячейки только для видимых языков
    allLanguages.forEach(lang => {
      if (lang.id !== 'russian' && visibleLanguages.includes(lang.id)) {
        html += `<td>${escapeHtml(translation[lang.id] || '-')}</td>`;
      }
    });
    
    html += `
        <td>
          <button class="btn-edit" onclick="startEdit(${translation.id})">
            ✏️
          </button>
          <button class="btn-delete" onclick="deleteTranslation(${translation.id})">
            🗑️
          </button>
        </td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  resultsDiv.innerHTML = html;
}

function applyLanguageFilter() {
  const checkboxes = document.querySelectorAll('input[name="language"]:checked');
  visibleLanguages = Array.from(checkboxes).map(cb => cb.value);
  
  // Сохраняем настройки
  saveSettings();
  
  // Перезапускаем поиск, чтобы обновить таблицу
  searchTranslations();
  // Обновляем форму добавления
  initAddForm();
}

function startEdit(id) {
  if (!currentUserEmail) {
    requestEmail();
    return;
  }
  
  editingId = id;
  
  // Запрашиваем пароль
  const password = prompt('Введите пароль для редактирования:');
  if (password !== 'Proizv_23!') {
    alert('Неверный пароль!');
    return;
  }
  
  // Загружаем данные перевода для редактирования
  fetch(`/api/translations/${id}`, {
    headers: {
      'x-user-email': currentUserEmail
    }
  })
    .then(response => response.json())
    .then(translation => {
      // Заполняем форму данными
      document.getElementById('russianInput').value = translation.russian || '';
      allLanguages.forEach(lang => {
        if (lang.id !== 'russian') {
          const input = document.getElementById(`${lang.id}Input`);
          if (input) {
            input.value = translation[lang.id] || '';
          }
        }
      });
      
      // Меняем кнопку на "Сохранить"
      const addButton = document.querySelector('.btn-primary');
      addButton.textContent = 'Сохранить изменения';
      addButton.onclick = saveEdit;
      
      // Добавляем кнопку отмены
      const actionsDiv = document.querySelector('.form-actions');
      if (!document.querySelector('.btn-cancel')) {
        actionsDiv.innerHTML += `
          <button class="btn btn-danger btn-cancel" onclick="cancelEdit()">
            Отмена
          </button>
        `;
      }
    })
    .catch(error => {
      console.error('Ошибка загрузки перевода:', error);
      alert('Ошибка загрузки перевода');
    });
}

function saveEdit() {
  if (!currentUserEmail) {
    requestEmail();
    return;
  }
  
  const password = prompt('Введите пароль для подтверждения:');
  if (password !== 'Proizv_23!') {
    alert('Неверный пароль!');
    return;
  }
  
  const translationData = {
    russian: document.getElementById('russianInput').value.trim()
  };
  
  allLanguages.forEach(lang => {
    if (lang.id !== 'russian') {
      const input = document.getElementById(`${lang.id}Input`);
      if (input) {
        translationData[lang.id] = input.value.trim();
      }
    }
  });
  
  fetch(`/api/translations/${editingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-password': password,
      'x-user-email': currentUserEmail
    },
    body: JSON.stringify(translationData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.changes > 0) {
      alert('Перевод успешно обновлен!');
      cancelEdit();
      searchTranslations();
    } else {
      alert('Ошибка при обновлении перевода');
    }
  })
  .catch(error => {
    console.error('Ошибка:', error);
    alert('Ошибка при обновлении перевода');
  });
}

function cancelEdit() {
  editingId = null;
  
  // Очищаем форму
  document.getElementById('russianInput').value = '';
  allLanguages.forEach(lang => {
    if (lang.id !== 'russian') {
      const input = document.getElementById(`${lang.id}Input`);
      if (input) {
        input.value = '';
      }
    }
  });
  
  // Возвращаем кнопку добавления
  const addButton = document.querySelector('.btn-primary');
  addButton.textContent = 'Добавить перевод';
  addButton.onclick = addTranslation;
  
  // Убираем кнопку отмены
  const cancelButton = document.querySelector('.btn-cancel');
  if (cancelButton) {
    cancelButton.remove();
  }
}

function addTranslation() {
  const translationData = {
    russian: document.getElementById('russianInput').value.trim()
  };
  
  if (!translationData.russian) {
    alert('Русский перевод обязателен!');
    return;
  }
  
  allLanguages.forEach(lang => {
    if (lang.id !== 'russian') {
      const input = document.getElementById(`${lang.id}Input`);
      if (input) {
        translationData[lang.id] = input.value.trim();
      }
    }
  });
  
  fetch('/api/translations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(translationData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.id) {
      alert('Перевод успешно добавлен!');
      // Очищаем форму
      document.getElementById('russianInput').value = '';
      allLanguages.forEach(lang => {
        if (lang.id !== 'russian') {
          const input = document.getElementById(`${lang.id}Input`);
          if (input) {
            input.value = '';
          }
        }
      });
      // Обновляем результаты
      searchTranslations();
    } else {
      alert('Ошибка при добавлении перевода');
    }
  })
  .catch(error => {
    console.error('Ошибка:', error);
    alert('Ошибка при добавлении перевода');
  });
}

function deleteTranslation(id) {
  if (!currentUserEmail) {
    requestEmail();
    return;
  }
  
  const password = prompt('Введите пароль для удаления:');
  if (password !== 'Proizv_23!') {
    alert('Неверный пароль!');
    return;
  }
  
  if (!confirm('Вы уверены, что хотите удалить этот перевод?')) {
    return;
  }
  
  fetch(`/api/translations/${id}`, {
    method: 'DELETE',
    headers: {
      'x-password': password,
      'x-user-email': currentUserEmail
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.changes > 0) {
      alert('Перевод успешно удален!');
      searchTranslations();
    } else {
      alert('Ошибка при удалении перевода');
    }
  })
  .catch(error => {
    console.error('Ошибка:', error);
    alert('Ошибка при удалении перевода');
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  // Проверяем сохраненный email
  const savedEmail = localStorage.getItem('userEmail');
  if (savedEmail && ALLOWED_EMAILS.includes(savedEmail.toLowerCase())) {
    currentUserEmail = savedEmail;
    updateUserDisplay();
  } else {
    requestEmail();
  }
  
  loadSettings();
  initLanguageFilters();
  initAddForm();
  searchTranslations();
});
