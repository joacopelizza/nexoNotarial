import { z } from 'zod';

export const documentStates = [
  'Pendiente',
  'En preparación',
  'En revisión',
  'Aprobado',
  'Finalizado',
  'Archivado',
  'Anulado',
] as const;

export const documentInputSchema = z.object({
  titulo: z.string().trim().min(1).max(220),
  numero: z.string().trim().max(80).nullable().optional(),
  tipo: z.string().trim().min(1).max(80),
  fechaEmision: z.string().date().nullable().optional(),
  descripcion: z.string().max(5000).nullable().optional(),
  legajoId: z.string().uuid(),
  prioridadId: z.string().uuid(),
  estado: z.enum(documentStates).optional(),
  personas: z
    .array(z.object({ id: z.string().uuid(), rol: z.string().trim().min(1).max(80) }))
    .optional(),
  categorias: z.array(z.string().uuid()).optional(),
  etiquetas: z.array(z.string().uuid()).optional(),
});

export function normalizeDuplicateKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es-AR');
}

export function isPossibleDuplicate(
  candidate: { titulo: string; numero?: string | null },
  current: { titulo: string; numero?: string | null },
): boolean {
  const candidateNumber = candidate.numero?.trim();
  const currentNumber = current.numero?.trim();
  return (
    normalizeDuplicateKey(candidate.titulo) === normalizeDuplicateKey(current.titulo) ||
    Boolean(
      candidateNumber &&
      currentNumber &&
      normalizeDuplicateKey(candidateNumber) === normalizeDuplicateKey(currentNumber),
    )
  );
}

export function documentYear(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null;
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date.getUTCFullYear();
}
