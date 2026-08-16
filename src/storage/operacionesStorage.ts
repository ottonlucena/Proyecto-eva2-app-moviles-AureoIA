import AsyncStorage from '@react-native-async-storage/async-storage';
import { filtrarOperacionesValidas } from '../domain/validacion';
import type { Operacion } from '../types/operacion';
import { claveDiario } from './sesionStorage';

/**
 * Persistencia local del diario de operaciones.
 *
 * El diario vive en el dispositivo y esa es su única fuente: la app funciona
 * completa sin conexión a internet.
 *
 * Cada usuario tiene su propia clave, de modo que dos personas que compartan
 * el teléfono no vean el mismo diario.
 *
 * El parseo se expone como función pura para poder probarlo sin depender del
 * almacenamiento real.
 */

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

/** Lee el diario del usuario indicado. */
export async function cargarOperaciones(usuario: string | undefined): Promise<Operacion[]> {
  const crudo = await AsyncStorage.getItem(claveDiario(usuario));
  return parsearOperaciones(crudo);
}

/** Reemplaza el diario del usuario indicado. */
export async function guardarOperaciones(
  usuario: string | undefined,
  operaciones: Operacion[],
): Promise<void> {
  await AsyncStorage.setItem(claveDiario(usuario), JSON.stringify(operaciones));
}
