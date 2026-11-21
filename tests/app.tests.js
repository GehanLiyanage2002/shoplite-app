const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/db');

jest.mock('../src/db', () => ({
  pool: { query: jest.fn() },
  initDb: jest.fn(),
}));

describe('ShopLite API Endpoints', () => {
  afterEach(() => jest.clearAllMocks());

  test('GET /health returns 200 when DB is reachable', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/products returns product list', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Mechanical Keyboard', price: '89.99', stock: 15 }],
    });
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].name).toBe('Mechanical Keyboard');
  });

  test('POST /api/products validates required fields', async () => {
    const res = await request(app).post('/api/products').send({ stock: 5 });
    expect(res.statusCode).toBe(400);
  });
});