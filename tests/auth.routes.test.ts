import express from 'express';
import request from 'supertest';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../src/middleware/error-handler';

const { findOne, findByPk } = vi.hoisted(() => ({ findOne: vi.fn(), findByPk: vi.fn() }));
vi.mock('../src/models', () => ({ User: { findOne, findByPk } }));

let app: express.Express;
let user: {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  recoveryHash: string | null;
  recoveryExpiresAt: Date | null;
  save: ReturnType<typeof vi.fn>;
};

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
  process.env.SESSION_SECRET = 'a-long-test-session-secret-with-more-than-32-chars';
  process.env.INITIAL_USERNAME = 'test-user';
  process.env.INITIAL_EMAIL = 'test@example.com';
  process.env.INITIAL_PASSWORD = 'Test-Password-Only-For-Tests';
  process.env.SMTP_HOST = '';
  const { authRouter } = await import('../src/routes/auth.routes');
  app = express();
  app.use(express.json());
  app.use(
    session({ secret: process.env.SESSION_SECRET!, resave: false, saveUninitialized: false }),
  );
  app.use('/auth', authRouter);
  app.use(errorHandler);
});

beforeEach(async () => {
  user = {
    id: 'user-id',
    username: 'test-user',
    email: 'test@example.com',
    passwordHash: await bcrypt.hash('correct-password', 4),
    recoveryHash: null,
    recoveryExpiresAt: null,
    save: vi.fn().mockResolvedValue(undefined),
  };
  findOne.mockReset().mockResolvedValue(user);
  findByPk.mockReset().mockResolvedValue(user);
});

describe('rutas de autenticación', () => {
  it('rechaza credenciales inválidas y acepta login con nombre o correo', async () => {
    expect(
      (await request(app).post('/auth/login').send({ identifier: '', password: '' })).status,
    ).toBe(400);
    findOne.mockResolvedValueOnce(null);
    expect(
      (await request(app).post('/auth/login').send({ identifier: 'desconocido', password: 'x' }))
        .status,
    ).toBe(401);
    findOne.mockResolvedValueOnce(user);
    expect(
      (
        await request(app)
          .post('/auth/login')
          .send({ identifier: 'test-user', password: 'incorrecta' })
      ).status,
    ).toBe(401);
    findOne.mockResolvedValueOnce(user);
    const response = await request(app)
      .post('/auth/login')
      .send({ identifier: 'TEST@EXAMPLE.COM', password: 'correct-password' });
    expect(response.status).toBe(200);
    expect(response.body.token).toMatch(/^[a-f0-9]{64}$/);
    expect(findOne).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: expect.any(Object) }),
    );
  });

  it('expone el usuario autenticado y rechaza una sesión cuyo usuario ya no existe', async () => {
    const agent = request.agent(app);
    const loggedIn = await agent
      .post('/auth/login')
      .send({ identifier: 'test-user', password: 'correct-password' });
    expect(loggedIn.status).toBe(200);
    const me = await agent.get('/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({ id: 'user-id', username: 'test-user' });
    findByPk.mockResolvedValueOnce(null);
    expect((await agent.get('/auth/me')).status).toBe(401);
  });

  it('requiere token CSRF válido para cerrar sesión', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login').send({ identifier: 'test-user', password: 'correct-password' });
    expect((await agent.post('/auth/logout')).status).toBe(403);
    const csrf = await agent.get('/auth/csrf');
    const response = await agent.post('/auth/logout').set('x-csrf-token', csrf.body.token);
    expect(response.status).toBe(204);
  });

  it('valida la solicitud de restablecimiento y rechaza tokens caducados', async () => {
    expect(
      (await request(app).post('/auth/restablecer').send({ token: 'corto', password: 'short' }))
        .status,
    ).toBe(400);
    findOne.mockResolvedValueOnce(null);
    const response = await request(app)
      .post('/auth/restablecer')
      .send({ token: 'a'.repeat(64), password: 'a-long-enough-password' });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/venció/i);
  });
});
