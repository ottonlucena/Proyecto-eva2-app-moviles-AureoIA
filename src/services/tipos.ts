/**
 * Resultado de pedirle algo a un periférico del dispositivo.
 *
 * Se modela como unión discriminada y no como `T | null` porque los cuatro
 * desenlaces exigen respuestas distintas de la interfaz: un cancelado no se
 * comenta, un permiso negado ofrece ir a ajustes, y un error se explica.
 * Colapsarlos en un valor nulo obligaría a adivinar cuál ocurrió.
 */
export type ResultadoPeriferico<T> =
  | { estado: 'exito'; datos: T }
  /** El usuario cerró la cámara o descartó la foto. No es un error. */
  | { estado: 'cancelado' }
  | {
      estado: 'sin-permiso';
      /**
       * Falso cuando el sistema ya no volverá a mostrar el diálogo: la única
       * salida es que el usuario lo habilite a mano en los ajustes.
       */
      puedeReintentar: boolean;
      mensaje: string;
    }
  | { estado: 'error'; mensaje: string };

/**
 * Límite de espera para cualquier periférico.
 *
 * Sin esto, un GPS que no consigue señal —bajo techo, en un sótano— deja la
 * promesa pendiente para siempre y la pantalla congelada esperando.
 */
export const TIMEOUT_PERIFERICO_MS = 15_000;

/** Error interno que marca que se agotó la espera de un periférico. */
export class TiempoAgotadoError extends Error {
  constructor() {
    super('El dispositivo tardó demasiado en responder.');
    this.name = 'TiempoAgotadoError';
  }
}

/**
 * Corre una promesa contra un reloj. Si el periférico no responde a tiempo,
 * rechaza con `TiempoAgotadoError`.
 *
 * El temporizador se limpia siempre, gane quien gane la carrera: dejarlo vivo
 * mantendría el proceso despierto sin necesidad.
 */
export async function conTimeout<T>(
  promesa: Promise<T>,
  ms: number = TIMEOUT_PERIFERICO_MS,
): Promise<T> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;

  const reloj = new Promise<never>((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(new TiempoAgotadoError()), ms);
  });

  try {
    return await Promise.race([promesa, reloj]);
  } finally {
    if (temporizador !== undefined) clearTimeout(temporizador);
  }
}
