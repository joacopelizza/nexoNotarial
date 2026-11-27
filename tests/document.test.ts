import { describe, expect, it } from 'vitest';
import {
  documentInputSchema,
  documentStates,
  isPossibleDuplicate,
  normalizeDuplicateKey,
} from '../src/domain/document';

const validDocument = {
  titulo: 'Poder general',
  tipo: 'Poder',
  legajoId: 'c4afae9e-0e58-4c70-883a-18f5fa39de0a',
  prioridadId: '12f79313-4535-4547-a2df-1ac0b6cc43dc',
};

describe('validación de documentos', () => {
  it('acepta datos completos mínimos y exige que se indique el legajo', () => {
    expect(documentInputSchema.safeParse(validDocument).success).toBe(true);
    const { legajoId: _legajoId, ...withoutLegajo } = validDocument;
    expect(documentInputSchema.safeParse(withoutLegajo).success).toBe(false);
  });

  it('rechaza estados que no forman parte de la lista fija', () => {
    expect(documentStates).toHaveLength(7);
    expect(documentInputSchema.safeParse({ ...validDocument, estado: 'En pausa' }).success).toBe(
      false,
    );
  });

  it('advierte coincidencias exactas de título o número sin bloquear documentos distintos', () => {
    expect(isPossibleDuplicate({ titulo: 'Poder general' }, { titulo: ' poder   general ' })).toBe(
      true,
    );
    expect(
      isPossibleDuplicate({ titulo: 'Acta', numero: 'A-123' }, { titulo: 'Otro', numero: 'a-123' }),
    ).toBe(true);
    expect(isPossibleDuplicate({ titulo: 'Acta de 2024' }, { titulo: 'Acta de 2025' })).toBe(false);
    expect(normalizeDuplicateKey('Escritura   N° 1')).toBe('escritura n° 1');
  });
});
