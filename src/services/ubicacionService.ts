import * as Location from 'expo-location';
import type { Ubicacion } from '../types/operacion';
import { interpretarPermiso, interpretarPosicion } from './interpretes';
import { conTimeout, TiempoAgotadoError, type ResultadoPeriferico } from './tipos';

/**
 * Coordenadas del dispositivo mediante el GPS.
 *
 * Solo se pide permiso en primer plano: la app registra dónde estaba el
 * usuario al anotar una operación, nunca lo sigue en segundo plano. Pedir el
 * permiso mínimo necesario es lo correcto y además evita la revisión extra
 * que las tiendas exigen para el rastreo en segundo plano.
 */

/**
 * Precisión balanceada: del orden de la manzana.
 *
 * Alcanza de sobra para dejar constancia de dónde se registró la operación y
 * consume bastante menos batería que la precisión máxima, que además tarda
 * mucho más en fijar posición bajo techo.
 */
const PRECISION = Location.Accuracy.Balanced;

/** Pide permiso de ubicación y devuelve las coordenadas actuales. */
export async function obtenerUbicacion(): Promise<ResultadoPeriferico<Ubicacion>> {
  try {
    const permiso = await Location.requestForegroundPermissionsAsync();
    const negado = interpretarPermiso(
      permiso,
      'Necesitamos tu ubicación para registrar dónde anotaste la operación.',
    );
    if (negado !== undefined) return negado;

    // Un GPS sin señal no falla: simplemente no responde. El timeout es lo
    // único que evita que la pantalla quede esperando indefinidamente.
    const posicion = await conTimeout(
      Location.getCurrentPositionAsync({ accuracy: PRECISION }),
    );

    return interpretarPosicion(posicion);
  } catch (error) {
    if (error instanceof TiempoAgotadoError) {
      return {
        estado: 'error',
        mensaje: 'No pudimos fijar tu posición. Probá al aire libre.',
      };
    }

    return { estado: 'error', mensaje: 'No se pudo obtener la ubicación.' };
  }
}

export { formatearUbicacion } from './interpretes';
