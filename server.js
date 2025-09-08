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
