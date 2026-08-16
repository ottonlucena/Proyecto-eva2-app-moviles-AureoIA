import { filtrarOperacionesValidas } from '../domain/validacion';
import type { Operacion } from '../types/operacion';
import { exito, fallo, pedirJson, type Resultado } from './cliente';

/**
 * Respaldo del diario en un servicio web externo.
 *
 * Fuente: api.restful-api.dev — API REST pública que acepta POST, PUT y GET
 * sin credenciales.
 *
 * LIMITACIÓN CONOCIDA Y ACEPTADA: es un servicio compartido y sin
 * autenticación. Cualquiera que conozca el identificador de un respaldo puede
 * leerlo o borrarlo. Sirve para demostrar la integración con un servicio web
 * —que es lo que exige esta evaluación— pero no debe usarse para datos
 * personales o sensibles. El diario de operaciones es simulado, así que no hay
 * información real en juego. En un producto de verdad esto iría contra un
 * backend propio con autenticación por usuario.
 *
 * El diario viaja completo en un único objeto remoto en lugar de un objeto por
 * operación: así el respaldo se sube y se baja en una sola petición, sin
 * quedar a medias si la red se corta a la mitad de un lote.
 */

const URL_BASE = 'https://api.restful-api.dev/objects';

/** Forma del objeto tal como lo almacena el servicio remoto. */
interface RespaldoRemoto {
  name: string;
  data: {
    operaciones: Operacion[];
    version: number;
    actualizado: string;
  };
}

/** Versión del formato del respaldo, por si el modelo cambia más adelante. */
export const VERSION_RESPALDO = 1;

function construirCuerpo(operaciones: readonly Operacion[]): RespaldoRemoto {
  return {
    name: 'aureo-diario',
    data: {
      operaciones: [...operaciones],
      version: VERSION_RESPALDO,
      actualizado: new Date().toISOString(),
    },
  };
}

/**
 * Extrae el identificador que devuelve el servidor tras crear un respaldo.
 * Sin ese id no se puede volver a bajar el diario, así que su ausencia es un
 * error y no algo que se pueda ignorar.
 */
export function interpretarIdRespaldo(datos: unknown): Resultado<string> {
  if (typeof datos !== 'object' || datos === null) {
    return fallo({ tipo: 'formato', mensaje: 'El servidor no devolvió un respaldo válido.' });
  }

  const posible = datos as Record<string, unknown>;

  if (typeof posible.id !== 'string' || posible.id.length === 0) {
    return fallo({
      tipo: 'formato',
      mensaje: 'El servidor no devolvió el identificador del respaldo.',
    });
  }

  return exito(posible.id);
}

/**
 * Extrae las operaciones de un respaldo bajado del servidor.
 *
 * Se validan una por una: el respaldo es un objeto público que pudo ser
 * modificado por terceros o quedar de una versión anterior del modelo. Las
 * entradas que no cumplen se descartan en lugar de contaminar el diario.
 */
export function interpretarRespaldo(datos: unknown): Resultado<Operacion[]> {
  if (typeof datos !== 'object' || datos === null) {
    return fallo({ tipo: 'formato', mensaje: 'El respaldo recibido no es válido.' });
  }

  const posible = datos as Record<string, unknown>;
  const contenido = posible.data as Record<string, unknown> | undefined;

  if (typeof contenido !== 'object' || contenido === null) {
    return fallo({ tipo: 'formato', mensaje: 'El respaldo no contiene datos.' });
  }

  return exito(filtrarOperacionesValidas(contenido.operaciones));
}

/**
 * Sube el diario al servicio remoto.
 * Sin `idRemoto` crea un respaldo nuevo; con él reemplaza el existente.
 */
export async function subirDiario(
  operaciones: readonly Operacion[],
  idRemoto?: string,
): Promise<Resultado<string>> {
  const esActualizacion = idRemoto !== undefined && idRemoto.length > 0;

  const respuesta = await pedirJson(
    esActualizacion ? `${URL_BASE}/${idRemoto}` : URL_BASE,
    { metodo: esActualizacion ? 'PUT' : 'POST', cuerpo: construirCuerpo(operaciones) },
  );

  if (!respuesta.ok) return respuesta;

  return interpretarIdRespaldo(respuesta.datos);
}

/** Baja el diario respaldado en el servicio remoto. */
export async function descargarDiario(idRemoto: string): Promise<Resultado<Operacion[]>> {
  const respuesta = await pedirJson(`${URL_BASE}/${idRemoto}`);

  if (!respuesta.ok) return respuesta;

  return interpretarRespaldo(respuesta.datos);
}
