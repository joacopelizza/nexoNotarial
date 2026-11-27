import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const models = vi.hoisted(() => {
  const model = () => ({
    findAll: vi.fn().mockResolvedValue([]),
    findByPk: vi.fn().mockResolvedValue(null),
    findAndCountAll: vi.fn().mockResolvedValue({ rows: [], count: 0 }),
    create: vi.fn().mockImplementation(async (value) => ({ id: 'row-id', ...value })),
    update: vi.fn().mockResolvedValue([1]),
    destroy: vi.fn().mockResolvedValue(1),
    count: vi.fn().mockResolvedValue(0),
    bulkCreate: vi.fn().mockResolvedValue([]),
  });
  return {
    Attachment: model(),
    Category: model(),
    DocumentCategory: model(),
    DocumentPerson: model(),
    DocumentRecord: model(),
    DocumentTag: model(),
    Legajo: model(),
    Person: model(),
    Priority: model(),
    Tag: model(),
  };
});

vi.mock('../src/models', () => models);
vi.mock('../src/database/connection', () => ({
  sequelize: { transaction: vi.fn(async (callback) => callback({})) },
}));

import { apiRouter } from '../src/routes/api.routes';
import { errorHandler } from '../src/middleware/error-handler';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);
app.use(errorHandler);

const uuid = 'c4afae9e-0e58-4c70-883a-18f5fa39de0a';
const document = { titulo: 'Poder', tipo: 'Escritura', legajoId: uuid, prioridadId: uuid };

beforeEach(() => {
  for (const entity of Object.values(models)) {
    entity.findAll.mockReset().mockResolvedValue([]);
    entity.findByPk.mockReset().mockResolvedValue(null);
    entity.findAndCountAll.mockReset().mockResolvedValue({ rows: [], count: 0 });
    entity.create.mockReset().mockImplementation(async (value) => ({ id: 'row-id', ...value }));
    entity.update.mockReset().mockResolvedValue([1]);
    entity.destroy.mockReset().mockResolvedValue(1);
    entity.count.mockReset().mockResolvedValue(0);
    entity.bulkCreate.mockReset().mockResolvedValue([]);
  }
});

describe('rutas de mantenimiento', () => {
  it('lista estados, legajos y personas con o sin búsqueda', async () => {
    expect((await request(app).get('/api/estados')).status).toBe(200);
    models.Legajo.findAll.mockResolvedValueOnce([{ id: uuid, numero: '001' }]);
    expect((await request(app).get('/api/legajos')).body).toHaveLength(1);
    await request(app).get('/api/personas?q=ana');
    expect(models.Person.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.any(Object) }),
    );
    await request(app).get('/api/personas');
    expect(models.Person.findAll).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: undefined }),
    );
  });

  it('crea, edita y elimina legajos y personas', async () => {
    const created = await request(app).post('/api/legajos').send({ numero: '  001  ' });
    expect(created.status).toBe(201);
    expect(created.body.numero).toBe('001');
    expect((await request(app).post('/api/legajos').send({ numero: '' })).status).toBe(400);
    models.Legajo.findByPk.mockResolvedValueOnce({
      update: vi.fn(async (v) => Object.assign({ id: uuid }, v)),
      destroy: vi.fn(),
    });
    expect((await request(app).put(`/api/legajos/${uuid}`).send({ numero: '002' })).status).toBe(
      200,
    );
    expect((await request(app).put(`/api/legajos/${uuid}`).send({ numero: '002' })).status).toBe(
      404,
    );
    models.Legajo.findByPk.mockResolvedValueOnce({ destroy: vi.fn() });
    expect((await request(app).delete(`/api/legajos/${uuid}`)).status).toBe(204);
    expect((await request(app).delete(`/api/legajos/${uuid}`)).status).toBe(404);

    expect((await request(app).post('/api/personas').send({ nombre: 'Ana' })).status).toBe(201);
    expect(
      (await request(app).post('/api/personas').send({ nombre: 'A', email: 'mal' })).status,
    ).toBe(400);
    models.Person.findByPk.mockResolvedValueOnce({
      update: vi.fn(async (v) => Object.assign({ id: uuid }, v)),
      destroy: vi.fn(),
    });
    expect(
      (await request(app).put(`/api/personas/${uuid}`).send({ nombre: 'Ana Pérez' })).status,
    ).toBe(200);
    expect(
      (await request(app).put(`/api/personas/${uuid}`).send({ nombre: 'Ana Pérez' })).status,
    ).toBe(404);
    models.Person.findByPk.mockResolvedValueOnce({ destroy: vi.fn() });
    expect((await request(app).delete(`/api/personas/${uuid}`)).status).toBe(204);
    expect((await request(app).delete(`/api/personas/${uuid}`)).status).toBe(404);
  });

  it('administra categorías y etiquetas con sus validaciones', async () => {
    models.Category.findAll.mockResolvedValueOnce([{ id: uuid }]);
    expect((await request(app).get('/api/categorias')).body).toHaveLength(1);
    expect(
      (await request(app).post('/api/categorias').send({ nombre: '  Civil ' })).body.nombre,
    ).toBe('Civil');
    expect(
      (await request(app).post('/api/categorias').send({ nombre: 'Hija', parentId: uuid })).status,
    ).toBe(400);
    models.Category.findByPk.mockResolvedValueOnce({ id: uuid });
    expect(
      (await request(app).post('/api/categorias').send({ nombre: 'Hija', parentId: uuid })).status,
    ).toBe(201);
    expect((await request(app).post('/api/categorias').send({ nombre: '' })).status).toBe(400);
    models.Category.findByPk.mockResolvedValueOnce({ id: uuid, update: vi.fn(), destroy: vi.fn() });
    expect(
      (await request(app).put(`/api/categorias/${uuid}`).send({ nombre: 'Civil', parentId: uuid }))
        .status,
    ).toBe(400);
    models.Category.findByPk.mockResolvedValueOnce({
      id: uuid,
      update: vi.fn(async (v) => Object.assign({ id: uuid }, v)),
      destroy: vi.fn(),
    });
    expect(
      (await request(app).put(`/api/categorias/${uuid}`).send({ nombre: 'Civil', parentId: null }))
        .status,
    ).toBe(200);
    expect(
      (await request(app).put(`/api/categorias/${uuid}`).send({ nombre: 'Civil', parentId: null }))
        .status,
    ).toBe(404);
    models.Category.findByPk.mockResolvedValueOnce({ destroy: vi.fn() });
    expect((await request(app).delete(`/api/categorias/${uuid}`)).status).toBe(204);
    expect((await request(app).delete(`/api/categorias/${uuid}`)).status).toBe(404);

    expect((await request(app).get('/api/etiquetas')).status).toBe(200);
    expect((await request(app).post('/api/etiquetas').send({ nombre: 'Urgente' })).status).toBe(
      201,
    );
    expect((await request(app).post('/api/etiquetas').send({ nombre: '' })).status).toBe(400);
    models.Tag.findByPk.mockResolvedValueOnce({ destroy: vi.fn() });
    expect((await request(app).delete(`/api/etiquetas/${uuid}`)).status).toBe(204);
    expect((await request(app).delete(`/api/etiquetas/${uuid}`)).status).toBe(404);
  });
});

