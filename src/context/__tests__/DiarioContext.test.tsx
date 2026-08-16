import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReactNode } from 'react';
import { DiarioProvider, useDiario, type ResultadoSincronizacion } from '../DiarioContext';
import { CLAVE_OPERACIONES } from '../../storage/operacionesStorage';
import { CLAVE_RESPALDO } from '../../storage/respaldoStorage';

/**
 * Pruebas del estado compartido del diario.
 *
 * Es la capa que coordina memoria, dispositivo y servidor, así que acá se
 * verifica lo que ninguna función pura puede garantizar por sí sola: que cada
 * cambio quede persistido y que la sincronización se recupere cuando el
 * respaldo remoto desaparece.
 */

const fetchSimulado = jest.fn();

function envoltorio({ children }: { children: ReactNode }): React.JSX.Element {
  return <DiarioProvider>{children}</DiarioProvider>;
}

/** Monta el diario y espera a que termine la lectura inicial del dispositivo. */
async function montarDiario() {
  const utilidades = renderHook(() => useDiario(), { wrapper: envoltorio });
  await waitFor(() => expect(utilidades.result.current.cargando).toBe(false));
  return utilidades;
}

function respuesta(estado: number, cuerpo: unknown): Response {
  return {
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: async () => cuerpo,
  } as unknown as Response;
}

const DATOS = { tipo: 'compra', precioEntrada: 2000, lotes: 1, notas: 'primera' } as const;

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  global.fetch = fetchSimulado as unknown as typeof fetch;
});

describe('carga inicial', () => {
  it('empieza vacío cuando no hay nada guardado', async () => {
    const { result } = await montarDiario();

    expect(result.current.operaciones).toEqual([]);
    expect(result.current.respaldo).toBeUndefined();
  });

  it('recupera el diario que había en el dispositivo', async () => {
    await AsyncStorage.setItem(
      CLAVE_OPERACIONES,
      JSON.stringify([
        {
          id: 'guardada',
          tipo: 'venta',
          precioEntrada: 100,
          lotes: 1,
          notas: '',
          estado: 'abierta',
          fechaCreacion: '2026-08-16T10:00:00.000Z',
        },
      ]),
    );

    const { result } = await montarDiario();

    expect(result.current.operaciones).toHaveLength(1);
  });
});

describe('cambios en el diario', () => {
  it('registrar agrega la operación y la persiste', async () => {
    const { result } = await montarDiario();

    await act(async () => {
      await result.current.registrar(DATOS);
    });

    expect(result.current.operaciones).toHaveLength(1);

    // Lo importante: sobrevive a cerrar la app.
    const guardado = await AsyncStorage.getItem(CLAVE_OPERACIONES);
    expect(JSON.parse(guardado ?? '[]')).toHaveLength(1);
  });

  it('editar cambia los datos y los persiste', async () => {
    const { result } = await montarDiario();
    await act(async () => {
      await result.current.registrar(DATOS);
    });

    const { id } = result.current.operaciones[0];
    await act(async () => {
      await result.current.editar(id, { ...DATOS, notas: 'corregida' });
    });

    expect(result.current.operaciones[0].notas).toBe('corregida');
  });

  it('eliminar quita la operación del dispositivo', async () => {
    const { result } = await montarDiario();
    await act(async () => {
      await result.current.registrar(DATOS);
    });

    await act(async () => {
      await result.current.eliminar(result.current.operaciones[0].id);
    });

    expect(result.current.operaciones).toEqual([]);
    expect(JSON.parse((await AsyncStorage.getItem(CLAVE_OPERACIONES)) ?? '[]')).toEqual([]);
  });

  it('alternar cierra la operación con su precio de salida', async () => {
    const { result } = await montarDiario();
    await act(async () => {
      await result.current.registrar(DATOS);
    });

    await act(async () => {
      await result.current.alternar(result.current.operaciones[0].id, 2100);
    });

    expect(result.current.operaciones[0].estado).toBe('cerrada');
    expect(result.current.operaciones[0].precioSalida).toBe(2100);
  });

  it('dos altas seguidas no se pisan entre sí', async () => {
    const { result } = await montarDiario();

    await act(async () => {
      await result.current.registrar(DATOS);
    });
    await act(async () => {
      await result.current.registrar({ ...DATOS, notas: 'segunda' });
    });

    expect(result.current.operaciones).toHaveLength(2);
  });
});

describe('respaldar', () => {
  it('sube el diario y guarda el identificador devuelto', async () => {
    const { result } = await montarDiario();
    await act(async () => {
      await result.current.registrar(DATOS);
    });

    fetchSimulado.mockResolvedValue(respuesta(200, { id: 'remoto-1' }));

    let salida: ResultadoSincronizacion | undefined;
    await act(async () => {
      salida = await result.current.respaldar();
    });

    expect(salida).toEqual({ ok: true, mensaje: 'Se respaldaron 1 operación en la nube.' });
    expect(result.current.respaldo?.idRemoto).toBe('remoto-1');
    expect(await AsyncStorage.getItem(CLAVE_RESPALDO)).toContain('remoto-1');
  });

  it('informa el fallo sin romper cuando no hay red', async () => {
    const { result } = await montarDiario();
    fetchSimulado.mockRejectedValue(new TypeError('Network request failed'));

    let salida: ResultadoSincronizacion | undefined;
    await act(async () => {
      salida = await result.current.respaldar();
    });

    expect(salida).toEqual({ ok: false, mensaje: 'No hay conexión a internet.' });
    expect(result.current.respaldo).toBeUndefined();
  });

  it('recrea el respaldo si el anterior fue borrado del servidor', async () => {
    await AsyncStorage.setItem(
      CLAVE_RESPALDO,
      JSON.stringify({ idRemoto: 'viejo', ultimaSincronizacion: '2026-01-01T00:00:00.000Z' }),
    );
    const { result } = await montarDiario();
    expect(result.current.respaldo?.idRemoto).toBe('viejo');

    // El PUT sobre el respaldo borrado da 404; el POST siguiente lo recrea.
    fetchSimulado
      .mockResolvedValueOnce(respuesta(404, {}))
      .mockResolvedValueOnce(respuesta(200, { id: 'recreado' }));

    let salida: ResultadoSincronizacion | undefined;
    await act(async () => {
      salida = await result.current.respaldar();
    });

    expect(salida?.ok).toBe(true);
    expect(result.current.respaldo?.idRemoto).toBe('recreado');
    expect(fetchSimulado).toHaveBeenCalledTimes(2);
    expect(fetchSimulado.mock.calls[0][1].method).toBe('PUT');
    expect(fetchSimulado.mock.calls[1][1].method).toBe('POST');
  });
});

