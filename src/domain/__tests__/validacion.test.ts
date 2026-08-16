import { esOperacionValida, filtrarOperacionesValidas } from '../validacion';

/**
 * Pruebas del guardián de las dos fronteras que no son de confianza: lo leído
 * del dispositivo y lo bajado del servidor.
 */

const valida = {
  id: 'op-1',
  tipo: 'compra',
  precioEntrada: 2000,
  lotes: 1,
  notas: '',
  estado: 'abierta',
  fechaCreacion: '2026-08-16T10:00:00.000Z',
};

describe('esOperacionValida', () => {
  it('acepta una operación bien formada', () => {
    expect(esOperacionValida(valida)).toBe(true);
  });

  it.each([
    ['nulo', null],
    ['indefinido', undefined],
    ['texto', 'operacion'],
    ['número', 42],
    ['lista', []],
  ])('rechaza un valor que ni siquiera es un objeto: %s', (_caso, valor) => {
    expect(esOperacionValida(valor)).toBe(false);
  });

  it.each([
    ['sin id', { ...valida, id: undefined }],
    ['id vacío', { ...valida, id: '' }],
    ['tipo inventado', { ...valida, tipo: 'permuta' }],
    ['estado inventado', { ...valida, estado: 'pendiente' }],
    ['precio como texto', { ...valida, precioEntrada: '2000' }],
    ['precio no numérico', { ...valida, precioEntrada: NaN }],
    ['lotes como texto', { ...valida, lotes: 'uno' }],
    ['notas nulas', { ...valida, notas: null }],
    ['sin fecha', { ...valida, fechaCreacion: undefined }],
  ])('rechaza una operación %s', (_caso, valor) => {
    expect(esOperacionValida(valor)).toBe(false);
  });

  it('acepta los campos opcionales cuando están bien', () => {
    expect(
      esOperacionValida({
        ...valida,
        precioSalida: 2100,
        fotoUri: 'file:///f.jpg',
        ubicacion: { latitud: -33.4, longitud: -70.6 },
      }),
    ).toBe(true);
  });

  it.each([
    ['precioSalida como texto', { ...valida, precioSalida: '2100' }],
    ['fotoUri numérica', { ...valida, fotoUri: 123 }],
    ['ubicación nula', { ...valida, ubicacion: null }],
    ['ubicación sin longitud', { ...valida, ubicacion: { latitud: 1 } }],
    ['ubicación con texto', { ...valida, ubicacion: { latitud: '1', longitud: '2' } }],
  ])('rechaza un campo opcional mal formado: %s', (_caso, valor) => {
    expect(esOperacionValida(valor)).toBe(false);
  });

  it('acepta que los opcionales estén ausentes: son opcionales de verdad', () => {
    expect(esOperacionValida(valida)).toBe(true);
  });
});

describe('filtrarOperacionesValidas', () => {
  it('conserva las buenas y descarta el resto', () => {
    expect(filtrarOperacionesValidas([valida, null, 'x', { roto: true }, valida])).toHaveLength(2);
  });

  it('devuelve lista vacía si no recibe una lista', () => {
    expect(filtrarOperacionesValidas('no soy lista')).toEqual([]);
    expect(filtrarOperacionesValidas(null)).toEqual([]);
  });
});
