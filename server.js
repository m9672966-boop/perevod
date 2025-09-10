const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Инициализация базы данных
const db = new sqlite3.Database(':memory:');

// Создание таблицы переводов
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

  // Импорт данных из CSV
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
      console.log(`Импортировано ${results.length} записей из CSV`);
    });
});

// API маршруты (остаются без изменений)
app.get('/api/translations', (req, res) => {
  const searchTerm = req.query.search || '';
  
  let query = 'SELECT * FROM translations';
  let params = [];
  
  if (searchTerm) {
    query += ' WHERE russian LIKE ? OR english LIKE ? OR german LIKE ? OR french LIKE ? OR spanish LIKE ? OR polish LIKE ? OR kazakh LIKE ? OR italian LIKE ? OR belarusian LIKE ? OR ukrainian LIKE ? OR dutch LIKE ? OR kyrgyz LIKE ? OR uzbek LIKE ? OR armenian LIKE ?';
    const likeTerm = `%${searchTerm}%`;
    params = Array(14).fill(likeTerm);
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/translations/:id', (req, res) => {
  const id = req.params.id;
  
  db.get('SELECT * FROM translations WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

app.post('/api/translations', (req, res) => {
  const { russian, english, german, french, spanish, polish, kazakh, italian, belarusian, ukrainian, dutch, kyrgyz, uzbek, armenian } = req.body;
  
  db.run(
    `INSERT INTO translations (russian, english, german, french, spanish, polish, kazakh, italian, belarusian, ukrainian, dutch, kyrgyz, uzbek, armenian) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [russian, english, german, french, spanish, polish, kazakh, italian, belarusian, ukrainian, dutch, kyrgyz, uzbek, armenian],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/translations/:id', (req, res) => {
  const id = req.params.id;
  const { russian, english, german, french, spanish, polish, kazakh, italian, belarusian, ukrainian, dutch, kyrgyz, uzbek, armenian } = req.body;
  
  db.run(
    `UPDATE translations SET russian = ?, english = ?, german = ?, french = ?, spanish = ?, polish = ?, kazakh = ?, italian = ?, belarusian = ?, ukrainian = ?, dutch = ?, kyrgyz = ?, uzbek = ?, armenian = ? WHERE id = ?`,
    [russian, english, german, french, spanish, polish, kazakh, italian, belarusian, ukrainian, dutch, kyrgyz, uzbek, armenian, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ changes: this.changes });
    }
  );
});

app.delete('/api/translations/:id', (req, res) => {
  const id = req.params.id;
  
  db.run('DELETE FROM translations WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ changes: this.changes });
  });
});

// Обслуживание HTML страниц
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/translations', (req, res) => {
  res.sendFile(path.join(__dirname, 'translations.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