describe('rutas de documentos', () => {
  it('aplica paginación, búsqueda, filtros y orden permitidos', async () => {
    const response = await request(app).get(
      '/api/documentos?page=0&pageSize=500&q=Poder&sort=prioridad&direction=asc&fechaDesde=2025-01-01&fechaHasta=2025-12-31&fechaCampo=fechaIncorporacion&categoriaId=cat&etiquetaId=tag',
    );
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ rows: [], total: 0, page: 1, pageSize: 100 });
    expect(models.DocumentRecord.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0, limit: 100, distinct: true }),
    );
    const filtered = await request(app).get(
      '/api/documentos?legajoId=x&prioridadId=y&estado=Aprobado&numero=12&sort=bogus&direction=asc&fechaHasta=2025-02-02',
    );
    expect(filtered.status).toBe(200);
    expect((await request(app).get('/api/documentos?fechaDesde=no-es-fecha')).status).toBe(400);
  });

  it('busca posibles duplicados y valida la consulta', async () => {
    models.DocumentRecord.findAll.mockResolvedValueOnce([
      { titulo: 'poder', numero: null },
      { titulo: 'otro', numero: 'X-1' },
    ]);
    const response = await request(app).get('/api/documentos/posibles-duplicados?titulo=Poder');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect((await request(app).get('/api/documentos/posibles-duplicados?titulo=')).status).toBe(
      400,
    );
    models.DocumentRecord.findByPk.mockResolvedValueOnce({ id: uuid, titulo: 'Poder' });
    expect((await request(app).get(`/api/documentos/${uuid}`)).status).toBe(200);
    expect((await request(app).get(`/api/documentos/${uuid}`)).status).toBe(404);
  });

  it('valida prerequisitos y registra documento con relaciones opcionales', async () => {
    expect(
      (
        await request(app)
          .post('/api/documentos')
          .send({ ...document, titulo: '' })
      ).status,
    ).toBe(400);
    expect((await request(app).post('/api/documentos').send(document)).status).toBe(400);
    models.Legajo.findByPk.mockResolvedValueOnce({ id: uuid });
    expect((await request(app).post('/api/documentos').send(document)).status).toBe(400);
    models.Legajo.findByPk.mockResolvedValueOnce({ id: uuid });
    models.Priority.findByPk.mockResolvedValueOnce({ id: uuid });
    models.DocumentRecord.findAll.mockResolvedValueOnce([]);
    const created = await request(app)
      .post('/api/documentos')
      .send({ ...document, fechaEmision: '2025-04-03' });
    expect(created.status).toBe(201);
    expect(created.body.documento.titulo).toBe('Poder');
    expect(created.body.posiblesDuplicados).toEqual([]);
  });

  it('edita y elimina documentos existentes, y responde 404 para ids faltantes', async () => {
    const row = { id: uuid, update: vi.fn(), destroy: vi.fn() };
    models.DocumentRecord.findByPk.mockResolvedValueOnce(row);
    models.DocumentRecord.findByPk.mockResolvedValueOnce({ id: uuid, titulo: 'Actualizado' });
    expect(
      (await request(app).put(`/api/documentos/${uuid}`).send({ titulo: 'Actualizado' })).status,
    ).toBe(200);
    expect(row.update).toHaveBeenCalled();
    expect((await request(app).put(`/api/documentos/${uuid}`).send({ titulo: 'X' })).status).toBe(
      404,
    );
    models.DocumentRecord.findByPk.mockResolvedValueOnce(row);
    expect((await request(app).delete(`/api/documentos/${uuid}`)).status).toBe(204);
    expect((await request(app).delete(`/api/documentos/${uuid}`)).status).toBe(404);
  });
});
