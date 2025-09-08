// Добавьте в server.js специальный маршрут для Kaiten iframe
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
        // Перенаправляем на основную страницу переводов
        window.location.href = '/translations';
      </script>
    </body>
    </html>
  `);
});
