import * as ImagePicker from 'expo-image-picker';
import { interpretarPermiso, interpretarSeleccion } from './interpretes';
import { conTimeout, TiempoAgotadoError, type ResultadoPeriferico } from './tipos';

/**
 * Captura de imágenes con la cámara y la galería del dispositivo.
 *
 * Este módulo solo orquesta: pide el permiso, lanza el periférico y delega
 * cada decisión en `interpretes.ts`, que es puro y verificable. Las pantallas
 * no conocen `expo-image-picker`, solo reciben un `ResultadoPeriferico`.
 */

/**
 * Compresión de la foto.
 *
 * 0.6 equilibra nitidez y peso: las imágenes se guardan en el dispositivo y
 * viajan en el respaldo, así que una foto sin comprimir infla ambas cosas sin
 * aportar detalle útil para una captura de un gráfico.
 */
export const CALIDAD_FOTO = 0.6;

/** Proporción cuadrada al recortar, para que la lista se vea pareja. */
const ASPECTO_RECORTE: [number, number] = [1, 1];

/** Convierte una excepción inesperada en un resultado presentable. */
function comoError(error: unknown, periferico: string): ResultadoPeriferico<string> {
  if (error instanceof TiempoAgotadoError) {
    return { estado: 'error', mensaje: `${periferico} tardó demasiado en responder.` };
  }

  return { estado: 'error', mensaje: `No se pudo abrir ${periferico.toLowerCase()}.` };
}

/** Pide permiso, abre la cámara y devuelve la ruta local de la foto. */
export async function tomarFoto(): Promise<ResultadoPeriferico<string>> {
  try {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    const negado = interpretarPermiso(
      permiso,
      'Necesitamos la cámara para adjuntar una foto a la operación.',
    );
    if (negado !== undefined) return negado;

    const resultado = await conTimeout(
      ImagePicker.launchCameraAsync({
        quality: CALIDAD_FOTO,
        allowsEditing: true,
        aspect: ASPECTO_RECORTE,
      }),
    );

    return interpretarSeleccion(resultado);
  } catch (error) {
    return comoError(error, 'La cámara');
  }
}

/**
 * Alternativa a la cámara: elegir una imagen ya guardada.
 * Es la única vía en un emulador sin cámara y en dispositivos donde el
 * usuario prefiere no dar permiso de cámara.
 */
export async function elegirDeGaleria(): Promise<ResultadoPeriferico<string>> {
  try {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const negado = interpretarPermiso(
      permiso,
      'Necesitamos acceso a tus fotos para adjuntar una imagen.',
    );
    if (negado !== undefined) return negado;

    const resultado = await conTimeout(
      ImagePicker.launchImageLibraryAsync({
        quality: CALIDAD_FOTO,
        allowsEditing: true,
        aspect: ASPECTO_RECORTE,
      }),
    );

    return interpretarSeleccion(resultado);
  } catch (error) {
    return comoError(error, 'La galería');
  }
}
