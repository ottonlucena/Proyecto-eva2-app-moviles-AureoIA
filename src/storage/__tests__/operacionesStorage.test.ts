import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cargarOperaciones,
  CLAVE_OPERACIONES,
  guardarOperaciones,
  parsearOperaciones,
} from '../operacionesStorage';
import { cargarRespaldo, guardarRespaldo, parsearRespaldo } from '../respaldoStorage';
import type { Operacion } from '../../types/operacion';

/**
 * Pruebas del almacenamiento local.
 *
 * Lo que está guardado en un dispositivo puede venir de una versión anterior
 * de la app o haberse dañado. La regla es que un dato corrupto nunca deje al
 * usuario sin su diario.
 */

const operacion: Operacion = {
  id: 'op-1',
  tipo: 'compra',
  precioEntrada: 2000,
  lotes: 1,
  notas: 'test',
  estado: 'abierta',
  fechaCreacion: '2026-08-16T10:00:00.000Z',
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('parsearOperaciones', () => {
  it('devuelve el diario guardado', () => {
    expect(parsearOperaciones(JSON.stringify([operacion]))).toEqual([operacion]);
  });

  it.each([
    ['nada guardado', null],
    ['texto vacío', ''],
    ['JSON roto', '{no es json'],
    ['un objeto en vez de una lista', '{"a":1}'],
    ['un número', '42'],
  ])('devuelve lista vacía ante %s, sin lanzar excepción', (_caso, crudo) => {
    expect(parsearOperaciones(crudo)).toEqual([]);
  });

  it('salva las operaciones buenas aunque haya registros dañados', () => {
    const crudo = JSON.stringify([operacion, { roto: true }, null]);

    // Perder un registro dañado es preferible a perder el diario entero.
    expect(parsearOperaciones(crudo)).toEqual([operacion]);
  });
});

describe('ciclo de guardado y lectura', () => {
  it('lo guardado se recupera igual', async () => {
    await guardarOperaciones([operacion]);

    expect(await cargarOperaciones()).toEqual([operacion]);
  });

  it('un diario nuevo empieza vacío', async () => {
    expect(await cargarOperaciones()).toEqual([]);
  });

  it('guardar reemplaza el diario anterior', async () => {
    await guardarOperaciones([operacion]);
    await guardarOperaciones([]);

    expect(await cargarOperaciones()).toEqual([]);
  });

  it('conserva los adjuntos de los periféricos', async () => {
    const conAdjuntos: Operacion = {
      ...operacion,
      fotoUri: 'file:///foto.jpg',
      ubicacion: { latitud: -33.4489, longitud: -70.6693 },
    };

    await guardarOperaciones([conAdjuntos]);
    const [recuperada] = await cargarOperaciones();

    expect(recuperada.fotoUri).toBe('file:///foto.jpg');
    expect(recuperada.ubicacion).toEqual({ latitud: -33.4489, longitud: -70.6693 });
  });

  it('descarta lo corrupto que hubiera dejado otra versión de la app', async () => {
    await AsyncStorage.setItem(CLAVE_OPERACIONES, 'basura que no es json');

    expect(await cargarOperaciones()).toEqual([]);
  });
});

describe('datos del respaldo remoto', () => {
  it('conserva el identificador y la fecha', async () => {
    await guardarRespaldo({ idRemoto: 'abc', ultimaSincronizacion: '2026-08-16T10:00:00.000Z' });

    expect(await cargarRespaldo()).toEqual({
      idRemoto: 'abc',
      ultimaSincronizacion: '2026-08-16T10:00:00.000Z',
    });
  });

  it('sin respaldo previo devuelve indefinido', async () => {
    expect(await cargarRespaldo()).toBeUndefined();
  });

  it.each([
    ['nada', null],
    ['JSON roto', '{roto'],
    ['sin identificador', '{"ultimaSincronizacion":"x"}'],
    ['identificador vacío', '{"idRemoto":""}'],
  ])('rechaza un respaldo %s: un id inválido no sirve para recuperar nada', (_caso, crudo) => {
    expect(parsearRespaldo(crudo)).toBeUndefined();
  });

  it('tolera que falte la fecha, que es informativa', () => {
    expect(parsearRespaldo('{"idRemoto":"abc"}')).toEqual({
      idRemoto: 'abc',
      ultimaSincronizacion: '',
    });
  });
});
