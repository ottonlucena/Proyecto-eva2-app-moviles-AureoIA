import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cargarOperaciones,
  guardarOperaciones,
  parsearOperaciones,
} from '../operacionesStorage';
import { claveDiario, normalizarUsuario } from '../sesionStorage';
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
    await guardarOperaciones('ana@mail.com', [operacion]);

    expect(await cargarOperaciones('ana@mail.com')).toEqual([operacion]);
  });

  it('un diario nuevo empieza vacío', async () => {
    expect(await cargarOperaciones('nadie@mail.com')).toEqual([]);
  });

  it('guardar reemplaza el diario anterior', async () => {
    await guardarOperaciones('ana@mail.com', [operacion]);
    await guardarOperaciones('ana@mail.com', []);

    expect(await cargarOperaciones('ana@mail.com')).toEqual([]);
  });

  it('conserva los adjuntos de los periféricos', async () => {
    const conAdjuntos: Operacion = {
      ...operacion,
      fotoUri: 'file:///foto.jpg',
      ubicacion: { latitud: -33.4489, longitud: -70.6693 },
    };

    await guardarOperaciones('ana@mail.com', [conAdjuntos]);
    const [recuperada] = await cargarOperaciones('ana@mail.com');

    expect(recuperada.fotoUri).toBe('file:///foto.jpg');
    expect(recuperada.ubicacion).toEqual({ latitud: -33.4489, longitud: -70.6693 });
  });

  it('descarta lo corrupto que hubiera dejado otra versión de la app', async () => {
    await AsyncStorage.setItem(claveDiario('ana@mail.com'), 'basura que no es json');

    expect(await cargarOperaciones('ana@mail.com')).toEqual([]);
  });
});

describe('separación por usuario', () => {
  it('el diario de uno no aparece en el del otro', async () => {
    await guardarOperaciones('ana@mail.com', [operacion]);

    expect(await cargarOperaciones('beto@mail.com')).toEqual([]);
  });

  it('cada usuario escribe en su propia clave', async () => {
    await guardarOperaciones('ana@mail.com', [operacion]);
    await guardarOperaciones('beto@mail.com', []);

    expect(await AsyncStorage.getItem(claveDiario('ana@mail.com'))).toContain('op-1');
    expect(await AsyncStorage.getItem(claveDiario('beto@mail.com'))).toBe('[]');
  });

  it('el mismo correo con otras mayúsculas o espacios es la misma cuenta', () => {
    expect(claveDiario('Ana@Mail.com')).toBe(claveDiario('  ana@mail.com  '));
  });

  it('sin usuario se usa la clave histórica, para no perder datos previos', async () => {
    // Es donde quedó el diario de quien usó la app antes de que hubiera cuentas.
    expect(claveDiario(undefined)).toBe('@aureo:operaciones');
    expect(claveDiario('')).toBe('@aureo:operaciones');

    await guardarOperaciones(undefined, [operacion]);
    expect(await cargarOperaciones(undefined)).toEqual([operacion]);
  });

  it('normalizarUsuario recorta y pasa a minúsculas', () => {
    expect(normalizarUsuario('  Otton@Mail.COM ')).toBe('otton@mail.com');
  });
});
