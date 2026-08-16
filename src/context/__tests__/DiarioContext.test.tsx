import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReactNode } from 'react';
import { DiarioProvider, useDiario } from '../DiarioContext';
import { SesionProvider, useSesion } from '../SesionContext';
import { claveDiario, CLAVE_SESION } from '../../storage/sesionStorage';

/**
 * Pruebas del estado compartido del diario.
 *
 * Es la capa que coordina memoria y dispositivo, así que acá se verifica lo
 * que ninguna función pura puede garantizar por sí sola: que cada cambio quede
 * persistido, y que el diario que se carga sea el del usuario con la sesión
 * activa y no el de otro.
 */

function envoltorio({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <SesionProvider>
      <DiarioProvider>{children}</DiarioProvider>
    </SesionProvider>
  );
}

/** Monta diario y sesión, y espera a que termine la lectura inicial. */
async function montar() {
  const utilidades = renderHook(
    () => ({ diario: useDiario(), sesion: useSesion() }),
    { wrapper: envoltorio },
  );
  await waitFor(() => expect(utilidades.result.current.diario.cargando).toBe(false));
  return utilidades;
}

const DATOS = { tipo: 'compra', precioEntrada: 2000, lotes: 1, notas: 'primera' } as const;

function operacionGuardada(id: string, notas = ''): unknown {
  return {
    id,
    tipo: 'venta',
    precioEntrada: 100,
    lotes: 1,
    notas,
    estado: 'abierta',
    fechaCreacion: '2026-08-16T10:00:00.000Z',
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('carga inicial', () => {
  it('empieza vacío cuando no hay nada guardado', async () => {
    const { result } = await montar();

    expect(result.current.diario.operaciones).toEqual([]);
    expect(result.current.sesion.usuario).toBeUndefined();
  });

  it('recupera el diario que había en el dispositivo', async () => {
    await AsyncStorage.setItem(
      claveDiario(undefined),
      JSON.stringify([operacionGuardada('guardada')]),
    );

    const { result } = await montar();

    expect(result.current.diario.operaciones).toHaveLength(1);
  });

  it('retoma la sesión guardada y carga el diario de ese usuario', async () => {
    await AsyncStorage.setItem(CLAVE_SESION, 'ana@mail.com');
    await AsyncStorage.setItem(
      claveDiario('ana@mail.com'),
      JSON.stringify([operacionGuardada('de-ana')]),
    );

    const { result } = await montar();

    expect(result.current.sesion.usuario).toBe('ana@mail.com');
    expect(result.current.diario.operaciones[0].id).toBe('de-ana');
  });
});

describe('cambios en el diario', () => {
  it('registrar agrega la operación y la persiste', async () => {
    const { result } = await montar();

    await act(async () => {
      await result.current.diario.registrar(DATOS);
    });

    expect(result.current.diario.operaciones).toHaveLength(1);

    // Lo importante: sobrevive a cerrar la app.
    const guardado = await AsyncStorage.getItem(claveDiario(undefined));
    expect(JSON.parse(guardado ?? '[]')).toHaveLength(1);
  });

  it('editar cambia los datos y los persiste', async () => {
    const { result } = await montar();
    await act(async () => {
      await result.current.diario.registrar(DATOS);
    });

    const { id } = result.current.diario.operaciones[0];
    await act(async () => {
      await result.current.diario.editar(id, { ...DATOS, notas: 'corregida' });
    });

    expect(result.current.diario.operaciones[0].notas).toBe('corregida');
  });

  it('eliminar quita la operación del dispositivo', async () => {
    const { result } = await montar();
    await act(async () => {
      await result.current.diario.registrar(DATOS);
    });

    await act(async () => {
      await result.current.diario.eliminar(result.current.diario.operaciones[0].id);
    });

    expect(result.current.diario.operaciones).toEqual([]);
    expect(JSON.parse((await AsyncStorage.getItem(claveDiario(undefined))) ?? '[]')).toEqual([]);
  });

  it('alternar cierra la operación con su precio de salida', async () => {
    const { result } = await montar();
    await act(async () => {
      await result.current.diario.registrar(DATOS);
    });

    await act(async () => {
      await result.current.diario.alternar(result.current.diario.operaciones[0].id, 2100);
    });

    expect(result.current.diario.operaciones[0].estado).toBe('cerrada');
    expect(result.current.diario.operaciones[0].precioSalida).toBe(2100);
  });

  it('dos altas seguidas no se pisan entre sí', async () => {
    const { result } = await montar();

    await act(async () => {
      await result.current.diario.registrar(DATOS);
    });
    await act(async () => {
      await result.current.diario.registrar({ ...DATOS, notas: 'segunda' });
    });

    expect(result.current.diario.operaciones).toHaveLength(2);
  });
});

describe('separación por usuario', () => {
  it('cada usuario ve su propio diario', async () => {
    const { result } = await montar();

    await act(async () => {
      await result.current.sesion.iniciarSesion('ana@mail.com');
    });
    await waitFor(() => expect(result.current.diario.cargando).toBe(false));
    await act(async () => {
      await result.current.diario.registrar({ ...DATOS, notas: 'de Ana' });
    });

    // Entra otra persona en el mismo teléfono.
    await act(async () => {
      await result.current.sesion.iniciarSesion('beto@mail.com');
    });
    await waitFor(() => expect(result.current.diario.cargando).toBe(false));

    expect(result.current.diario.operaciones).toEqual([]);
  });

  it('al volver, cada usuario recupera lo suyo', async () => {
    const { result } = await montar();

    await act(async () => {
      await result.current.sesion.iniciarSesion('ana@mail.com');
    });
    await waitFor(() => expect(result.current.diario.cargando).toBe(false));
    await act(async () => {
      await result.current.diario.registrar({ ...DATOS, notas: 'de Ana' });
    });

    await act(async () => {
      await result.current.sesion.iniciarSesion('beto@mail.com');
    });
    await waitFor(() => expect(result.current.diario.cargando).toBe(false));

    await act(async () => {
      await result.current.sesion.iniciarSesion('ana@mail.com');
    });
    await waitFor(() => expect(result.current.diario.cargando).toBe(false));

    expect(result.current.diario.operaciones).toHaveLength(1);
    expect(result.current.diario.operaciones[0].notas).toBe('de Ana');
  });

  it('lo que escribe un usuario no toca la clave de otro', async () => {
    const { result } = await montar();

    await act(async () => {
      await result.current.sesion.iniciarSesion('ana@mail.com');
    });
    await waitFor(() => expect(result.current.diario.cargando).toBe(false));
    await act(async () => {
      await result.current.diario.registrar(DATOS);
    });

    expect(await AsyncStorage.getItem(claveDiario('beto@mail.com'))).toBeNull();
    expect(await AsyncStorage.getItem(claveDiario('ana@mail.com'))).toContain('primera');
  });

  it('el correo escrito con otras mayúsculas es la misma cuenta', async () => {
    const { result } = await montar();

    await act(async () => {
      await result.current.sesion.iniciarSesion('Ana@Mail.com');
    });
    await waitFor(() => expect(result.current.diario.cargando).toBe(false));
    await act(async () => {
      await result.current.diario.registrar(DATOS);
    });

    await act(async () => {
      await result.current.sesion.iniciarSesion('  ana@mail.com  ');
    });
    await waitFor(() => expect(result.current.diario.cargando).toBe(false));

    expect(result.current.diario.operaciones).toHaveLength(1);
  });

  it('cerrar sesión deja el diario guardado y vacía la pantalla', async () => {
    const { result } = await montar();

    await act(async () => {
      await result.current.sesion.iniciarSesion('ana@mail.com');
    });
    await waitFor(() => expect(result.current.diario.cargando).toBe(false));
    await act(async () => {
      await result.current.diario.registrar(DATOS);
    });

    await act(async () => {
      await result.current.sesion.cerrarSesion();
    });
    await waitFor(() => expect(result.current.diario.cargando).toBe(false));

    expect(result.current.sesion.usuario).toBeUndefined();
    expect(result.current.diario.operaciones).toEqual([]);
    // El diario sigue en el dispositivo, listo para cuando vuelva.
    expect(await AsyncStorage.getItem(claveDiario('ana@mail.com'))).toContain('primera');
  });
});

describe('protección de los proveedores', () => {
  it('el diario falla de inmediato si se usa fuera de su proveedor', () => {
    expect(() => renderHook(() => useDiario())).toThrow('DiarioProvider');
  });

  it('la sesión falla de inmediato si se usa fuera de su proveedor', () => {
    expect(() => renderHook(() => useSesion())).toThrow('SesionProvider');
  });
});
