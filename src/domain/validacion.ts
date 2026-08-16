import type { Operacion } from '../types/operacion';

/**
 * Validación de operaciones que vienen de afuera de la app.
 *
 * Vive en `domain` y no en `storage` porque hay dos fronteras que desconfían
 * de sus datos, no una: lo que se leyó del dispositivo (que pudo escribirlo
 * una versión anterior de la app) y lo que llegó del servidor remoto. Ambas
 * usan exactamente el mismo criterio.
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

/** Filtra una lista desconocida, quedándose solo con las operaciones válidas. */
export function filtrarOperacionesValidas(valor: unknown): Operacion[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter(esOperacionValida);
}
