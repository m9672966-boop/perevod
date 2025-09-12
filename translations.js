let currentSearchTimeout = null;
let editingId = null;
let visibleLanguages = ['russian', 'english', 'german', 'french', 'spanish', 'polish', 'kazakh', 'italian', 'belarusian', 'ukrainian', 'dutch', 'kyrgyz', 'uzbek', 'armenian'];

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
  if (visibleLanguages.includes('english')) html += `<th>Английский</th>`;
  if (visibleLanguages.includes('german')) html += `<th>Немецкий</th>`;
  if (visibleLanguages.includes('french')) html += `<th>Французский</th>`;
  if (visibleLanguages.includes('spanish')) html += `<th>Испанский</th>`;
  if (visibleLanguages.includes('polish')) html += `<th>Польский</th>`;
  if (visibleLanguages.includes('kazakh')) html += `<th>Казахский</th>`;
  if (visibleLanguages.includes('italian')) html += `<th>Итальянский</th>`;
  if (visibleLanguages.includes('belarusian')) html += `<th>Белорусский</th>`;
  if (visibleLanguages.includes('ukrainian')) html += `<th>Украинский</th>`;
  if (visibleLanguages.includes('dutch')) html += `<th>Голландский</th>`;
  if (visibleLanguages.includes('kyrgyz')) html += `<th>Киргизский</th>`;
  if (visibleLanguages.includes('uzbek')) html += `<th>Узбекский</th>`;
  if (visibleLanguages.includes('armenian')) html += `<th>Армянский</th>`;
  
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
    if (visibleLanguages.includes('english')) html += `<td>${escapeHtml(translation.english || '-')}</td>`;
    if (visibleLanguages.includes('german')) html += `<td>${escapeHtml(translation.german || '-')}</td>`;
    if (visibleLanguages.includes('french')) html += `<td>${escapeHtml(translation.french || '-')}</td>`;
    if (visibleLanguages.includes('spanish')) html += `<td>${escapeHtml(translation.spanish || '-')}</td>`;
    if (visibleLanguages.includes('polish')) html += `<td>${escapeHtml(translation.polish || '-')}</td>`;
    if (visibleLanguages.includes('kazakh')) html += `<td>${escapeHtml(translation.kazakh || '-')}</td>`;
    if (visibleLanguages.includes('italian')) html += `<td>${escapeHtml(translation.italian || '-')}</td>`;
    if (visibleLanguages.includes('belarusian')) html += `<td>${escapeHtml(translation.belarusian || '-')}</td>`;
    if (visibleLanguages.includes('ukrainian')) html += `<td>${escapeHtml(translation.ukrainian || '-')}</td>`;
    if (visibleLanguages.includes('dutch')) html += `<td>${escapeHtml(translation.dutch || '-')}</td>`;
    if (visibleLanguages.includes('kyrgyz')) html += `<td>${escapeHtml(translation.kyrgyz || '-')}</td>`;
    if (visibleLanguages.includes('uzbek')) html += `<td>${escapeHtml(translation.uzbek || '-')}</td>`;
    if (visibleLanguages.includes('armenian')) html += `<td>${escapeHtml(translation.armenian || '-')}</td>`;
    
    html += `
        <td>
          <button class="edit" onclick="startEdit(${translation.id})">
            ✏️
          </button>
          <button class="delete" onclick="deleteTranslation(${translation.id})">
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
  
  // Перезапускаем поиск, чтобы обновить таблицу
  searchTranslations();
  // Скрываем/показываем поля в форме добавления
  toggleAddFormFields();
}

function toggleAddFormFields() {
  const languageContainers = {
    'english': document.getElementById('englishContainer'),
    'german': document.getElementById('germanContainer'),
    'french': document.getElementById('frenchContainer'),
    'spanish': document.getElementById('spanishContainer'),
    'polish': document.getElementById('polishContainer'),
    'kazakh': document.getElementById('kazakhContainer'),
    'italian': document.getElementById('italianContainer'),
    'belarusian': document.getElementById('belarusianContainer'),
    'ukrainian': document.getElementById('ukrainianContainer'),
    'dutch': document.getElementById('dutchContainer'),
    'kyrgyz': document.getElementById('kyrgyzContainer'),
    'uzbek': document.getElementById('uzbekContainer'),
    'armenian': document.getElementById('armenianContainer')
  };
  
  for (const [lang, container] of Object.entries(languageContainers)) {
    if (visibleLanguages.includes(lang)) {
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  }
}

function startEdit(id) {
  editingId = id;
  
  // Запрашиваем пароль
  const password = prompt('Введите пароль для редактирования:');
  if (password !== 'Proizv_23!') {
    alert('Неверный пароль!');
    return;
  }
  
  // Загружаем данные перевода для редактирования
  fetch(`/api/translations/${id}`)
    .then(response => response.json())
    .then(translation => {
      // Заполняем форму данными
      document.getElementById('russianInput').value = translation.russian || '';
      document.getElementById('englishInput').value = translation.english || '';
      document.getElementById('germanInput').value = translation.german || '';
      document.getElementById('frenchInput').value = translation.french || '';
      document.getElementById('spanishInput').value = translation.spanish || '';
      document.getElementById('polishInput').value = translation.polish || '';
      document.getElementById('kazakhInput').value = translation.kazakh || '';
      document.getElementById('italianInput').value = translation.italian || '';
      document.getElementById('belarusianInput').value = translation.belarusian || '';
      document.getElementById('ukrainianInput').value = translation.ukrainian || '';
      document.getElementById('dutchInput').value = translation.dutch || '';
      document.getElementById('kyrgyzInput').value = translation.kyrgyz || '';
      document.getElementById('uzbekInput').value = translation.uzbek || '';
      document.getElementById('armenianInput').value = translation.armenian || '';
      
      // Меняем кнопку на "Сохранить"
      const addButton = document.querySelector('.add-section button');
      addButton.textContent = 'Сохранить изменения';
      addButton.onclick = updateTranslation;
      
      // Добавляем кнопку отмены
      if (!document.getElementById('cancelButton')) {
        const cancelButton = document.createElement('button');
        cancelButton.id = 'cancelButton';
        cancelButton.textContent = 'Отмена';
        cancelButton.onclick = cancelEdit;
        cancelButton.style.marginLeft = '10px';
        cancelButton.style.background = '#ff4757';
        addButton.parentNode.appendChild(cancelButton);
      }
      
      // Прокручиваем к форме
      document.querySelector('.add-section').scrollIntoView({ behavior: 'smooth' });
    })
    .catch(error => {
      console.error('Ошибка загрузки перевода:', error);
      alert('Ошибка загрузки перевода для редактирования');
    });
}

function cancelEdit() {
  editingId = null;
  clearForm();
  const addButton = document.querySelector('.add-section button');
  addButton.textContent = 'Добавить перевод';
  addButton.onclick = addTranslation;
  
  // Удаляем кнопку отмены
  const cancelButton = document.getElementById('cancelButton');
  if (cancelButton) {
    cancelButton.remove();
  }
}

async function updateTranslation() {
  const russian = document.getElementById('russianInput').value.trim();
  const english = document.getElementById('englishInput').value.trim();
  const german = document.getElementById('germanInput').value.trim();
  const french = document.getElementById('frenchInput').value.trim();
  const spanish = document.getElementById('spanishInput').value.trim();
  const polish = document.getElementById('polishInput').value.trim();
  const kazakh = document.getElementById('kazakhInput').value.trim();
  const italian = document.getElementById('italianInput').value.trim();
  const belarusian = document.getElementById('belarusianInput').value.trim();
  const ukrainian = document.getElementById('ukrainianInput').value.trim();
  const dutch = document.getElementById('dutchInput').value.trim();
  const kyrgyz = document.getElementById('kyrgyzInput').value.trim();
  const uzbek = document.getElementById('uzbekInput').value.trim();
  const armenian = document.getElementById('armenianInput').value.trim();
  
  if (!russian) {
    alert('Поле "Русский" обязательно для заполнения');
    return;
  }
  
  // Пароль уже запрошен в startEdit, но для безопасности можно запросить снова
  const password = prompt('Введите пароль для подтверждения редактирования:');
  if (password !== 'Proizv_23!') {
    alert('Неверный пароль!');
    return;
  }
  
  try {
    const response = await fetch(`/api/translations/${editingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Password': password
      },
      body: JSON.stringify({
        russian,
        english: english || null,
        german: german || null,
        french: french || null,
        spanish: spanish || null,
        polish: polish || null,
        kazakh: kazakh || null,
        italian: italian || null,
        belarusian: belarusian || null,
        ukrainian: ukrainian || null,
        dutch: dutch || null,
        kyrgyz: kyrgyz || null,
        uzbek: uzbek || null,
        armenian: armenian || null
      })
    });
    
    if (response.ok) {
      cancelEdit();
      searchTranslations();
      alert('Перевод успешно обновлен!');
    } else {
      throw new Error('Ошибка при обновлении перевода');
    }
  } catch (error) {
    console.error('Ошибка обновления:', error);
    alert('Ошибка при обновлении перевода');
  }
}

