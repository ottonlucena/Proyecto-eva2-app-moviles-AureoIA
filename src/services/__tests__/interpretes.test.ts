import type { ImagePickerResult } from 'expo-image-picker';
import type { LocationObject } from 'expo-location';
import {
  formatearUbicacion,
  interpretarPermiso,
  interpretarPosicion,
  interpretarSeleccion,
} from '../interpretes';

/**
 * Pruebas de la lógica de decisión de los periféricos.
 *
 * Es la parte donde puede haber un error de criterio —confundir un cancelado
 * con un fallo, aceptar coordenadas imposibles— y se verifica sin cámara ni
 * GPS porque el módulo no carga nada nativo.
 */

/** Construye una posición como la entrega el sistema. */
function posicion(latitude: number, longitude: number): LocationObject {
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
    timestamp: 0,
  };
}

describe('interpretarSeleccion (cámara y galería)', () => {
  it('trata el cancelado como desenlace normal, no como error', () => {
    const resultado = interpretarSeleccion({ canceled: true, assets: null });
    expect(resultado.estado).toBe('cancelado');
  });

  it('devuelve la ruta de la imagen elegida', () => {
    const entrada = {
      canceled: false,
      assets: [{ uri: 'file:///datos/foto.jpg' }],
    } as unknown as ImagePickerResult;

    const resultado = interpretarSeleccion(entrada);

    expect(resultado).toEqual({ estado: 'exito', datos: 'file:///datos/foto.jpg' });
  });

  it('rechaza una respuesta sin imágenes en lugar de guardar una ruta vacía', () => {
    const entrada = { canceled: false, assets: [] } as unknown as ImagePickerResult;
    expect(interpretarSeleccion(entrada).estado).toBe('error');
  });

  it('rechaza una imagen cuya ruta viene vacía', () => {
    const entrada = {
      canceled: false,
      assets: [{ uri: '' }],
    } as unknown as ImagePickerResult;

    expect(interpretarSeleccion(entrada).estado).toBe('error');
  });

  it('se queda con la primera imagen cuando llegan varias', () => {
    const entrada = {
      canceled: false,
      assets: [{ uri: 'file:///a.jpg' }, { uri: 'file:///b.jpg' }],
    } as unknown as ImagePickerResult;

    const resultado = interpretarSeleccion(entrada);

    expect(resultado.estado === 'exito' && resultado.datos).toBe('file:///a.jpg');
  });
});

describe('interpretarPosicion (GPS)', () => {
  it('acepta coordenadas reales y las traduce al modelo de la app', () => {
    const resultado = interpretarPosicion(posicion(-33.4489, -70.6693));

    expect(resultado).toEqual({
      estado: 'exito',
      datos: { latitud: -33.4489, longitud: -70.6693 },
    });
  });

  it.each([
    ['latitud sobre el máximo', 91, 0],
    ['latitud bajo el mínimo', -91, 0],
    ['longitud sobre el máximo', 0, 181],
    ['longitud bajo el mínimo', 0, -181],
  ])('rechaza coordenadas fuera de rango: %s', (_caso, lat, lon) => {
    expect(interpretarPosicion(posicion(lat, lon)).estado).toBe('error');
  });

  it.each([
    ['NaN', NaN, 0],
    ['infinito', Infinity, 0],
  ])('rechaza coordenadas no numéricas: %s', (_caso, lat, lon) => {
    expect(interpretarPosicion(posicion(lat, lon)).estado).toBe('error');
  });

  it('acepta los valores de borde, que son ubicaciones legítimas', () => {
    expect(interpretarPosicion(posicion(90, 180)).estado).toBe('exito');
    expect(interpretarPosicion(posicion(-90, -180)).estado).toBe('exito');
  });

  it('acepta el origen: es una coordenada válida, no un valor faltante', () => {
    expect(interpretarPosicion(posicion(0, 0)).estado).toBe('exito');
  });
});

describe('formatearUbicacion', () => {
  it('usa S y O para el hemisferio sur y el oeste', () => {
    expect(formatearUbicacion({ latitud: -33.4489, longitud: -70.6693 })).toBe(
      '33.4489° S, 70.6693° O',
    );
  });

  it('usa N y E para el hemisferio norte y el este', () => {
    expect(formatearUbicacion({ latitud: 40.7128, longitud: 2.1734 })).toBe(
      '40.7128° N, 2.1734° E',
    );
  });

  it('redondea a cuatro decimales, precisión suficiente para una manzana', () => {
    expect(formatearUbicacion({ latitud: 1.123456789, longitud: 2.987654321 })).toBe(
      '1.1235° N, 2.9877° E',
    );
  });
});

describe('interpretarPermiso', () => {
  it('deja pasar cuando el permiso está concedido', () => {
    expect(interpretarPermiso({ granted: true, canAskAgain: true }, 'mensaje')).toBeUndefined();
  });

  it('marca que se puede reintentar si el sistema volverá a preguntar', () => {
    const resultado = interpretarPermiso(
      { granted: false, canAskAgain: true },
      'Necesitamos la cámara.',
    );

    expect(resultado).toEqual({
      estado: 'sin-permiso',
      puedeReintentar: true,
      mensaje: 'Necesitamos la cámara.',
    });
  });

  it('deriva a los ajustes cuando el sistema ya no volverá a preguntar', () => {
    const resultado = interpretarPermiso(
      { granted: false, canAskAgain: false },
      'Necesitamos la cámara.',
    );

    expect(resultado?.estado).toBe('sin-permiso');
    expect(resultado?.estado === 'sin-permiso' && resultado.puedeReintentar).toBe(false);
    expect(resultado?.estado === 'sin-permiso' && resultado.mensaje).toContain('ajustes');
  });
});
