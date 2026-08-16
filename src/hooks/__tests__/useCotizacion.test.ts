import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useCotizacion } from '../useCotizacion';

/** Pruebas del hook que mantiene el precio del oro actualizado. */

const fetchSimulado = jest.fn();

function respuesta(estado: number, cuerpo: unknown): Response {
  return {
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: async () => cuerpo,
  } as unknown as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = fetchSimulado as unknown as typeof fetch;
});

it('consulta el precio al montarse', async () => {
  fetchSimulado.mockResolvedValue(respuesta(200, { price: 4377.6 }));

  const { result } = renderHook(() => useCotizacion());

  expect(result.current.cargando).toBe(true);
  await waitFor(() => expect(result.current.cargando).toBe(false));
  expect(result.current.cotizacion?.precio).toBe(4377.6);
  expect(result.current.error).toBeUndefined();
});

it('expone el error sin romper cuando no hay red', async () => {
  fetchSimulado.mockRejectedValue(new TypeError('Network request failed'));

  const { result } = renderHook(() => useCotizacion());

  await waitFor(() => expect(result.current.cargando).toBe(false));
  expect(result.current.cotizacion).toBeUndefined();
  expect(result.current.error?.tipo).toBe('red');
});

it('vuelve a consultar al refrescar', async () => {
  fetchSimulado.mockResolvedValue(respuesta(200, { price: 4000 }));
  const { result } = renderHook(() => useCotizacion());
  await waitFor(() => expect(result.current.cargando).toBe(false));

  fetchSimulado.mockResolvedValue(respuesta(200, { price: 4500 }));
  act(() => {
    result.current.refrescar();
  });

  await waitFor(() => expect(result.current.cotizacion?.precio).toBe(4500));
  expect(fetchSimulado).toHaveBeenCalledTimes(2);
});

it('limpia el error cuando un reintento tiene éxito', async () => {
  fetchSimulado.mockRejectedValue(new TypeError('Network request failed'));
  const { result } = renderHook(() => useCotizacion());
  await waitFor(() => expect(result.current.error).toBeDefined());

  fetchSimulado.mockResolvedValue(respuesta(200, { price: 4100 }));
  act(() => {
    result.current.refrescar();
  });

  await waitFor(() => expect(result.current.error).toBeUndefined());
});

it('conserva el último precio conocido mientras reintenta', async () => {
  fetchSimulado.mockResolvedValue(respuesta(200, { price: 4200 }));
  const { result } = renderHook(() => useCotizacion());
  await waitFor(() => expect(result.current.cotizacion?.precio).toBe(4200));

  // Si el reintento falla, mostrar un precio viejo es mejor que no mostrar nada.
  fetchSimulado.mockRejectedValue(new TypeError('Network request failed'));
  act(() => {
    result.current.refrescar();
  });

  await waitFor(() => expect(result.current.error).toBeDefined());
  expect(result.current.cotizacion?.precio).toBe(4200);
});
