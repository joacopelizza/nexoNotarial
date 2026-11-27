import { describe, expect, it } from 'vitest';
import { documentYear } from '../src/domain';

describe('organización temporal', () => {
  it('deriva el año desde la fecha registrada y no desde un campo manual', () => {
    expect(documentYear('2024-12-31')).toBe(2024);
    expect(documentYear('2025-01-01')).toBe(2025);
  });
  it('devuelve null cuando no hay una fecha válida', () => {
    expect(documentYear(null)).toBeNull();
    expect(documentYear('')).toBeNull();
    expect(documentYear('no-es-fecha')).toBeNull();
  });
});
