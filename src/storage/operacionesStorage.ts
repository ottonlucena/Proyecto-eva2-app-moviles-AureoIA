import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Operacion } from '../types/operacion';

/**
 * Persistencia local del diario de operaciones.
 *
 * El diario vive en el dispositivo, así que la app funciona completa sin
 * conexión a internet. La sincronización con la API externa se apoya sobre
 * esta capa, nunca la reemplaza.
 *
 * El parseo y la validación se exponen como funciones puras para poder
 * probarlos sin depender del almacenamiento real.
 */

export const CLAVE_OPERACIONES = '@aureo:operaciones';

/**
 * Verifica que un valor recuperado del almacenamiento tenga la forma de una
 * operación. Lo guardado en el dispositivo puede venir de una versión previa
 * de la app o estar corrupto, así que nada se da por sentado.
 */
export function esOperacionValida(valor: unknown): valor is Operacion {
  if (typeof valor !== 'object' || valor === null) return false;

  const posible = valor as Record<string, unknown>;

  const tieneCamposObligatorios =
    typeof posible.id === 'string' &&
    posible.id.length > 0 &&
    (posible.tipo === 'compra' || posible.tipo === 'venta') &&
    typeof posible.precioEntrada === 'number' &&
    Number.isFinite(posible.precioEntrada) &&
    typeof posible.lotes === 'number' &&
    Number.isFinite(posible.lotes) &&
    typeof posible.notas === 'string' &&
    (posible.estado === 'abierta' || posible.estado === 'cerrada') &&
    typeof posible.fechaCreacion === 'string';

  if (!tieneCamposObligatorios) return false;

  if (
    posible.precioSalida !== undefined &&
    (typeof posible.precioSalida !== 'number' || !Number.isFinite(posible.precioSalida))
  ) {
    return false;
  }

  if (posible.fotoUri !== undefined && typeof posible.fotoUri !== 'string') {
    return false;
  }

  if (posible.ubicacion !== undefined) {
    const ubicacion = posible.ubicacion as Record<string, unknown> | null;
    if (
      typeof ubicacion !== 'object' ||
      ubicacion === null ||
      typeof ubicacion.latitud !== 'number' ||
      typeof ubicacion.longitud !== 'number'
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Convierte el texto crudo del almacenamiento en operaciones utilizables.
 * Descarta las entradas inválidas en lugar de fallar: es preferible perder
 * un registro dañado a dejar al usuario sin su diario.
 */
export function parsearOperaciones(crudo: string | null): Operacion[] {
  if (crudo === null || crudo.length === 0) return [];

  try {
    const parseado: unknown = JSON.parse(crudo);
    if (!Array.isArray(parseado)) return [];
    return parseado.filter(esOperacionValida);
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