async function addTranslation() {
  const russian = document.getElementById('russianInput').value.trim();
  const english = document.getElementById('englishInput').value.trim();
  const german = document.getElementById('germanInput').value.trim();
  const french = document.getElementById('frenchInput').value.trim();
  const spanish = document.getElementById('spanishInput').value.trim();
  const polish = document.getElementById('polishInput').value.trim();
  const kazakh = document.getElementById('kazakhInput').value.trim();
  const italian = document.getElementById('italianInput').value.trim();
  const belarusian = document.getElementById('belarusianInput').value.trim();
  const ukrainian = document.getElementById('ukrainianInput').value.trim();
  const dutch = document.getElementById('dutchInput').value.trim();
  const kyrgyz = document.getElementById('kyrgyzInput').value.trim();
  const uzbek = document.getElementById('uzbekInput').value.trim();
  const armenian = document.getElementById('armenianInput').value.trim();
  
  if (!russian) {
    alert('Поле "Русский" обязательно для заполнения');
    return;
  }
  
  try {
    const response = await fetch('/api/translations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        russian,
        english: english || null,
        german: german || null,
        french: french || null,
        spanish: spanish || null,
        polish: polish || null,
        kazakh: kazakh || null,
        italian: italian || null,
        belarusian: belarusian || null,
        ukrainian: ukrainian || null,
        dutch: dutch || null,
        kyrgyz: kyrgyz || null,
        uzbek: uzbek || null,
        armenian: armenian || null
      })
    });
    
    if (response.ok) {
      clearForm();
      searchTranslations();
      alert('Перевод успешно добавлен!');
    } else {
      throw new Error('Ошибка при добавлении перевода');
    }
  } catch (error) {
    console.error('Ошибка добавления:', error);
    alert('Ошибка при добавлении перевода');
  }
}

function clearForm() {
  document.querySelectorAll('input').forEach(input => {
    if (input.id !== 'searchInput') {
      input.value = '';
    }
  });
}

async function deleteTranslation(id) {
  if (!confirm('Вы уверены, что хотите удалить этот перевод?')) {
    return;
  }

  // Запрашиваем пароль
  const password = prompt('Введите пароль для удаления:');
  if (password !== 'Proizv_23!') {
    alert('Неверный пароль!');
    return;
  }
  
  try {
    const response = await fetch(`/api/translations/${id}`, {
      method: 'DELETE',
      headers: {
        'X-Password': password
      }
    });
    
    if (response.ok) {
      searchTranslations();
      alert('Перевод успешно удален!');
    } else {
      throw new Error('Ошибка при удалении перевода');
    }
  } catch (error) {
    console.error('Ошибка удаления:', error);
    alert('Ошибка при удалении перевода');
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Инициализация поиска при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  searchTranslations();
  toggleAddFormFields();
});
