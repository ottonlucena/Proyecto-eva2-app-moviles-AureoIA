import * as Location from 'expo-location';
import { obtenerUbicacion } from '../ubicacionService';

/**
 * Pruebas del flujo completo de obtención de coordenadas.
 *
 * Con el módulo sustituido se puede forzar el caso que más importa y que es
 * el más difícil de reproducir a mano: un GPS que no consigue señal y nunca
 * responde.
 */

const pedirPermiso = Location.requestForegroundPermissionsAsync as jest.Mock;
const posicionActual = Location.getCurrentPositionAsync as jest.Mock;

const CONCEDIDO = { granted: true, canAskAgain: true, status: 'granted' };
const NEGADO = { granted: false, canAskAgain: true, status: 'denied' };
const NEGADO_PARA_SIEMPRE = { granted: false, canAskAgain: false, status: 'denied' };

function respuestaGps(latitude: number, longitude: number): unknown {
  return {
    coords: {
      latitude,
      longitude,
      altitude: null,
      accuracy: 10,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('obtenerUbicacion', () => {
  it('devuelve las coordenadas cuando el GPS responde', async () => {
    pedirPermiso.mockResolvedValue(CONCEDIDO);
    posicionActual.mockResolvedValue(respuestaGps(-33.4489, -70.6693));

    await expect(obtenerUbicacion()).resolves.toEqual({
      estado: 'exito',
      datos: { latitud: -33.4489, longitud: -70.6693 },
    });
  });

  it('no enciende el GPS si el usuario negó el permiso', async () => {
    pedirPermiso.mockResolvedValue(NEGADO);

    const resultado = await obtenerUbicacion();

    expect(resultado.estado).toBe('sin-permiso');
    expect(posicionActual).not.toHaveBeenCalled();
  });

  it('deriva a ajustes cuando el permiso quedó negado para siempre', async () => {
    pedirPermiso.mockResolvedValue(NEGADO_PARA_SIEMPRE);

    const resultado = await obtenerUbicacion();

    expect(resultado.estado === 'sin-permiso' && resultado.puedeReintentar).toBe(false);
    expect(resultado.estado === 'sin-permiso' && resultado.mensaje).toContain('ajustes');
  });

  it('solo pide permiso de primer plano: la app no sigue al usuario', async () => {
    pedirPermiso.mockResolvedValue(CONCEDIDO);
    posicionActual.mockResolvedValue(respuestaGps(0, 0));

    await obtenerUbicacion();

    expect(pedirPermiso).toHaveBeenCalled();
    // El módulo sustituido ni siquiera expone el permiso de segundo plano,
    // porque el servicio no debe usarlo.
    expect(
      (Location as unknown as Record<string, unknown>).requestBackgroundPermissionsAsync,
    ).toBeUndefined();
  });

  it('rechaza coordenadas imposibles en lugar de guardarlas', async () => {
    pedirPermiso.mockResolvedValue(CONCEDIDO);
    posicionActual.mockResolvedValue(respuestaGps(999, 999));

    expect((await obtenerUbicacion()).estado).toBe('error');
  });

  it('no propaga la excepción si el GPS falla', async () => {
    pedirPermiso.mockResolvedValue(CONCEDIDO);
    posicionActual.mockRejectedValue(new Error('GPS deshabilitado'));

    expect((await obtenerUbicacion()).estado).toBe('error');
  });

  it('se rinde con un aviso útil si el GPS no consigue señal', async () => {
    jest.useFakeTimers();
    pedirPermiso.mockResolvedValue(CONCEDIDO);
    // Un GPS sin señal no falla: se queda pensando indefinidamente.
    posicionActual.mockReturnValue(new Promise(() => {}));

    const promesa = obtenerUbicacion();
    await jest.advanceTimersByTimeAsync(16_000);
    const resultado = await promesa;

    expect(resultado.estado).toBe('error');
    expect(resultado.estado === 'error' && resultado.mensaje).toContain('aire libre');

    jest.useRealTimers();
  });
});
