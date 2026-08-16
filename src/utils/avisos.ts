import { Alert, Linking } from 'react-native';
import type { ResultadoPeriferico } from '../services/tipos';

/**
 * Traduce el desenlace de un periférico en el aviso que corresponde.
 *
 * Un cancelado no genera aviso: el usuario cerró la cámara a propósito y
 * confirmárselo con un cartel es ruido. Un permiso denegado definitivamente
 * ofrece abrir los ajustes, porque desde la app ya no hay forma de pedirlo:
 * el sistema no vuelve a mostrar el diálogo y sin esa salida el usuario queda
 * bloqueado sin entender por qué.
 */
export function avisarFalloPeriferico<T>(
  resultado: ResultadoPeriferico<T>,
  titulo: string,
): void {
  if (resultado.estado === 'exito' || resultado.estado === 'cancelado') return;

  if (resultado.estado === 'sin-permiso' && !resultado.puedeReintentar) {
    Alert.alert(titulo, resultado.mensaje, [
      { text: 'Ahora no', style: 'cancel' },
      { text: 'Abrir ajustes', onPress: () => void Linking.openSettings() },
    ]);
    return;
  }

  Alert.alert(titulo, resultado.mensaje);
}