describe('restaurar', () => {
  it('avisa si nunca se hizo un respaldo, sin llamar al servidor', async () => {
    const { result } = await montarDiario();

    let salida: ResultadoSincronizacion | undefined;
    await act(async () => {
      salida = await result.current.restaurar();
    });

    expect(salida).toEqual({
      ok: false,
      mensaje: 'Todavía no hay ningún respaldo en la nube.',
    });
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it('importa las operaciones que no estaban en el dispositivo', async () => {
    await AsyncStorage.setItem(
      CLAVE_RESPALDO,
      JSON.stringify({ idRemoto: 'r1', ultimaSincronizacion: '' }),
    );
    const { result } = await montarDiario();

    fetchSimulado.mockResolvedValue(
      respuesta(200, {
        data: {
          operaciones: [
            {
              id: 'desde-nube',
              tipo: 'venta',
              precioEntrada: 500,
              lotes: 1,
              notas: 'remota',
              estado: 'abierta',
              fechaCreacion: '2026-08-15T10:00:00.000Z',
            },
          ],
        },
      }),
    );

    let salida: ResultadoSincronizacion | undefined;
    await act(async () => {
      salida = await result.current.restaurar();
    });

    expect(salida).toEqual({
      ok: true,
      mensaje: 'Se importaron 1 operación desde la nube.',
    });
    expect(result.current.operaciones).toHaveLength(1);
    // La importación también queda guardada en el dispositivo.
    expect(await AsyncStorage.getItem(CLAVE_OPERACIONES)).toContain('desde-nube');
  });

  it('no pisa lo registrado en el dispositivo después del respaldo', async () => {
    await AsyncStorage.setItem(
      CLAVE_RESPALDO,
      JSON.stringify({ idRemoto: 'r1', ultimaSincronizacion: '' }),
    );
    const { result } = await montarDiario();

    await act(async () => {
      await result.current.registrar({ ...DATOS, notas: 'nueva en el telefono' });
    });
    const idLocal = result.current.operaciones[0].id;

    // El servidor devuelve una versión vieja de esa misma operación.
    fetchSimulado.mockResolvedValue(
      respuesta(200, {
        data: {
          operaciones: [
            {
              id: idLocal,
              tipo: 'compra',
              precioEntrada: 2000,
              lotes: 1,
              notas: 'version vieja del servidor',
              estado: 'abierta',
              fechaCreacion: '2026-08-01T10:00:00.000Z',
            },
          ],
        },
      }),
    );

    await act(async () => {
      await result.current.restaurar();
    });

    expect(result.current.operaciones).toHaveLength(1);
    expect(result.current.operaciones[0].notas).toBe('nueva en el telefono');
  });

  it('avisa cuando el diario ya estaba al día', async () => {
    await AsyncStorage.setItem(
      CLAVE_RESPALDO,
      JSON.stringify({ idRemoto: 'r1', ultimaSincronizacion: '' }),
    );
    const { result } = await montarDiario();
    fetchSimulado.mockResolvedValue(respuesta(200, { data: { operaciones: [] } }));

    let salida: ResultadoSincronizacion | undefined;
    await act(async () => {
      salida = await result.current.restaurar();
    });

    expect(salida).toEqual({ ok: true, mensaje: 'Tu diario ya estaba al día.' });
  });

  it('olvida el identificador si el respaldo ya no existe en el servidor', async () => {
    await AsyncStorage.setItem(
      CLAVE_RESPALDO,
      JSON.stringify({ idRemoto: 'fantasma', ultimaSincronizacion: '' }),
    );
    const { result } = await montarDiario();
    fetchSimulado.mockResolvedValue(respuesta(404, {}));

    let salida: ResultadoSincronizacion | undefined;
    await act(async () => {
      salida = await result.current.restaurar();
    });

    expect(salida).toEqual({
      ok: false,
      mensaje: 'El respaldo ya no existe en el servidor.',
    });
    // Se olvida para no reintentar eternamente contra un id muerto.
    expect(result.current.respaldo).toBeUndefined();
    expect(await AsyncStorage.getItem(CLAVE_RESPALDO)).toBeNull();
  });
});

describe('protección del proveedor', () => {
  it('falla de inmediato si se usa el diario fuera del proveedor', () => {
    // El error explícito evita depurar un estado vacío inexplicable.
    expect(() => renderHook(() => useDiario())).toThrow('DiarioProvider');
  });
});
