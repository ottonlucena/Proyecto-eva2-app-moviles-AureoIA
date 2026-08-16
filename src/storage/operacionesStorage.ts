import AsyncStorage from '@react-native-async-storage/async-storage';
import { filtrarOperacionesValidas } from '../domain/validacion';
import type { Operacion } from '../types/operacion';

/**
 * Persistencia local del diario de operaciones.
 *
 * El diario vive en el dispositivo, así que la app funciona completa sin
 * conexión a internet. La sincronización con la API externa se apoya sobre
 * esta capa, nunca la reemplaza.
 *
 * El parseo se expone como función pura para poder probarlo sin depender del
 * almacenamiento real.
 */

export const CLAVE_OPERACIONES = '@aureo:operaciones';

/**
 * Convierte el texto crudo del almacenamiento en operaciones utilizables.
 * Descarta las entradas inválidas en lugar de fallar: es preferible perder
 * un registro dañado a dejar al usuario sin su diario.
 */
export function parsearOperaciones(crudo: string | null): Operacion[] {
  if (crudo === null || crudo.length === 0) return [];

  try {
    const parseado: unknown = JSON.parse(crudo);
    return filtrarOperacionesValidas(parseado);
  } catch {
    return [];
  }
}

/** Lee el diario completo desde el dispositivo. */
export async function cargarOperaciones(): Promise<Operacion[]> {
  const crudo = await AsyncStorage.getItem(CLAVE_OPERACIONES);
  return parsearOperaciones(crudo);
}

/** Reemplaza el diario guardado en el dispositivo. */
export async function guardarOperaciones(operaciones: Operacion[]): Promise<void> {
  await AsyncStorage.setItem(CLAVE_OPERACIONES, JSON.stringify(operaciones));
}
