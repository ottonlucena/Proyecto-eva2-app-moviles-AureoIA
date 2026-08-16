/**
 * Cliente HTTP compartido por todas las integraciones con servicios externos.
 *
 * Centraliza las tres cosas que no pueden faltar al hablar con una API desde
 * un móvil: un límite de espera, el manejo explícito de cada modo de falla y
 * la validación de lo que responde el servidor. Ninguna pantalla usa `fetch`
 * directamente; todas pasan por acá.
 *
 * Los errores se devuelven como valor en lugar de lanzarse. En un móvil la red
 * falla constantemente —túnel, ascensor, avión— así que quedarse sin señal es
 * un caso esperado del flujo normal, no una excepción.
 */

/** Tiempo máximo de espera. Pasado esto, la petición se aborta. */
export const TIMEOUT_MS = 10_000;

export type TipoErrorApi = 'red' | 'timeout' | 'http' | 'formato';

export interface ErrorApi {
  tipo: TipoErrorApi;
  /** Mensaje listo para mostrarle al usuario, en español y sin jerga técnica. */
  mensaje: string;
  /** Código de estado, presente solo cuando el servidor llegó a responder. */
  codigoHttp?: number;
}

export type Resultado<T> =
  | { ok: true; datos: T }
  | { ok: false; error: ErrorApi };

export function exito<T>(datos: T): Resultado<T> {
  return { ok: true, datos };
}

export function fallo<T>(error: ErrorApi): Resultado<T> {
  return { ok: false, error };
}

interface OpcionesPeticion {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Cuerpo de la petición. Se serializa a JSON automáticamente. */
  cuerpo?: unknown;
  timeoutMs?: number;
}

/**
 * Traduce un código de estado a un mensaje que el usuario pueda entender.
 * Se distingue el error del cliente del error del servidor porque la acción
 * que puede tomar el usuario es distinta en cada caso.
 */
function mensajeSegunEstado(estado: number): string {
  if (estado === 404) return 'No encontramos lo que buscabas en el servidor.';
  if (estado === 429) return 'Hiciste demasiadas consultas seguidas. Esperá un momento.';
  if (estado >= 500) return 'El servicio no está disponible en este momento.';
  if (estado >= 400) return 'El servidor rechazó la petición.';
  return 'Respuesta inesperada del servidor.';
}

/**
 * Realiza una petición y devuelve el JSON sin interpretar.
 *
 * Se exige HTTPS: sobre HTTP plano los datos viajan legibles en la red y
 * Android bloquea el tráfico en claro por defecto desde la versión 9.
 */
export async function pedirJson(
  url: string,
  opciones: OpcionesPeticion = {},
): Promise<Resultado<unknown>> {
  const { metodo = 'GET', cuerpo, timeoutMs = TIMEOUT_MS } = opciones;

  if (!url.startsWith('https://')) {
    return fallo({
      tipo: 'red',
      mensaje: 'Solo se permiten conexiones seguras (HTTPS).',
    });
  }

  // El AbortController corta la espera: sin esto una red que no responde deja
  // la petición colgada indefinidamente y la pantalla cargando para siempre.
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);

  try {
    const respuesta = await fetch(url, {
      method: metodo,
      signal: controlador.signal,
      headers: {
        Accept: 'application/json',
        ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(cuerpo !== undefined ? { body: JSON.stringify(cuerpo) } : {}),
    });

    if (!respuesta.ok) {
      return fallo({
        tipo: 'http',
        mensaje: mensajeSegunEstado(respuesta.status),
        codigoHttp: respuesta.status,
      });
    }

    try {
      const datos: unknown = await respuesta.json();
      return exito(datos);
    } catch {
      return fallo({
        tipo: 'formato',
        mensaje: 'El servidor respondió algo que no pudimos interpretar.',
      });
    }
  } catch (error) {
    // `abort` es el timeout que disparamos nosotros, no una caída de red.
    if (error instanceof Error && error.name === 'AbortError') {
      return fallo({
        tipo: 'timeout',
        mensaje: 'El servidor tardó demasiado en responder.',
      });
    }

    return fallo({
      tipo: 'red',
      mensaje: 'No hay conexión a internet.',
    });
  } finally {
    clearTimeout(temporizador);
  }
}
