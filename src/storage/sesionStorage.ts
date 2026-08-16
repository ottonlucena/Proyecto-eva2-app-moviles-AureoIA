import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Sesión del usuario y separación de los diarios.
 *
 * Cada usuario tiene su propio diario en el dispositivo. Sin esto, dos
 * personas que usan el mismo teléfono verían y editarían las mismas
 * operaciones, que es justamente lo que el enunciado pide evitar al hablar de
 * permitir múltiples usuarios.
 */

export const CLAVE_SESION = '@aureo:sesion';

/** Prefijo de la clave donde vive el diario de cada usuario. */
const PREFIJO_DIARIO = '@aureo:operaciones';

/**
 * Normaliza el identificador del usuario.
 *
 * Se pasa a minúsculas y se recortan los espacios para que «Otton@Mail.com» y
 * «otton@mail.com  » sean la misma cuenta: quien escribe su correo con una
 * mayúscula distinta espera encontrar su diario, no uno vacío.
 */
export function normalizarUsuario(usuario: string): string {
  return usuario.trim().toLowerCase();
}

/**
 * Clave de almacenamiento del diario de un usuario.
 *
 * Sin usuario se devuelve la clave histórica, sin sufijo, que es donde quedó
 * el diario de quienes ya usaban la app antes de que existieran las cuentas.
 * Así esos datos no se pierden.
 */
export function claveDiario(usuario: string | undefined): string {
  const normalizado = usuario === undefined ? '' : normalizarUsuario(usuario);
  return normalizado.length === 0 ? PREFIJO_DIARIO : `${PREFIJO_DIARIO}:${normalizado}`;
}

/** Lee la sesión guardada, si la hay. */
export async function cargarSesion(): Promise<string | undefined> {
  const guardado = await AsyncStorage.getItem(CLAVE_SESION);

  if (guardado === null || guardado.trim().length === 0) return undefined;

  return guardado;
}

export async function guardarSesion(usuario: string): Promise<void> {
  await AsyncStorage.setItem(CLAVE_SESION, normalizarUsuario(usuario));
}

export async function borrarSesion(): Promise<void> {
  await AsyncStorage.removeItem(CLAVE_SESION);
}
