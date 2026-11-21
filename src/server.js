const app = require('./app');
const { initDb } = require('./db');

const PORT = process.env.PORT || 8080;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`ShopLite API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });