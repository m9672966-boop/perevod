const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Инициализация базы данных
const db = new sqlite3.Database('translations.db'); // Файл будет создан автоматически

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
});

// API маршруты
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

