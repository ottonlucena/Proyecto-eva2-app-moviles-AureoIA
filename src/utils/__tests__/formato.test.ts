import {
  formatearFecha,
  formatearLotes,
  formatearPrecio,
  formatearResultado,
  parsearNumero,
} from '../formato';

describe('formatearPrecio', () => {
  it('usa punto de miles y coma decimal', () => {
    expect(formatearPrecio(2345.6)).toBe('US$ 2.345,60');
  });

  it('siempre muestra dos decimales', () => {
    expect(formatearPrecio(100)).toBe('US$ 100,00');
  });

  it('separa correctamente los millones', () => {
    expect(formatearPrecio(1234567.89)).toBe('US$ 1.234.567,89');
  });

  it('coloca el signo delante del símbolo', () => {
    expect(formatearPrecio(-500)).toBe('-US$ 500,00');
  });

  it('redondea a dos decimales', () => {
    expect(formatearPrecio(0.005)).toBe('US$ 0,01');
  });
});

describe('formatearResultado', () => {
  it('marca la ganancia con un signo más explícito', () => {
    expect(formatearResultado(5000)).toBe('+US$ 5.000,00');
  });

  it('la pérdida lleva su signo negativo', () => {
    expect(formatearResultado(-2000)).toBe('-US$ 2.000,00');
  });

  it('el cero no lleva signo: no se ganó ni se perdió', () => {
    expect(formatearResultado(0)).toBe('US$ 0,00');
  });
});

describe('formatearLotes', () => {
  it('usa singular con un lote', () => {
    expect(formatearLotes(1)).toBe('1 lote');
  });

  it('usa plural con más de uno', () => {
    expect(formatearLotes(3)).toBe('3 lotes');
  });

  it('muestra las fracciones con coma decimal', () => {
    expect(formatearLotes(0.5)).toBe('0,50 lotes');
  });
});

describe('formatearFecha', () => {
  it('muestra día, mes abreviado, año y hora', () => {
    // Se construye con hora local para que la prueba no dependa de la zona
    // horaria de la máquina que la corre.
    const fecha = new Date(2026, 7, 16, 22, 30).toISOString();
    expect(formatearFecha(fecha)).toBe('16 ago 2026 · 22:30');
  });

  it('rellena la hora con cero a la izquierda', () => {
    const fecha = new Date(2026, 0, 5, 9, 5).toISOString();
    expect(formatearFecha(fecha)).toBe('5 ene 2026 · 09:05');
  });

  it('no revienta con una fecha inválida', () => {
    expect(formatearFecha('no soy una fecha')).toBe('Fecha desconocida');
  });
});

describe('parsearNumero', () => {
  it('acepta el punto como separador decimal', () => {
    expect(parsearNumero('2345.60')).toBe(2345.6);
  });

  it('acepta la coma, que es lo que ofrece el teclado en español', () => {
    expect(parsearNumero('2345,60')).toBe(2345.6);
  });

  it('ignora los espacios alrededor', () => {
    expect(parsearNumero('  100  ')).toBe(100);
  });

  it('admite negativos', () => {
    expect(parsearNumero('-50')).toBe(-50);
  });

  it.each([
    ['vacío', ''],
    ['solo espacios', '   '],
    ['letras', 'abc'],
    ['texto mezclado', '12abc'],
  ])('devuelve indefinido ante un valor %s', (_caso, entrada) => {
    expect(parsearNumero(entrada)).toBeUndefined();
  });

  it('acepta el cero, que es un número válido y no un vacío', () => {
    expect(parsearNumero('0')).toBe(0);
  });
});
