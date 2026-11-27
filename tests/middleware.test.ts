import express from 'express';
import request from 'supertest';
import session from 'express-session';
import { describe, expect, it, vi } from 'vitest';
import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from 'sequelize';
import { MulterError } from 'multer';
import { ZodError, z } from 'zod';
import { errorHandler, httpError } from '../src/middleware/error-handler';
import { issueCsrf, requireAuth, requireCsrf } from '../src/middleware/security';

function appWithError(error: unknown) {
  const app = express();
  app.get('/', (_req, _res, next) => next(error));
  app.use(errorHandler);
  return app;
}

describe('middleware de errores', () => {
  it('mapea conflictos de unicidad a 409', async () => {
    const error = new UniqueConstraintError({ message: 'duplicado' });
    const response = await request(appWithError(error)).get('/');
    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/ya existe/i);
  });

  it('mapea referencias inexistentes a 400', async () => {
    const response = await request(appWithError(new ForeignKeyConstraintError({}))).get('/');
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/registro inexistente/i);
  });

  it('devuelve errores de validación de Sequelize como 400', async () => {
    const response = await request(appWithError(new ValidationError('dato inválido', []))).get('/');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('dato inválido');
  });

  it('incluye el campo y el mensaje de cada error de Zod', async () => {
    let error: ZodError;
    try {
      z.object({ nombre: z.string() }).parse({ nombre: 2 });
      throw new Error('Se esperaba un error de validación');
    } catch (caught) {
      if (!(caught instanceof ZodError)) throw caught;
      error = caught;
    }
    const response = await request(appWithError(error!)).get('/');
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/datos enviados/i);
    expect(response.body.detalles[0].campo).toBe('nombre');
    expect(response.body.detalles[0].mensaje).toEqual(expect.any(String));
  });

  it('distingue el límite de tamaño de otros errores de Multer', async () => {
    const sizeResponse = await request(appWithError(new MulterError('LIMIT_FILE_SIZE'))).get('/');
    const otherResponse = await request(appWithError(new MulterError('LIMIT_UNEXPECTED_FILE'))).get(
      '/',
    );
    expect(sizeResponse.status).toBe(400);
    expect(sizeResponse.body.error).toMatch(/tamaño máximo/i);
    expect(otherResponse.status).toBe(400);
    expect(otherResponse.body.error).toMatch(/no pudo procesarse/i);
  });

  it('conserva errores HTTP conocidos y oculta detalles de errores internos', async () => {
    const client = await request(appWithError(httpError(422, 'Entrada incorrecta'))).get('/');
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const internal = await request(appWithError(new Error('secreto interno'))).get('/');
    expect(client.status).toBe(422);
    expect(client.body.error).toBe('Entrada incorrecta');
    expect(internal.status).toBe(500);
    expect(internal.body.error).toMatch(/error interno/i);
    expect(internal.body.error).not.toContain('secreto');
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });
});

function securityApp() {
  const app = express();
  app.use(
    session({
      secret: 'middleware-test-secret-long-enough-123456',
      resave: false,
      saveUninitialized: true,
    }),
  );
  app.get('/auth', requireAuth, (_req, res) => res.json({ ok: true }));
  app.post(
    '/session',
    (req, _res, next) => {
      req.session.userId = 'test-user';
      next();
    },
    (_req, res) => res.status(204).end(),
  );
  app.get('/csrf', issueCsrf);
  app.post('/protected', requireAuth, requireCsrf, (_req, res) => res.json({ ok: true }));
  return app;
}

describe('middleware de sesión y CSRF', () => {
  it('rechaza sesiones sin usuario autenticado', async () => {
    const response = await request(securityApp()).get('/auth');
    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/iniciar sesión/i);
  });

  it('crea un token CSRF y lo reutiliza dentro de la sesión', async () => {
    const agent = request.agent(securityApp());
    const first = await agent.get('/csrf');
    const second = await agent.get('/csrf');
    expect(first.status).toBe(200);
    expect(first.body.token).toMatch(/^[a-f0-9]{64}$/);
    expect(second.body.token).toBe(first.body.token);
  });

  it('rechaza token CSRF ausente o incorrecto', async () => {
    const agent = request.agent(securityApp());
    await agent.post('/session');
    await agent.get('/csrf');
    const missing = await agent.post('/protected');
    const invalid = await agent.post('/protected').set('x-csrf-token', 'incorrecto');
    expect(missing.status).toBe(403);
    expect(invalid.status).toBe(403);
  });

  it('permite la mutación con sesión y token CSRF válidos', async () => {
    const agent = request.agent(securityApp());
    await agent.post('/session');
    const csrf = await agent.get('/csrf');
    const response = await agent.post('/protected').set('x-csrf-token', csrf.body.token);
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });
});
