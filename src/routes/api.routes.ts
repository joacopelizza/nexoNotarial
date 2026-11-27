import { Router } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { z } from 'zod';
import {
  Attachment,
  Category,
  DocumentCategory,
  DocumentPerson,
  DocumentRecord,
  DocumentTag,
  Legajo,
  Person,
  Priority,
  Tag,
} from '../models';
import { httpError } from '../middleware/error-handler';
import { documentInputSchema, documentStates, isPossibleDuplicate } from '../domain/document';

export const apiRouter = Router();

async function ensureRelationIds(
  personIds: string[] = [],
  categoryIds: string[] = [],
  tagIds: string[] = [],
): Promise<void> {
  const people = [...new Set(personIds)];
  const categories = [...new Set(categoryIds)];
  const tags = [...new Set(tagIds)];
  if (
    people.length &&
    (await Person.count({ where: { id: { [Op.in]: people } } })) !== people.length
  )
    throw httpError(400, 'Una de las personas seleccionadas no existe.');
  if (
    categories.length &&
    (await Category.count({ where: { id: { [Op.in]: categories } } })) !== categories.length
  )
    throw httpError(400, 'Una de las categorías seleccionadas no existe.');
  if (tags.length && (await Tag.count({ where: { id: { [Op.in]: tags } } })) !== tags.length)
    throw httpError(400, 'Una de las etiquetas seleccionadas no existe.');
}
const legajoInput = z.object({ numero: z.string().trim().min(1).max(40) });
const personInput = z.object({
  nombre: z.string().trim().min(2).max(180),
  identificacion: z.string().trim().max(40).nullable().optional(),
  domicilio: z.string().trim().max(300).nullable().optional(),
  telefono: z.string().trim().max(40).nullable().optional(),
  email: z
    .union([z.string().email().max(254), z.literal('')])
    .nullable()
    .optional(),
  observaciones: z.string().max(5000).nullable().optional(),
});

apiRouter.get('/estados', (_req, res) => res.json(documentStates));

