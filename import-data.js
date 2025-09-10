const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csv = require('csv-parser');

const db = new sqlite3.Database(':memory:');

// Создание таблицы
db.serialize(() => {
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

  // Чтение и импорт CSV данных
  const results = [];
  fs.createReadStream('translations.csv')
    .pipe(csv({ separator: ';' }))
    .on('data', (data) => {
      // Пропускаем пустые строки и заголовки
      if (data['НА ПЕРЕВОД'] && data['НА ПЕРЕВОД'].trim() !== '') {
        results.push({
          russian: data['НА ПЕРЕВОД'].trim(),
          english: data['EN: английский']?.trim() || null,
          german: data['DE: немецкий']?.trim() || null,
          french: data['FR: французский']?.trim() || null,
          spanish: data['ES: испанский']?.trim() || null,
          polish: data['PL: польский']?.trim() || null,
          kazakh: data['KZ: казахский (коррект)']?.trim() || null,
          italian: data['IT: итальянский']?.trim() || null,
          belarusian: data['BY: белорусский']?.trim() || null,
          ukrainian: data['UA: украинский']?.trim() || null,
          dutch: data['NL: голландский/нидерландский']?.trim() || null,
          kyrgyz: data['KG: киргизский']?.trim() || null,
          uzbek: data['UZ: узбекский']?.trim() || null,
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
      console.log(`Импортировано ${results.length} записей`);
    });
});
