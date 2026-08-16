import type { DatosOperacion, Operacion } from '../types/operacion';

/**
 * Reglas del diario de operaciones.
 *
 * Son funciones puras: reciben la lista actual y devuelven una lista nueva,
 * sin tocar el estado de React ni el almacenamiento. Eso mantiene la lógica
 * de negocio verificable por sí sola y evita mutaciones accidentales.
 */

/** Un lote estándar de oro equivale a 100 onzas troy. */
export const ONZAS_POR_LOTE = 100;

/** Identificador único: la marca de tiempo evita colisiones entre sesiones. */
export function generarId(): string {
  const aleatorio = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${aleatorio}`;
}

/** Construye una operación nueva a partir de los datos que aportó el usuario. */
export function crearOperacion(datos: DatosOperacion): Operacion {
  return {
    ...datos,
    id: generarId(),
    estado: 'abierta',
    fechaCreacion: new Date().toISOString(),
  };
}

/** Agrega una operación al principio: lo más reciente se ve primero. */
export function agregarOperacion(
  operaciones: readonly Operacion[],
  nueva: Operacion,
): Operacion[] {
  return [nueva, ...operaciones];
}

/** Reemplaza los datos editables de una operación, conservando su identidad. */
export function actualizarOperacion(
  operaciones: readonly Operacion[],
  id: string,
  datos: DatosOperacion,
): Operacion[] {
  return operaciones.map((operacion) =>
    operacion.id === id ? { ...operacion, ...datos } : operacion,
  );
}

export function eliminarOperacion(
  operaciones: readonly Operacion[],
  id: string,
): Operacion[] {
  return operaciones.filter((operacion) => operacion.id !== id);
}

/**
 * Alterna entre abierta y cerrada. Al cerrar se necesita un precio de salida;
 * al reabrir se descarta el que hubiera, porque la operación vuelve a estar
 * en curso y un precio de salida viejo daría un resultado falso.
 */
export function alternarEstado(
  operaciones: readonly Operacion[],
  id: string,
  precioSalida?: number,
): Operacion[] {
  return operaciones.map((operacion) => {
    if (operacion.id !== id) return operacion;

    if (operacion.estado === 'abierta') {
      return {
        ...operacion,
        estado: 'cerrada',
        precioSalida: precioSalida ?? operacion.precioEntrada,
      };
    }

    const { precioSalida: _descartado, ...sinSalida } = operacion;
    return { ...sinSalida, estado: 'abierta' };
  });
}

/**
 * Resultado en dólares de una operación cerrada.
 * En una venta se gana cuando el precio baja, de ahí el signo invertido.
 * Devuelve `undefined` si la operación sigue abierta: todavía no hay resultado.
 */
export function calcularResultado(operacion: Operacion): number | undefined {
  if (operacion.estado !== 'cerrada' || operacion.precioSalida === undefined) {
    return undefined;
  }

  const diferencia =
    operacion.tipo === 'compra'
      ? operacion.precioSalida - operacion.precioEntrada
      : operacion.precioEntrada - operacion.precioSalida;

  return diferencia * operacion.lotes * ONZAS_POR_LOTE;
}

export function contarAbiertas(operaciones: readonly Operacion[]): number {
  return operaciones.filter((operacion) => operacion.estado === 'abierta').length;
}

/** Suma el resultado de todas las operaciones cerradas. */
export function calcularResultadoTotal(operaciones: readonly Operacion[]): number {
  return operaciones.reduce((total, operacion) => {
    return total + (calcularResultado(operacion) ?? 0);
  }, 0);
}