apiRouter.get('/legajos', async (_req, res, next) => {
  try {
    res.json(
      await Legajo.findAll({
        include: [{ model: DocumentRecord, as: 'documentos', attributes: ['id'] }],
        order: [['numero', 'ASC']],
      }),
    );
  } catch (e) {
    next(e);
  }
});
apiRouter.post('/legajos', async (req, res, next) => {
  try {
    const value = legajoInput.parse(req.body);
    res.status(201).json(await Legajo.create(value));
  } catch (e) {
    next(e);
  }
});
apiRouter.put('/legajos/:id', async (req, res, next) => {
  try {
    const value = legajoInput.parse(req.body);
    const row = await Legajo.findByPk(req.params.id);
    if (!row) throw httpError(404, 'Legajo no encontrado.');
    await row.update(value);
    res.json(row);
  } catch (e) {
    next(e);
  }
});
apiRouter.delete('/legajos/:id', async (req, res, next) => {
  try {
    const row = await Legajo.findByPk(req.params.id);
    if (!row) throw httpError(404, 'Legajo no encontrado.');
    await row.destroy();
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

apiRouter.get('/personas', async (req, res, next) => {
  try {
    const q = String(req.query.q ?? '').trim();
    res.json(
      await Person.findAll({
        where: q ? { nombre: { [Op.iLike]: `%${q}%` } } : undefined,
        order: [['nombre', 'ASC']],
      }),
    );
  } catch (e) {
    next(e);
  }
});
apiRouter.post('/personas', async (req, res, next) => {
  try {
    res.status(201).json(await Person.create(personInput.parse(req.body)));
  } catch (e) {
    next(e);
  }
});
apiRouter.put('/personas/:id', async (req, res, next) => {
  try {
    const row = await Person.findByPk(req.params.id);
    if (!row) throw httpError(404, 'Persona no encontrada.');
    await row.update(personInput.parse(req.body));
    res.json(row);
  } catch (e) {
    next(e);
  }
});
apiRouter.delete('/personas/:id', async (req, res, next) => {
  try {
    const row = await Person.findByPk(req.params.id);
    if (!row) throw httpError(404, 'Persona no encontrada.');
    await row.destroy();
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

apiRouter.get('/categorias', async (_req, res, next) => {
  try {
    res.json(await Category.findAll({ order: [['nombre', 'ASC']] }));
  } catch (e) {
    next(e);
  }
});
apiRouter.post('/categorias', async (req, res, next) => {
  try {
    const input = z
      .object({
        nombre: z.string().trim().min(1).max(100),
        parentId: z.string().uuid().nullable().optional(),
      })
      .parse(req.body);
    if (input.parentId && !(await Category.findByPk(input.parentId)))
      throw httpError(400, 'La categoría padre no existe.');
    res.status(201).json(await Category.create(input));
  } catch (e) {
    next(e);
  }
});
apiRouter.put('/categorias/:id', async (req, res, next) => {
  try {
    const row = await Category.findByPk(req.params.id);
    if (!row) throw httpError(404, 'Categoría no encontrada.');
    const input = z
      .object({ nombre: z.string().trim().min(1).max(100), parentId: z.string().uuid().nullable() })
      .parse(req.body);
    if (input.parentId === row.id)
      throw httpError(400, 'Una categoría no puede ser su propia subcategoría.');
    await row.update(input);
    res.json(row);
  } catch (e) {
    next(e);
  }
});
apiRouter.delete('/categorias/:id', async (req, res, next) => {
  try {
    const row = await Category.findByPk(req.params.id);
    if (!row) throw httpError(404, 'Categoría no encontrada.');
    await row.destroy();
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

apiRouter.get('/etiquetas', async (_req, res, next) => {
  try {
    res.json(await Tag.findAll({ order: [['nombre', 'ASC']] }));
  } catch (e) {
    next(e);
  }
});
apiRouter.post('/etiquetas', async (req, res, next) => {
  try {
    const input = z.object({ nombre: z.string().trim().min(1).max(60) }).parse(req.body);
    res.status(201).json(await Tag.create(input));
  } catch (e) {
    next(e);
  }
});
apiRouter.delete('/etiquetas/:id', async (req, res, next) => {
  try {
    const row = await Tag.findByPk(req.params.id);
    if (!row) throw httpError(404, 'Etiqueta no encontrada.');
    await row.destroy();
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

apiRouter.get('/prioridades', async (_req, res, next) => {
  try {
    res.json(await Priority.findAll({ order: [['orden', 'ASC']] }));
  } catch (e) {
    next(e);
  }
});
apiRouter.put('/prioridades', async (req, res, next) => {
  try {
    const input = z
      .array(
        z.object({
          id: z.string().uuid(),
          nombre: z.string().trim().min(1).max(60),
          orden: z.number().int().min(1).max(5),
        }),
      )
      .length(5)
      .parse(req.body);
    if (new Set(input.map((x) => x.id)).size !== 5 || new Set(input.map((x) => x.orden)).size !== 5)
      throw httpError(400, 'Deben enviarse los cinco niveles con órdenes únicos.');
    const { sequelize } = await import('../database/connection');
    await sequelize.transaction(async (transaction) => {
      const existing = await Priority.findAll({ attributes: ['id'], transaction });
      if (
        existing.length !== 5 ||
        existing.some((row) => !input.some((item) => item.id === row.id))
      )
        throw httpError(400, 'La lista debe contener exactamente los cinco niveles existentes.');
      for (const [index, item] of input.entries())
        await Priority.update({ orden: index + 101 }, { where: { id: item.id }, transaction });
      for (const item of input)
        await Priority.update(
          { nombre: item.nombre, orden: item.orden },
          { where: { id: item.id }, transaction },
        );
    });
    res.json(await Priority.findAll({ order: [['orden', 'ASC']] }));
  } catch (e) {
    next(e);
  }
});

apiRouter.get('/documentos', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
    const search = String(req.query.q ?? '').trim();
    const clauses: WhereOptions[] = [];
    if (search)
      clauses.push({
        [Op.or]: [
          { titulo: { [Op.iLike]: `%${search}%` } },
          { numero: { [Op.iLike]: `%${search}%` } },
          { tipo: { [Op.iLike]: `%${search}%` } },
          { descripcion: { [Op.iLike]: `%${search}%` } },
        ],
      });
    const where: WhereOptions = clauses.length ? { [Op.and]: clauses } : {};
    for (const field of ['legajoId', 'prioridadId', 'estado'] as const)
      if (req.query[field]) Object.assign(where, { [field]: req.query[field] });
    if (req.query.numero)
      Object.assign(where, { numero: { [Op.iLike]: `%${String(req.query.numero)}%` } });
    if (req.query.fechaDesde || req.query.fechaHasta) {
      const dateField =
        req.query.fechaCampo === 'fechaIncorporacion' ? 'fechaIncorporacion' : 'fechaEmision';
      const range: Record<string, string> = {};
      if (req.query.fechaDesde) {
        const value = z.string().date().parse(String(req.query.fechaDesde));
        Object.assign(range, { [Op.gte]: value });
      }
      if (req.query.fechaHasta) {
        const value = z.string().date().parse(String(req.query.fechaHasta));
        Object.assign(range, { [Op.lte]: value });
      }
      Object.assign(where, { [dateField]: range });
    }
    const orderKey = String(req.query.sort ?? 'fechaIncorporacion');
    const allowed = ['fechaIncorporacion', 'titulo', 'numero', 'fechaEmision', 'estado'];
    const order = allowed.includes(orderKey) ? orderKey : 'fechaIncorporacion';
    const direction = String(req.query.direction).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const includes = [
      { model: Legajo, as: 'legajo', attributes: ['id', 'numero'] },
      { model: Priority, as: 'prioridad', attributes: ['id', 'nombre', 'orden'] },
      { model: Person, as: 'personas', through: { attributes: ['rol'] } },
      {
        model: Category,
        as: 'categorias',
        ...(req.query.categoriaId
          ? { where: { id: String(req.query.categoriaId) }, required: true }
          : {}),
      },
      {
        model: Tag,
        as: 'etiquetas',
        ...(req.query.etiquetaId
          ? { where: { id: String(req.query.etiquetaId) }, required: true }
          : {}),
      },
      { model: Attachment, as: 'archivos', attributes: ['id', 'originalName', 'mimeType', 'size'] },
    ];
    const result = await DocumentRecord.findAndCountAll({
      where,
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order:
        orderKey === 'prioridad'
          ? [[{ model: Priority, as: 'prioridad' }, 'orden', direction]]
          : [[order, direction]],
      include: includes,
    });
    res.json({ rows: result.rows, total: result.count, page, pageSize });
  } catch (e) {
    next(e);
  }
});

apiRouter.get('/documentos/posibles-duplicados', async (req, res, next) => {
  try {
    const input = z
      .object({
        titulo: z.string().trim().min(1).max(220),
        numero: z.string().trim().max(80).optional(),
      })
      .parse(req.query);
    const candidates = await DocumentRecord.findAll({
      where: {
        [Op.or]: [
          { titulo: { [Op.iLike]: input.titulo } },
          ...(input.numero ? [{ numero: { [Op.iLike]: input.numero } }] : []),
        ],
      },
      attributes: ['id', 'titulo', 'numero'],
      limit: 25,
    });
    res.json(candidates.filter((row) => isPossibleDuplicate(input, row)));
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/documentos/:id', async (req, res, next) => {
  try {
    const row = await DocumentRecord.findByPk(req.params.id, {
      include: [
        { model: Legajo, as: 'legajo' },
        { model: Priority, as: 'prioridad' },
        { model: Person, as: 'personas', through: { attributes: ['rol'] } },
        { model: Category, as: 'categorias' },
        { model: Tag, as: 'etiquetas' },
        {
          model: Attachment,
          as: 'archivos',
          attributes: ['id', 'originalName', 'mimeType', 'size'],
        },
      ],
    });
    if (!row) throw httpError(404, 'Documento no encontrado.');
    res.json(row);
  } catch (e) {
    next(e);
  }
});
apiRouter.post('/documentos', async (req, res, next) => {
  try {
    const input = documentInputSchema.parse(req.body);
    if (!(await Legajo.findByPk(input.legajoId)))
      throw httpError(400, 'Todo documento debe pertenecer a un legajo existente.');
    if (!(await Priority.findByPk(input.prioridadId)))
      throw httpError(400, 'La prioridad no existe.');
    await ensureRelationIds(
      input.personas?.map((person) => person.id),
      input.categorias,
      input.etiquetas,
    );
    const duplicateCandidates = await DocumentRecord.findAll({
      where: {
        [Op.or]: [
          { titulo: { [Op.iLike]: input.titulo } },
          ...(input.numero ? [{ numero: input.numero }] : []),
        ],
      },
      attributes: ['id', 'titulo', 'numero'],
      limit: 10,
    });
    const duplicates = duplicateCandidates.filter((existing) =>
      isPossibleDuplicate(input, existing),
    );
    const { sequelize } = await import('../database/connection');
    const { personas, categorias, etiquetas, fechaEmision, ...fields } = input;
    const row = await sequelize.transaction(async (transaction) => {
      const created = await DocumentRecord.create(
        { ...fields, ...(fechaEmision ? { fechaEmision: new Date(fechaEmision) } : {}) },
        { transaction },
      );
      if (personas?.length)
        await DocumentPerson.bulkCreate(
          personas.map((p) => ({ documentId: created.id, personId: p.id, rol: p.rol })),
          { transaction },
        );
      if (categorias?.length)
        await DocumentCategory.bulkCreate(
          categorias.map((categoryId) => ({ documentId: created.id, categoryId })),
          { transaction },
        );
      if (etiquetas?.length)
        await DocumentTag.bulkCreate(
          etiquetas.map((tagId) => ({ documentId: created.id, tagId })),
          { transaction },
        );
      return created;
    });
    res.status(201).json({ documento: row, posiblesDuplicados: duplicates });
  } catch (e) {
    next(e);
  }
});
apiRouter.put('/documentos/:id', async (req, res, next) => {
  try {
    const row = await DocumentRecord.findByPk(req.params.id);
    if (!row) throw httpError(404, 'Documento no encontrado.');
    const input = documentInputSchema.partial().parse(req.body);
    if (input.legajoId && !(await Legajo.findByPk(input.legajoId)))
      throw httpError(400, 'El legajo no existe.');
    if (input.prioridadId && !(await Priority.findByPk(input.prioridadId)))
      throw httpError(400, 'La prioridad no existe.');
    await ensureRelationIds(
      input.personas?.map((person) => person.id),
      input.categorias,
      input.etiquetas,
    );
    const { personas, categorias, etiquetas, fechaEmision, ...fields } = input;
    const { sequelize } = await import('../database/connection');
    await sequelize.transaction(async (transaction) => {
      await row.update(
        {
          ...fields,
          ...(fechaEmision === undefined
            ? {}
            : { fechaEmision: fechaEmision ? new Date(fechaEmision) : null }),
        },
        { transaction },
      );
      if (personas) {
        await DocumentPerson.destroy({ where: { documentId: row.id }, transaction });
        await DocumentPerson.bulkCreate(
          personas.map((p) => ({ documentId: row.id, personId: p.id, rol: p.rol })),
          { transaction },
        );
      }
      if (categorias) {
        await DocumentCategory.destroy({ where: { documentId: row.id }, transaction });
        await DocumentCategory.bulkCreate(
          categorias.map((categoryId) => ({ documentId: row.id, categoryId })),
          { transaction },
        );
      }
      if (etiquetas) {
        await DocumentTag.destroy({ where: { documentId: row.id }, transaction });
        await DocumentTag.bulkCreate(
          etiquetas.map((tagId) => ({ documentId: row.id, tagId })),
          { transaction },
        );
      }
    });
    res.json(
      await DocumentRecord.findByPk(row.id, {
        include: [
          { model: Legajo, as: 'legajo' },
          { model: Priority, as: 'prioridad' },
          { model: Person, as: 'personas', through: { attributes: ['rol'] } },
          { model: Category, as: 'categorias' },
          { model: Tag, as: 'etiquetas' },
        ],
      }),
    );
  } catch (e) {
    next(e);
  }
});
apiRouter.delete('/documentos/:id', async (req, res, next) => {
  try {
    const row = await DocumentRecord.findByPk(req.params.id);
    if (!row) throw httpError(404, 'Documento no encontrado.');
    await row.destroy();
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
