import { interpretarCotizacion, obtenerCotizacion } from '../cotizacionApi';

/**
 * Pruebas de la cotización del oro.
 *
 * El foco está en la validación: una API externa puede cambiar su contrato
 * sin avisar, y un precio inválido que se cuele llegaría hasta el cálculo de
 * resultados y lo falsearía en silencio.
 */

const fetchSimulado = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = fetchSimulado as unknown as typeof fetch;
});

function respuestaOk(cuerpo: unknown): Response {
  return { ok: true, status: 200, json: async () => cuerpo } as unknown as Response;
}

describe('interpretarCotizacion', () => {
  it('acepta una respuesta bien formada', () => {
    const resultado = interpretarCotizacion({
      price: 4377.6,
      updatedAt: '2026-08-16T03:35:57Z',
    });

    expect(resultado).toEqual({
      ok: true,
      datos: { precio: 4377.6, actualizado: '2026-08-16T03:35:57Z' },
    });
  });

  it.each([
    ['nulo', null],
    ['sin precio', {}],
    ['precio como texto', { price: '4377' }],
    ['precio cero', { price: 0 }],
    ['precio negativo', { price: -100 }],
    ['precio no numérico', { price: NaN }],
    ['precio infinito', { price: Infinity }],
  ])('rechaza una respuesta %s', (_caso, cuerpo) => {
    const resultado = interpretarCotizacion(cuerpo);

    expect(resultado.ok).toBe(false);
    expect(resultado.ok === false && resultado.error.tipo).toBe('formato');
  });

  it('tolera que falte la fecha, que no es esencial', () => {
    const resultado = interpretarCotizacion({ price: 100 });

    expect(resultado.ok).toBe(true);
    expect(resultado.ok === true && typeof resultado.datos.actualizado).toBe('string');
  });
});

describe('obtenerCotizacion', () => {
  it('consulta el servicio por HTTPS', async () => {
    fetchSimulado.mockResolvedValue(respuestaOk({ price: 4377.6 }));

    await obtenerCotizacion();

    const [url] = fetchSimulado.mock.calls[0];
    expect(url).toMatch(/^https:\/\//);
  });

  it('no envía ninguna credencial: no hay secretos que filtrar', async () => {
    fetchSimulado.mockResolvedValue(respuestaOk({ price: 4377.6 }));

    await obtenerCotizacion();

    const [url, opciones] = fetchSimulado.mock.calls[0];
    expect(url).not.toMatch(/api[_-]?key|token|secret/i);
    expect(JSON.stringify(opciones.headers)).not.toMatch(/authorization|api[_-]?key/i);
  });

  it('propaga el fallo de red sin lanzar excepción', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('Network request failed'));

    const resultado = await obtenerCotizacion();

    expect(resultado.ok).toBe(false);
    expect(resultado.ok === false && resultado.error.tipo).toBe('red');
  });

  it('rechaza un precio inválido aunque el servidor responda 200', async () => {
    fetchSimulado.mockResolvedValue(respuestaOk({ price: 'gratis' }));

    const resultado = await obtenerCotizacion();

    expect(resultado.ok).toBe(false);
    expect(resultado.ok === false && resultado.error.tipo).toBe('formato');
  });
});
