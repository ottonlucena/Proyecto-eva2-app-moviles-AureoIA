import { crearOperacion } from '../../domain/diario';
import {
  descargarDiario,
  interpretarIdRespaldo,
  interpretarRespaldo,
  subirDiario,
  VERSION_RESPALDO,
} from '../sincronizacionApi';

/**
 * Pruebas del respaldo remoto.
 *
 * Interesa sobre todo que el diario no se corrompa con lo que llegue del
 * servidor: el respaldo es un objeto público que pudo ser alterado por
 * terceros o quedar de una versión anterior del modelo.
 */

const fetchSimulado = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = fetchSimulado as unknown as typeof fetch;
});

function respuesta(estado: number, cuerpo: unknown): Response {
  return {
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: async () => cuerpo,
  } as unknown as Response;
}

const operacion = crearOperacion({
  tipo: 'compra',
  precioEntrada: 4000,
  lotes: 1,
  notas: 'prueba',
});

describe('interpretarIdRespaldo', () => {
  it('extrae el identificador que devuelve el servidor', () => {
    expect(interpretarIdRespaldo({ id: 'abc123' })).toEqual({ ok: true, datos: 'abc123' });
  });

  it.each([
    ['nulo', null],
    ['sin id', {}],
    ['id vacío', { id: '' }],
    ['id numérico', { id: 42 }],
  ])('rechaza una respuesta %s: sin id el respaldo sería irrecuperable', (_caso, cuerpo) => {
    expect(interpretarIdRespaldo(cuerpo).ok).toBe(false);
  });
});

describe('interpretarRespaldo', () => {
  it('devuelve las operaciones guardadas', () => {
    const resultado = interpretarRespaldo({ data: { operaciones: [operacion] } });

    expect(resultado.ok).toBe(true);
    expect(resultado.ok === true && resultado.datos).toHaveLength(1);
  });

  it('descarta los registros corruptos y conserva los válidos', () => {
    const resultado = interpretarRespaldo({
      data: { operaciones: [operacion, { hackeado: true }, null, 'texto'] },
    });

    expect(resultado.ok === true && resultado.datos).toHaveLength(1);
  });

  it('devuelve lista vacía si las operaciones no son una lista', () => {
    const resultado = interpretarRespaldo({ data: { operaciones: 'no soy lista' } });

    expect(resultado.ok === true && resultado.datos).toEqual([]);
  });

  it.each([
    ['nulo', null],
    ['sin data', {}],
    ['data nula', { data: null }],
  ])('rechaza un respaldo %s', (_caso, cuerpo) => {
    expect(interpretarRespaldo(cuerpo).ok).toBe(false);
  });
});

describe('subirDiario', () => {
  it('crea un respaldo nuevo con POST cuando no hay identificador previo', async () => {
    fetchSimulado.mockResolvedValue(respuesta(200, { id: 'nuevo1' }));

    const resultado = await subirDiario([operacion]);

    const [url, opciones] = fetchSimulado.mock.calls[0];
    expect(opciones.method).toBe('POST');
    expect(url).not.toMatch(/nuevo1/);
    expect(resultado).toEqual({ ok: true, datos: 'nuevo1' });
  });

  it('reemplaza el respaldo existente con PUT sobre su identificador', async () => {
    fetchSimulado.mockResolvedValue(respuesta(200, { id: 'previo9' }));

    await subirDiario([operacion], 'previo9');

    const [url, opciones] = fetchSimulado.mock.calls[0];
    expect(opciones.method).toBe('PUT');
    expect(url).toMatch(/previo9$/);
  });

  it('incluye la versión del formato, para poder migrar en el futuro', async () => {
    fetchSimulado.mockResolvedValue(respuesta(200, { id: 'x' }));

    await subirDiario([operacion]);

    const [, opciones] = fetchSimulado.mock.calls[0];
    const cuerpo = JSON.parse(opciones.body);
    expect(cuerpo.data.version).toBe(VERSION_RESPALDO);
    expect(cuerpo.data.operaciones).toHaveLength(1);
  });

  it('informa el 404 con su código, para poder recrear el respaldo borrado', async () => {
    fetchSimulado.mockResolvedValue(respuesta(404, {}));

    const resultado = await subirDiario([operacion], 'borrado');

    expect(resultado.ok).toBe(false);
    expect(resultado.ok === false && resultado.error.codigoHttp).toBe(404);
  });

  it('no rompe si el diario está vacío', async () => {
    fetchSimulado.mockResolvedValue(respuesta(200, { id: 'vacio' }));

    expect((await subirDiario([])).ok).toBe(true);
  });
});

describe('descargarDiario', () => {
  it('pide el respaldo por su identificador', async () => {
    fetchSimulado.mockResolvedValue(respuesta(200, { data: { operaciones: [operacion] } }));

    const resultado = await descargarDiario('abc123');

    const [url] = fetchSimulado.mock.calls[0];
    expect(url).toMatch(/abc123$/);
    expect(resultado.ok === true && resultado.datos).toHaveLength(1);
  });

  it('informa el 404 cuando el respaldo ya no existe en el servidor', async () => {
    fetchSimulado.mockResolvedValue(respuesta(404, {}));

    const resultado = await descargarDiario('fantasma');

    expect(resultado.ok === false && resultado.error.codigoHttp).toBe(404);
  });

  it('no deja entrar basura al diario aunque el servidor responda 200', async () => {
    fetchSimulado.mockResolvedValue(
      respuesta(200, { data: { operaciones: [{ malicioso: '<script>' }] } }),
    );

    const resultado = await descargarDiario('abc');

    expect(resultado.ok === true && resultado.datos).toEqual([]);
  });
});
