const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();

// Enhanced CORS settings
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(bodyParser.json());
app.use(express.static(__dirname));

// Инициализация базы данных в памяти (для Render)
const db = new sqlite3.Database(':memory:');

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
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

app.post('/api/translations', (req, res) => {
  const { russian, english, german, french, spanish } = req.body;
  
  if (!russian) {
    return res.status(400).json({ error: 'Russian text is required' });
  }
  
  db.run(
    `INSERT INTO translations (russian, english, german, french, spanish)
     VALUES (?, ?, ?, ?, ?)`,
    [russian, english, german, french, spanish],
    function(err) {
      if (err) {
        console.error('Database error:', err);
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
        console.error('Database error:', err);
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
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'client.js'));
});

app.get('/translations.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'translations.js'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Kaiten Translations Addon is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kaiten Translations Addon</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .status { color: green; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>Kaiten Translations Addon</h1>
      <p class="status">✅ Server is running successfully</p>
      <p>Test endpoints:</p>
      <ul>
        <li><a href="/test">/test</a> - JSON test</li>
        <li><a href="/health">/health</a> - Health check</li>
        <li><a href="/translations">/translations</a> - Translations UI</li>
      </ul>
    </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Translation addon server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
