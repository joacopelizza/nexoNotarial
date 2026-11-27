import { ErrorRequestHandler } from 'express';
import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from 'sequelize';
import { ZodError } from 'zod';
import { MulterError } from 'multer';

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof UniqueConstraintError) {
    res.status(409).json({ error: 'Ya existe un registro con ese valor.' });
    return;
  }
  if (error instanceof ForeignKeyConstraintError) {
    res
      .status(400)
      .json({ error: 'La operación referencia un registro inexistente o todavía relacionado.' });
    return;
  }
  if (error instanceof ValidationError) {
    res.status(400).json({ error: error.message });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Los datos enviados no son válidos.',
      detalles: error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensaje: issue.message,
      })),
    });
    return;
  }
  if (error instanceof MulterError) {
    res.status(400).json({
      error:
        error.code === 'LIMIT_FILE_SIZE'
          ? 'El archivo supera el tamaño máximo permitido.'
          : 'El archivo no pudo procesarse.',
    });
    return;
  }
  const status =
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
      ? error.status
      : 500;
  const message =
    status < 500 && error instanceof Error ? error.message : 'Ocurrió un error interno.';
  if (status >= 500) console.error(error);
  res.status(status).json({ error: message });
};

export function httpError(status: number, message: string): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}
