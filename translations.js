let currentSearchTimeout = null;

async function searchTranslations() {
  const searchTerm = document.getElementById('searchInput').value.trim();
  
  // Дебаунс поиска
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
          <th>Английский</th>
          <th>Немецкий</th>
          <th>Французский</th>
          <th>Испанский</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  translations.forEach(translation => {
    html += `
      <tr>
        <td>${escapeHtml(translation.russian)}</td>
        <td>${escapeHtml(translation.english || '-')}</td>
        <td>${escapeHtml(translation.german || '-')}</td>
        <td>${escapeHtml(translation.french || '-')}</td>
        <td>${escapeHtml(translation.spanish || '-')}</td>
        <td>
          <button class="delete" onclick="deleteTranslation(${translation.id})">
            Удалить
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

async function addTranslation() {
  const russian = document.getElementById('russianInput').value.trim();
  const english = document.getElementById('englishInput').value.trim();
  const german = document.getElementById('germanInput').value.trim();
  const french = document.getElementById('frenchInput').value.trim();
  const spanish = document.getElementById('spanishInput').value.trim();
  
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
        spanish: spanish || null
      })
    });
    
    if (response.ok) {
      // Очищаем поля ввода
      document.getElementById('russianInput').value = '';
      document.getElementById('englishInput').value = '';
      document.getElementById('germanInput').value = '';
      document.getElementById('frenchInput').value = '';
      document.getElementById('spanishInput').value = '';
      
      // Обновляем результаты поиска
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

async function deleteTranslation(id) {
  if (!confirm('Вы уверены, что хотите удалить этот перевод?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/translations/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      // Обновляем результаты поиска
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
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Инициализация поиска при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  searchTranslations();
});
