const express = require('express');
const client = require('prom-client');
const { pool } = require('./db');

const app = express();
app.use(express.json());

// Prometheus default + custom HTTP metrics
client.collectDefaultMetrics();
const httpRequestsTotal = new client.Counter({
  name: 'shoplite_http_requests_total',
  help: 'Total HTTP requests processed',
  labelNames: ['method', 'route', 'status'],
});

app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

// Kubernetes Liveness & Readiness Probe
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', version: process.env.APP_VERSION || 'v1' });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

// Prometheus Scrape Endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// CREATE Product
app.post('/api/products', async (req, res) => {
  const { name, price, stock = 0 } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  const { rows } = await pool.query(
    'INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING *',
    [name, price, stock]
  );
  return res.status(201).json(rows[0]);
});

// READ All Products
app.get('/api/products', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM products ORDER BY id DESC');
  return res.json(rows);
});

// UPDATE Product
app.put('/api/products/:id', async (req, res) => {
  const { name, price, stock } = req.body;
  const { rows } = await pool.query(
    'UPDATE products SET name=$1, price=$2, stock=$3 WHERE id=$4 RETURNING *',
    [name, price, stock, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Product not found' });
  return res.json(rows[0]);
});

// DELETE Product
app.delete('/api/products/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Product not found' });
  return res.status(204).send();
});

module.exports = app;