const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csv = require('csv-parser');

// Подключаемся к ФАЙЛУ базы данных, а не к памяти
const db = new sqlite3.Database('translations.db');

db.serialize(() => {
  // Сначала удаляем старую таблицу, если она есть (на случай повторного запуска)
  db.run(`DROP TABLE IF EXISTS translations`);

  // Создаем таблицу заново
  db.run(`CREATE TABLE translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    russian TEXT NOT NULL,
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
    armenian TEXT
  )`);

  // ... остальной код импорта из CSV ...
  const results = [];
  fs.createReadStream('translations.csv')
    .pipe(csv({ separator: ';' }))
    .on('data', (data) => {
      if (data['НА ПЕРЕВОД'] && data['НА ПЕРЕВОД'].trim() !== '') {
        results.push({
          russian: data['НА ПЕРЕВОД'].trim(),
          english: data['EN: английский']?.trim() || null,
          // ... добавьте все остальные поля ...
          armenian: data['Армянский']?.trim() || null
        });
      }
    })
    .on('end', () => {
      const stmt = db.prepare(`INSERT INTO translations 
        (russian, english, german, french, spanish, polish, kazakh, italian, belarusian, ukrainian, dutch, kyrgyz, uzbek, armenian) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      results.forEach(row => {
        stmt.run([
          row.russian, row.english, row.german, row.french, row.spanish, 
          row.polish, row.kazakh, row.italian, row.belarusian, row.ukrainian,
          row.dutch, row.kyrgyz, row.uzbek, row.armenian
        ]);
      });
      
      stmt.finalize();
      console.log(`Импортировано ${results.length} записей в файл translations.db`);
      db.close(); // Закрываем соединение после импорта
    });
});
