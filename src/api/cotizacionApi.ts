import { exito, fallo, pedirJson, type Resultado } from './cliente';

/**
 * Cotización del oro en vivo.
 *
 * Fuente: api.gold-api.com — pública y sin clave de acceso. Se eligió
 * deliberadamente una API sin credenciales: el repositorio es público y así
 * no hay ningún secreto que pueda filtrarse en el historial de commits.
 */

const URL_COTIZACION = 'https://api.gold-api.com/price/XAU';

export interface Cotizacion {
  /** Precio de la onza troy de oro en dólares. */
  precio: number;
  /** Momento en que la fuente actualizó el dato, en ISO 8601. */
  actualizado: string;
}

/**
 * Valida la respuesta del servicio antes de dejarla entrar a la app.
 *
 * Los datos externos son la frontera menos confiable del sistema: la API puede
 * cambiar su contrato sin avisar. Un precio ausente o cero no se acepta,
 * porque llegaría hasta el cálculo de resultados y lo falsearía en silencio.
 */
export function interpretarCotizacion(datos: unknown): Resultado<Cotizacion> {
  if (typeof datos !== 'object' || datos === null) {
    return fallo({ tipo: 'formato', mensaje: 'La cotización recibida no es válida.' });
  }

  const posible = datos as Record<string, unknown>;

  if (typeof posible.price !== 'number' || !Number.isFinite(posible.price) || posible.price <= 0) {
    return fallo({ tipo: 'formato', mensaje: 'La cotización recibida no trae un precio válido.' });
  }

  const actualizado =
    typeof posible.updatedAt === 'string' ? posible.updatedAt : new Date().toISOString();

  return exito({ precio: posible.price, actualizado });
}

/** Consulta el precio actual del oro. */
export async function obtenerCotizacion(): Promise<Resultado<Cotizacion>> {
  const respuesta = await pedirJson(URL_COTIZACION);

  if (!respuesta.ok) return respuesta;

  return interpretarCotizacion(respuesta.datos);
}
