const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Инициализация базы данных
const db = new sqlite3.Database(':memory:'); // Используем память, можно заменить на файл

// Создание таблицы переводов
db.serialize(() => {
  db.run(`
    CREATE TABLE translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      russian TEXT NOT NULL,
      english TEXT,
      german TEXT,
      french TEXT,
      spanish TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Добавляем тестовые данные
  const stmt = db.prepare(`
    INSERT INTO translations (russian, english, german, french, spanish)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run('Привет', 'Hello', 'Hallo', 'Bonjour', 'Hola');
  stmt.run('Спасибо', 'Thank you', 'Danke', 'Merci', 'Gracias');
  stmt.run('Пожалуйста', 'You are welcome', 'Bitte', 'De rien', 'De nada');
  
  stmt.finalize();
});

// Маршруты API
app.get('/api/translations', (req, res) => {
  const search = req.query.search || '';
  
  db.all(
    `SELECT * FROM translations 
     WHERE russian LIKE ? 
     ORDER BY created_at DESC`,
    [`%${search}%`],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

app.post('/api/translations', (req, res) => {
  const { russian, english, german, french, spanish } = req.body;
  
  db.run(
    `INSERT INTO translations (russian, english, german, french, spanish)
     VALUES (?, ?, ?, ?, ?)`,
    [russian, english, german, french, spanish],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Translation added successfully' });
    }
  );
});

app.delete('/api/translations/:id', (req, res) => {
  const id = req.params.id;
  
  db.run(
    'DELETE FROM translations WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Translation deleted successfully' });
    }
  );
});

// Маршрут для страницы переводов
app.get('/translations', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'translations.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Translation addon server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});