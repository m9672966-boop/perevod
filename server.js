const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Serve static files from root
app.use(express.static(__dirname));

// Инициализация базы данных
const db = new sqlite3.Database('./translations.db');

// Создание таблицы переводов
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      russian TEXT NOT NULL,
      english TEXT,
      german TEXT,
      french TEXT,
      spanish TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Проверяем, есть ли уже данные
  db.get("SELECT COUNT(*) as count FROM translations", (err, row) => {
    if (row.count === 0) {
      // Добавляем тестовые данные только если таблица пустая
      const stmt = db.prepare(`
        INSERT INTO translations (russian, english, german, french, spanish)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run('Привет', 'Hello', 'Hallo', 'Bonjour', 'Hola');
      stmt.run('Спасибо', 'Thank you', 'Danke', 'Merci', 'Gracias');
      stmt.run('Пожалуйста', 'You are welcome', 'Bitte', 'De rien', 'De nada');
      
      stmt.finalize();
    }
  });
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

// Serve HTML pages
app.get('/translations', (req, res) => {
  res.sendFile(path.join(__dirname, 'translations.html'));
});

app.get('/client.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'client.js'));
});

app.get('/translations.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'translations.js'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Kaiten Translations Addon is running');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Translation addon server running on port ${PORT}`);
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
