import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Attachment, DocumentRecord } from './models';
import { config } from './config';
import { httpError } from './errors';

export const filesRouter = Router();
const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const extensions: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.MAX_FILE_SIZE_MB * 1024 * 1024, files: 1 },
});

export async function removeStoredFiles(names: string[]): Promise<void> {
  await Promise.all(
    names.map((name) =>
      unlink(path.join(path.resolve(config.UPLOAD_DIR), name)).catch((error) =>
        console.error('No se pudo retirar el archivo almacenado.', error),
      ),
    ),
  );
}

function validSignature(mime: string, data: Buffer): boolean {
  if (mime === 'application/pdf') return data.subarray(0, 5).toString() === '%PDF-';
  if (mime === 'image/jpeg') return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (mime === 'image/png')
    return data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/webp')
    return data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP';
  return false;
}

filesRouter.post('/documentos/:id/archivos', upload.single('archivo'), async (req, res, next) => {
  try {
    const document = await DocumentRecord.findByPk(req.params.id);
    if (!document) throw httpError(404, 'Documento no encontrado.');
    const file = req.file;
    if (!file) throw httpError(400, 'Seleccioná un archivo.');
    const originalName = (file.originalname.split(/[\\/]/).pop() ?? '')
      .replace(/[\r\n\0]/g, '')
      .slice(0, 255);
    if (!originalName) throw httpError(400, 'El nombre del archivo no es válido.');
    const extension = path.extname(originalName).toLowerCase();
    if (
      !allowed.has(file.mimetype) ||
      !extensions[file.mimetype]?.includes(extension) ||
      !validSignature(file.mimetype, file.buffer)
    )
      throw httpError(
        400,
        'El archivo debe ser un PDF, JPG, PNG o WebP válido con extensión coincidente.',
      );
    const storedName = `${randomUUID()}${file.mimetype === 'application/pdf' ? '.pdf' : file.mimetype === 'image/png' ? '.png' : file.mimetype === 'image/webp' ? '.webp' : '.jpg'}`;
    const directory = path.resolve(config.UPLOAD_DIR);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, storedName), file.buffer, { flag: 'wx', mode: 0o600 });
    try {
      const attachment = await Attachment.create({
        documentId: document.id,
        storedName,
        originalName,
        mimeType: file.mimetype,
        size: file.size,
      });
      res.status(201).json({
        id: attachment.id,
        nombre: attachment.originalName,
        mimeType: attachment.mimeType,
        size: attachment.size,
      });
    } catch (error) {
      await unlink(path.join(directory, storedName)).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

filesRouter.get('/:id/vista-previa', async (req, res, next) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    if (!attachment) throw httpError(404, 'Archivo no encontrado.');
    const data = await readFile(path.join(path.resolve(config.UPLOAD_DIR), attachment.storedName));
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Length', data.length);
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(data);
  } catch (error) {
    next(error);
  }
});

filesRouter.delete('/:id', async (req, res, next) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    if (!attachment) throw httpError(404, 'Archivo no encontrado.');
    await attachment.destroy();
    await unlink(path.join(path.resolve(config.UPLOAD_DIR), attachment.storedName)).catch(
      () => undefined,
    );
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
