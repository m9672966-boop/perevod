let currentSearchTimeout = null;

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
          <th>Английский</th>
          <th>Немецкий</th>
          <th>Французский</th>
          <th>Испанский</th>
          <th>Польский</th>
          <th>Казахский</th>
          <th>Итальянский</th>
          <th>Белорусский</th>
          <th>Украинский</th>
          <th>Голландский</th>
          <th>Киргизский</th>
          <th>Узбекский</th>
          <th>Армянский</th>
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
        <td>${escapeHtml(translation.polish || '-')}</td>
        <td>${escapeHtml(translation.kazakh || '-')}</td>
        <td>${escapeHtml(translation.italian || '-')}</td>
        <td>${escapeHtml(translation.belarusian || '-')}</td>
        <td>${escapeHtml(translation.ukrainian || '-')}</td>
        <td>${escapeHtml(translation.dutch || '-')}</td>
        <td>${escapeHtml(translation.kyrgyz || '-')}</td>
        <td>${escapeHtml(translation.uzbek || '-')}</td>
        <td>${escapeHtml(translation.armenian || '-')}</td>
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
      // Очищаем все поля ввода
      document.querySelectorAll('input').forEach(input => {
        if (input.id !== 'searchInput') {
          input.value = '';
        }
      });
      
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
});
