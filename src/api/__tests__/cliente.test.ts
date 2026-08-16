import { pedirJson, TIMEOUT_MS } from '../cliente';

/**
 * Pruebas del cliente HTTP.
 *
 * Se sustituye `fetch` para forzar cada modo de falla de la red. Reproducir
 * esto contra un servidor real sería lento e inestable: no se puede pedir a
 * un servicio que devuelva un 500 cuando conviene, ni cortar la conexión en
 * el momento justo.
 */

const fetchSimulado = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = fetchSimulado as unknown as typeof fetch;
});

/** Construye una respuesta como la que entrega `fetch`. */
function respuesta(estado: number, cuerpo: unknown): Response {
  return {
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: async () => cuerpo,
  } as unknown as Response;
}

describe('seguridad de la conexión', () => {
  it('rechaza HTTP plano sin siquiera intentar la conexión', async () => {
    const resultado = await pedirJson('http://ejemplo.com/datos');

    expect(resultado.ok).toBe(false);
    expect(resultado.ok === false && resultado.error.tipo).toBe('red');
    // Lo crítico: los datos nunca llegaron a viajar en claro.
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it('acepta HTTPS', async () => {
    fetchSimulado.mockResolvedValue(respuesta(200, { dato: 1 }));

    expect((await pedirJson('https://ejemplo.com/datos')).ok).toBe(true);
  });
});

describe('camino feliz', () => {
  it('devuelve el JSON del servidor', async () => {
    fetchSimulado.mockResolvedValue(respuesta(200, { precio: 4377.6 }));

    const resultado = await pedirJson('https://ejemplo.com/oro');

    expect(resultado).toEqual({ ok: true, datos: { precio: 4377.6 } });
  });

  it('envía el cuerpo serializado y anuncia el tipo de contenido', async () => {
    fetchSimulado.mockResolvedValue(respuesta(200, {}));

    await pedirJson('https://ejemplo.com/x', { metodo: 'POST', cuerpo: { a: 1 } });

    const [, opciones] = fetchSimulado.mock.calls[0];
    expect(opciones.method).toBe('POST');
    expect(opciones.body).toBe('{"a":1}');
    expect(opciones.headers['Content-Type']).toBe('application/json');
  });

  it('no manda cabecera de contenido en un GET sin cuerpo', async () => {
    fetchSimulado.mockResolvedValue(respuesta(200, {}));

    await pedirJson('https://ejemplo.com/x');

    const [, opciones] = fetchSimulado.mock.calls[0];
    expect(opciones.body).toBeUndefined();
    expect(opciones.headers['Content-Type']).toBeUndefined();
  });
});

describe('errores del servidor', () => {
  it.each([
    [404, 'No encontramos'],
    [429, 'demasiadas consultas'],
    [500, 'no está disponible'],
    [503, 'no está disponible'],
    [400, 'rechazó la petición'],
  ])('clasifica el estado %i con un mensaje entendible', async (estado, fragmento) => {
    fetchSimulado.mockResolvedValue(respuesta(estado, {}));

    const resultado = await pedirJson('https://ejemplo.com/x');

    expect(resultado.ok).toBe(false);
    expect(resultado.ok === false && resultado.error.tipo).toBe('http');
    expect(resultado.ok === false && resultado.error.codigoHttp).toBe(estado);
    expect(resultado.ok === false && resultado.error.mensaje).toContain(fragmento);
  });

  it('conserva el código para que quien llama pueda reaccionar al 404', async () => {
    fetchSimulado.mockResolvedValue(respuesta(404, {}));

    const resultado = await pedirJson('https://ejemplo.com/x');

    // De este código depende que un respaldo borrado se vuelva a crear.
    expect(resultado.ok === false && resultado.error.codigoHttp).toBe(404);
  });
});

describe('fallos de red', () => {
  it('informa falta de conexión cuando fetch revienta', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('Network request failed'));

    const resultado = await pedirJson('https://ejemplo.com/x');

    expect(resultado.ok === false && resultado.error.tipo).toBe('red');
    expect(resultado.ok === false && resultado.error.mensaje).toContain('conexión');
  });

  it('distingue el timeout de una caída de red', async () => {
    const abortado = new Error('Aborted');
    abortado.name = 'AbortError';
    fetchSimulado.mockRejectedValue(abortado);

    const resultado = await pedirJson('https://ejemplo.com/x');

    expect(resultado.ok === false && resultado.error.tipo).toBe('timeout');
  });

  it('informa formato inválido si la respuesta no es JSON', async () => {
    fetchSimulado.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    } as unknown as Response);

    const resultado = await pedirJson('https://ejemplo.com/x');

    expect(resultado.ok === false && resultado.error.tipo).toBe('formato');
  });
});

describe('límite de espera', () => {
  it('usa diez segundos por defecto', () => {
    expect(TIMEOUT_MS).toBe(10_000);
  });

  it('aborta la petición cuando se agota el tiempo', async () => {
    jest.useFakeTimers();

    // Un servidor que acepta la conexión y nunca contesta.
    fetchSimulado.mockImplementation(
      (_url: string, opciones: { signal: AbortSignal }) =>
        new Promise((_, rechazar) => {
          opciones.signal.addEventListener('abort', () => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            rechazar(error);
          });
        }),
    );

    const promesa = pedirJson('https://ejemplo.com/lento');
    await jest.advanceTimersByTimeAsync(TIMEOUT_MS + 100);
    const resultado = await promesa;

    expect(resultado.ok === false && resultado.error.tipo).toBe('timeout');

    jest.useRealTimers();
  });

  it('respeta un límite propio más corto', async () => {
    jest.useFakeTimers();

    fetchSimulado.mockImplementation(
      (_url: string, opciones: { signal: AbortSignal }) =>
        new Promise((_, rechazar) => {
          opciones.signal.addEventListener('abort', () => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            rechazar(error);
          });
        }),
    );

    const promesa = pedirJson('https://ejemplo.com/lento', { timeoutMs: 500 });
    await jest.advanceTimersByTimeAsync(600);

    expect((await promesa).ok).toBe(false);

    jest.useRealTimers();
  });
});
