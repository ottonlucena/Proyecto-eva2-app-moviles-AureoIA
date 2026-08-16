import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Datos del último respaldo remoto.
 *
 * Se guardan en el dispositivo porque el identificador que devuelve el
 * servicio es la única forma de volver a encontrar el diario en el servidor:
 * si se pierde, el respaldo queda huérfano e irrecuperable.
 */

export const CLAVE_RESPALDO = '@aureo:respaldo';

export interface DatosRespaldo {
  idRemoto: string;
  /** Fecha del último respaldo exitoso, en ISO 8601. */
  ultimaSincronizacion: string;
}

/** Valida lo leído del dispositivo antes de confiar en ello. */
export function parsearRespaldo(crudo: string | null): DatosRespaldo | undefined {
  if (crudo === null || crudo.length === 0) return undefined;

  try {
    const parseado: unknown = JSON.parse(crudo);

    if (typeof parseado !== 'object' || parseado === null) return undefined;

    const posible = parseado as Record<string, unknown>;

    if (typeof posible.idRemoto !== 'string' || posible.idRemoto.length === 0) {
      return undefined;
    }

    return {
      idRemoto: posible.idRemoto,
      ultimaSincronizacion:
        typeof posible.ultimaSincronizacion === 'string' ? posible.ultimaSincronizacion : '',
    };
  } catch {
    return undefined;
  }
}

export async function cargarRespaldo(): Promise<DatosRespaldo | undefined> {
  const crudo = await AsyncStorage.getItem(CLAVE_RESPALDO);
  return parsearRespaldo(crudo);
}

export async function guardarRespaldo(datos: DatosRespaldo): Promise<void> {
  await AsyncStorage.setItem(CLAVE_RESPALDO, JSON.stringify(datos));
}

/** Se usa cuando el respaldo ya no existe en el servidor. */
export async function borrarRespaldo(): Promise<void> {
  await AsyncStorage.removeItem(CLAVE_RESPALDO);
}
