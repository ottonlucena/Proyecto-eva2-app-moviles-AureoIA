import type { ImagePickerResult } from 'expo-image-picker';
import type { LocationObject } from 'expo-location';
import type { Ubicacion } from '../types/operacion';
import type { ResultadoPeriferico } from './tipos';

/**
 * Interpretación de lo que devuelven los periféricos.
 *
 * Este módulo concentra las decisiones —¿canceló?, ¿las coordenadas son
 * creíbles?— y no ejecuta nada del dispositivo. Los imports de Expo son
 * `import type`, que TypeScript borra al compilar, así que el archivo no
 * carga ningún módulo nativo y se puede probar en cualquier entorno sin
 * simular la cámara ni el GPS.
 *
 * Separar la decisión de la ejecución es lo que hace verificable la parte del
 * código donde de verdad puede haber un error de lógica.
 */

/**
 * Extrae la ruta de la imagen elegida.
 * El cancelado es un desenlace normal, no un fallo: el usuario cerró la
 * cámara a propósito.
 */
export function interpretarSeleccion(
  resultado: ImagePickerResult,
): ResultadoPeriferico<string> {
  if (resultado.canceled) return { estado: 'cancelado' };

  const primera = resultado.assets[0];

  // Una respuesta no cancelada pero sin imágenes no debería ocurrir; si el
  // sistema la produce, se trata como error y no se guarda una ruta vacía.
  if (primera === undefined || primera.uri.length === 0) {
    return { estado: 'error', mensaje: 'No se recibió ninguna imagen.' };
  }

  return { estado: 'exito', datos: primera.uri };
}

/**
 * Valida las coordenadas que entrega el sistema.
 *
 * Se comprueban los rangos porque un GPS sin fijar puede devolver valores
 * imposibles, y unas coordenadas basura quedarían guardadas en la operación
 * como si fueran buenas.
 */
export function interpretarPosicion(
  posicion: LocationObject,
): ResultadoPeriferico<Ubicacion> {
  const { latitude, longitude } = posicion.coords;

  const sonValidas =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  if (!sonValidas) {
    return { estado: 'error', mensaje: 'Las coordenadas recibidas no son válidas.' };
  }

  return { estado: 'exito', datos: { latitud: latitude, longitud: longitude } };
}

/** Coordenadas legibles: `33.4489° S, 70.6693° O`. */
export function formatearUbicacion(ubicacion: Ubicacion): string {
  const lat = `${Math.abs(ubicacion.latitud).toFixed(4)}° ${ubicacion.latitud >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(ubicacion.longitud).toFixed(4)}° ${ubicacion.longitud >= 0 ? 'E' : 'O'}`;
  return `${lat}, ${lon}`;
}

/**
 * Traduce un permiso denegado al resultado correspondiente.
 *
 * `canAskAgain` en falso significa que el sistema ya no volverá a mostrar el
 * diálogo: la única salida es que el usuario lo habilite a mano, y el mensaje
 * debe decírselo.
 */
export function interpretarPermiso(
  permiso: { granted: boolean; canAskAgain: boolean },
  mensajeNegado: string,
): ResultadoPeriferico<never> | undefined {
  if (permiso.granted) return undefined;

  return {
    estado: 'sin-permiso',
    puedeReintentar: permiso.canAskAgain,
    mensaje: permiso.canAskAgain
      ? mensajeNegado
      : `${mensajeNegado} Habilitalo desde los ajustes del sistema.`,
  };
}
