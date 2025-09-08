// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');
const fetch = require('node-fetch');
const fs = require('fs');

const app = express();
const GITHUB_CSV_URL = 'https://raw.githubusercontent.com/ВАШ_USERNAME/ВАШ_РЕПОЗИТОРИЙ/main/translations.csv';

// Функция для загрузки CSV из GitHub с разделителем ;
async function importTranslationsFromGitHub() {
  try {
    console.log('📥 Загрузка переводов из GitHub...');
    
    const response = await fetch(GITHUB_CSV_URL);
    if (!response.ok) throw new Error('Ошибка загрузки CSV файла');
    
    const csvData = await response.text();
    const lines = csvData.split('\n').filter(line => line.trim() && !line.startsWith('Комментарий') && !line.startsWith('Иглы'));
    
    let importedCount = 0;
    
    for (const line of lines) {
      const values = line.split(';').map(val => val.trim());
      
      // Пропускаем пустые строки и строки без русского перевода
      if (values.length < 15 || !values[2]) continue;
      
      db.run(`
        INSERT OR IGNORE INTO translations (
          russian, english, german, french, spanish,
          polish, kazakh, italian, belarusian, ukrainian,
          dutch, kyrgyz, uzbek, armenian
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          values[2] || '',  // RU: русский
          values[3] || '',  // EN: английский
          values[6] || '',  // DE: немецкий
          values[7] || '',  // FR: французский
          values[8] || '',  // ES: испанский
          values[4] || '',  // PL: польский
          values[5] || '',  // KZ: казахский
          values[9] || '',  // IT: итальянский
          values[10] || '', // BY: белорусский
          values[11] || '', // UA: украинский
          values[12] || '', // NL: голландский
          values[13] || '', // KG: киргизский
          values[14] || '', // UZ: узбекский
          values[15] || ''  // Армянский
        ],
        function(err) {
          if (err) {
            console.error('Ошибка вставки:', err);
          } else {
            importedCount++;
          }
        }
      );
    }
    
    console.log(`✅ Импортировано ${importedCount} переводов`);
    
  } catch (error) {
    console.error('❌ Ошибка импорта:', error);
  }
}

// Инициализация базы данных
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      russian TEXT NOT NULL UNIQUE,
      english TEXT,
      german TEXT,
      french TEXT,
      spanish TEXT,
      polish TEXT,
      kazakh TEXT,
      italian TEXT,
      belarusian TEXT,
      ukrainian TEXT,
      dutch TEXT,
      kyrgyz TEXT,
      uzbek TEXT,
      armenian TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Проверяем и импортируем данные при запуске
  db.get("SELECT COUNT(*) as count FROM translations", (err, row) => {
    if (err || row.count === 0) {
      setTimeout(importTranslationsFromGitHub, 1000);
    }
  });
});

// Эндпоинт для принудительного обновления
app.post('/api/refresh-translations', async (req, res) => {
  try {
    db.run('DELETE FROM translations', async (err) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка очистки базы' });
      }
      await importTranslationsFromGitHub();
      res.json({ message: 'Переводы успешно обновлены из GitHub' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

// ... остальной код сервера
