import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

describe('API HTTP y protección de rutas', () => {
  let app: Express;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
    process.env.SESSION_SECRET = 'a-long-test-session-secret-with-more-than-32-chars';
    process.env.INITIAL_USERNAME = 'test-user';
    process.env.INITIAL_EMAIL = 'test@example.com';
    process.env.INITIAL_PASSWORD = 'Test-Password-Only-For-Tests';
    process.env.SMTP_HOST = '';
    const server = await import('../src/server');
    app = server.app;
  });

  it('expone el healthcheck sin requerir sesión', async () => {
    const response = await request(app).get('/api/salud');
    expect(response.status).toBe(200);
    expect(response.body.estado).toBe('ok');
  });

  it('rechaza consultas privadas sin autenticación', async () => {
    const response = await request(app).get('/api/legajos');
    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/iniciar sesión/i);
  });

  it('rechaza mutaciones privadas sin autenticación', async () => {
    const response = await request(app).post('/api/legajos').send({ numero: 'test' });
    expect(response.status).toBe(401);
  });

  it('valida credenciales antes de consultar la base de datos', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ identifier: '', password: '' });
    expect(response.status).toBe(400);
  });

  it('no simula recuperación cuando el proveedor de correo no está configurado', async () => {
    const response = await request(app)
      .post('/api/auth/recuperacion')
      .send({ email: 'test@example.com' });
    expect(response.status).toBe(503);
  });
});
