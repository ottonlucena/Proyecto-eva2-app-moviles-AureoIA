import {
  actualizarOperacion,
  agregarOperacion,
  alternarEstado,
  calcularResultado,
  calcularResultadoTotal,
  contarAbiertas,
  crearOperacion,
  eliminarOperacion,
  generarId,
  ONZAS_POR_LOTE,
} from '../diario';
import type { Operacion } from '../../types/operacion';

/**
 * Pruebas de las reglas del diario.
 *
 * Acá vive el cálculo del que depende el resultado que ve el usuario, así que
 * se verifica el signo en las cuatro combinaciones posibles: compra y venta,
 * ganadora y perdedora.
 */

function operacion(parcial: Partial<Operacion> = {}): Operacion {
  return {
    id: 'op-1',
    tipo: 'compra',
    precioEntrada: 2000,
    lotes: 1,
    notas: '',
    estado: 'abierta',
    fechaCreacion: '2026-08-16T10:00:00.000Z',
    ...parcial,
  };
}

describe('generarId', () => {
  it('no repite identificadores en llamadas seguidas', () => {
    const ids = new Set(Array.from({ length: 500 }, generarId));
    expect(ids.size).toBe(500);
  });
});

describe('crearOperacion', () => {
  it('nace abierta y con fecha de creación', () => {
    const nueva = crearOperacion({
      tipo: 'venta',
      precioEntrada: 100,
      lotes: 2,
      notas: 'hola',
    });

    expect(nueva.estado).toBe('abierta');
    expect(nueva.tipo).toBe('venta');
    expect(Number.isNaN(Date.parse(nueva.fechaCreacion))).toBe(false);
  });
});

describe('alta, edición y baja', () => {
  it('agrega al principio: lo más reciente se ve primero', () => {
    const vieja = operacion({ id: 'vieja' });
    const nueva = operacion({ id: 'nueva' });

    expect(agregarOperacion([vieja], nueva).map((o) => o.id)).toEqual(['nueva', 'vieja']);
  });

  it('edita conservando la identidad y la fecha original', () => {
    const original = operacion();

    const [editada] = actualizarOperacion([original], 'op-1', {
      tipo: 'venta',
      precioEntrada: 3000,
      lotes: 5,
      notas: 'cambiada',
    });

    expect(editada.id).toBe('op-1');
    expect(editada.fechaCreacion).toBe(original.fechaCreacion);
    expect(editada.precioEntrada).toBe(3000);
  });

  it('ignora un id que no existe en lugar de romper', () => {
    const lista = [operacion()];
    expect(actualizarOperacion(lista, 'inexistente', {
      tipo: 'compra',
      precioEntrada: 1,
      lotes: 1,
      notas: '',
    })).toEqual(lista);
  });

  it('elimina solo la operación indicada', () => {
    const lista = [operacion({ id: 'a' }), operacion({ id: 'b' })];
    expect(eliminarOperacion(lista, 'a').map((o) => o.id)).toEqual(['b']);
  });

  it('no muta la lista original', () => {
    const lista = [operacion()];

    agregarOperacion(lista, operacion({ id: 'otra' }));
    eliminarOperacion(lista, 'op-1');
    actualizarOperacion(lista, 'op-1', {
      tipo: 'venta',
      precioEntrada: 9,
      lotes: 9,
      notas: 'x',
    });

    expect(lista).toHaveLength(1);
    expect(lista[0].precioEntrada).toBe(2000);
  });
});

describe('alternarEstado', () => {
  it('cierra con el precio de salida indicado', () => {
    const [cerrada] = alternarEstado([operacion()], 'op-1', 2100);

    expect(cerrada.estado).toBe('cerrada');
    expect(cerrada.precioSalida).toBe(2100);
  });

  it('cierra al precio de entrada si no se indica salida: resultado neutro', () => {
    const [cerrada] = alternarEstado([operacion()], 'op-1');

    expect(cerrada.precioSalida).toBe(2000);
    expect(calcularResultado(cerrada)).toBe(0);
  });

  it('al reabrir descarta el precio de salida viejo', () => {
    const cerrada = operacion({ estado: 'cerrada', precioSalida: 2100 });

    const [reabierta] = alternarEstado([cerrada], 'op-1');

    expect(reabierta.estado).toBe('abierta');
    // Conservarlo daría un resultado calculado sobre un cierre que ya no existe.
    expect(reabierta.precioSalida).toBeUndefined();
    expect(calcularResultado(reabierta)).toBeUndefined();
  });
});

describe('calcularResultado', () => {
  it('un lote son cien onzas', () => {
    expect(ONZAS_POR_LOTE).toBe(100);
  });

  it('compra ganadora: sube el precio', () => {
    const op = operacion({ estado: 'cerrada', precioSalida: 2050 });
    expect(calcularResultado(op)).toBe(5000);
  });

  it('compra perdedora: baja el precio', () => {
    const op = operacion({ estado: 'cerrada', precioSalida: 1950 });
    expect(calcularResultado(op)).toBe(-5000);
  });

  it('venta ganadora: en una venta se gana cuando baja', () => {
    const op = operacion({ tipo: 'venta', estado: 'cerrada', precioSalida: 1950 });
    expect(calcularResultado(op)).toBe(5000);
  });

  it('venta perdedora: sube el precio', () => {
    const op = operacion({ tipo: 'venta', estado: 'cerrada', precioSalida: 2050 });
    expect(calcularResultado(op)).toBe(-5000);
  });

  it('escala con la cantidad de lotes', () => {
    const op = operacion({ estado: 'cerrada', precioSalida: 2050, lotes: 3 });
    expect(calcularResultado(op)).toBe(15_000);
  });

  it('admite fracciones de lote', () => {
    const op = operacion({ estado: 'cerrada', precioSalida: 2050, lotes: 0.5 });
    expect(calcularResultado(op)).toBe(2500);
  });

  it('una operación abierta todavía no tiene resultado', () => {
    expect(calcularResultado(operacion())).toBeUndefined();
  });

  it('una cerrada sin precio de salida tampoco', () => {
    expect(calcularResultado(operacion({ estado: 'cerrada' }))).toBeUndefined();
  });
});

describe('resúmenes', () => {
  it('cuenta solo las abiertas', () => {
    const lista = [
      operacion({ id: 'a' }),
      operacion({ id: 'b', estado: 'cerrada', precioSalida: 2000 }),
      operacion({ id: 'c' }),
    ];

    expect(contarAbiertas(lista)).toBe(2);
  });

  it('el total acumulado ignora las abiertas', () => {
    const lista = [
      operacion({ id: 'a', estado: 'cerrada', precioSalida: 2050 }),
      operacion({ id: 'b', estado: 'cerrada', precioSalida: 1990 }),
      operacion({ id: 'c' }),
    ];

    expect(calcularResultadoTotal(lista)).toBe(4000);
  });

  it('el total de un diario vacío es cero, no indefinido', () => {
    expect(calcularResultadoTotal([])).toBe(0);
  });
});


