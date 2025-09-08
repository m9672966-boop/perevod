const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const fetch = require('node-fetch');

const app = express();

// Инициализация базы данных
const db = new sqlite3.Database(':memory:');

// Enhanced CORS settings
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Handle preflight requests
app.options('*', cors());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(bodyParser.json());
app.use(express.static(__dirname));

// URL вашего CSV файла на GitHub
const GITHUB_CSV_URL = 'https://raw.githubusercontent.com/m9672966-boop/perevod/main/translations.csv';

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

// Создание таблицы переводов со всеми языками
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Проверяем и импортируем данные при запуске
  db.get("SELECT COUNT(*) as count FROM translations", (err, row) => {
    if (err) {
      console.error('Ошибка проверки базы:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('🔄 База пустая, начинаем импорт...');
      setTimeout(importTranslationsFromGitHub, 1000);
    } else {
      console.log(`✅ В базе уже есть ${row.count} переводов`);
    }
  });
});

// Маршруты API
app.get('/api/translations', (req, res) => {
  const search = req.query.search || '';
  
  db.all(
    `SELECT * FROM translations 
     WHERE russian LIKE ? 
        OR english LIKE ? 
        OR german LIKE ?
        OR french LIKE ?
        OR spanish LIKE ?
        OR polish LIKE ?
        OR kazakh LIKE ?
        OR italian LIKE ?
        OR belarusian LIKE ?
        OR ukrainian LIKE ?
        OR dutch LIKE ?
        OR kyrgyz LIKE ?
        OR uzbek LIKE ?
        OR armenian LIKE ?
     ORDER BY created_at DESC`,
    [
      `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, 
      `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`,
      `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`,
      `%${search}%`, `%${search}%`
    ],
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

app.get('/api/translations/:id', (req, res) => {
  const id = req.params.id;
  
  db.get('SELECT * FROM translations WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Translation not found' });
      return;
    }
    res.json(row);
  });
});

app.post('/api/translations', (req, res) => {
  const { 
    russian, english, german, french, spanish,
    polish, kazakh, italian, belarusian, ukrainian,
    dutch, kyrgyz, uzbek, armenian 
  } = req.body;
  
  if (!russian) {
    return res.status(400).json({ error: 'Russian text is required' });
  }
  
  db.run(`
    INSERT INTO translations (
      russian, english, german, french, spanish,
      polish, kazakh, italian, belarusian, ukrainian,
      dutch, kyrgyz, uzbek, armenian
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      russian, english, german, french, spanish,
      polish, kazakh, italian, belarusian, ukrainian,
      dutch, kyrgyz, uzbek, armenian
    ],
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

// Новый метод для обновления перевода
app.put('/api/translations/:id', (req, res) => {
  const id = req.params.id;
  const { 
    russian, english, german, french, spanish,
    polish, kazakh, italian, belarusian, ukrainian,
    dutch, kyrgyz, uzbek, armenian 
  } = req.body;
  
  if (!russian) {
    return res.status(400).json({ error: 'Russian text is required' });
  }
  
  db.run(`
    UPDATE translations SET 
      russian = ?, english = ?, german = ?, french = ?, spanish = ?,
      polish = ?, kazakh = ?, italian = ?, belarusian = ?, ukrainian = ?,
      dutch = ?, kyrgyz = ?, uzbek = ?, armenian = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      russian, english, german, french, spanish,
      polish, kazakh, italian, belarusian, ukrainian,
      dutch, kyrgyz, uzbek, armenian, id
    ],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Translation not found' });
        return;
      }
      res.json({ message: 'Translation updated successfully' });
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

// Специальный маршрут для Kaiten iframe
app.get('/kaiten-iframe', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Translations</title>
      <base target="_top">
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: 'Roboto', Arial, sans-serif;
          background: #f9f9f9;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🌐 Управление переводами</h1>
        <p>Загрузка интерфейса переводов...</p>
      </div>
      <script>
        window.location.href = '/translations';
      </script>
    </body>
    </html>
  `);
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

// Debug endpoint
app.get('/debug-info', (req, res) => {
  res.json({
    status: 'online',
    url: 'https://perevod-zgw8.onrender.com',
    timestamp: new Date().toISOString(),
    kaitenSdk: 'https://files.kaiten.ru/web-sdk/v1.min.js',
    endpoints: {
      main: '/',
      translations: '/translations',
      api: '/api/translations',
      health: '/health',
      test: '/test',
      kaitenIframe: '/kaiten-iframe',
      refresh: '/api/refresh-translations'
    }
  });
});

// Check files endpoint
app.get('/check-files', (req, res) => {
  const files = ['index.html', 'translations.html', 'translations.js'];
  const results = {};
  
  files.forEach(file => {
    try {
      const exists = fs.existsSync(path.join(__dirname, file));
      results[file] = exists ? '✅ EXISTS' : '❌ MISSING';
    } catch (error) {
      results[file] = '❌ ERROR: ' + error.message;
    }
  });
  
  res.json(results);
});

// Ping endpoint
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    message: 'Server is responding' 
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
        <li><a href="/debug-info">/debug-info</a> - Debug information</li>
        <li><a href="/check-files">/check-files</a> - File check</li>
        <li><a href="/api/refresh-translations" onclick="fetch(this.href, {method: 'POST'}); return false;">/api/refresh-translations</a> - Refresh translations (POST)</li>
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
  console.log(`📁 CSV source: ${GITHUB_CSV_URL}`);
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
