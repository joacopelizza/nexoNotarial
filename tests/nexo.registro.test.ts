import { describe, expect, it } from 'vitest';
import { documentInputSchema } from '../src/domain/document';

describe('alta documental', () => {
  const base = {
    titulo: 'Escritura de compraventa',
    tipo: 'Escritura',
    legajoId: '2ddd757d-6d17-4f7f-a4a4-3bdc59243a77',
    prioridadId: 'bd30bd33-3921-4577-ad88-060c063e4617',
  };
  it('acepta un documento sin adjuntos', () =>
    expect(documentInputSchema.safeParse(base).success).toBe(true));
  it('rechaza un título vacío y una referencia a legajo inválida', () => {
    expect(documentInputSchema.safeParse({ ...base, titulo: '  ' }).success).toBe(false);
    expect(documentInputSchema.safeParse({ ...base, legajoId: 'no-es-uuid' }).success).toBe(false);
  });
  it('valida las fechas de emisión como fecha ISO', () => {
    expect(documentInputSchema.safeParse({ ...base, fechaEmision: '2026-05-21' }).success).toBe(
      true,
    );
    expect(documentInputSchema.safeParse({ ...base, fechaEmision: '21/05/2026' }).success).toBe(
      false,
    );
  });
});
