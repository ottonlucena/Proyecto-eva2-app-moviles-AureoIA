/**
 * Formateo de valores para la interfaz.
 *
 * Se implementa a mano en lugar de usar `Intl` porque el soporte de
 * internacionalización varía entre el motor de JavaScript del dispositivo y
 * el del entorno de pruebas, y el diario debe mostrar siempre lo mismo.
 */

const MESES_ABREVIADOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
] as const;

/** Inserta el punto de miles en la parte entera de un número ya formateado. */
function separarMiles(entero: string): string {
  return entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Precio del oro en dólares por onza: `US$ 2.345,60`.
 * El oro se cotiza con dos decimales.
 */
export function formatearPrecio(valor: number): string {
  const [entero, decimales] = Math.abs(valor).toFixed(2).split('.');
  const signo = valor < 0 ? '-' : '';
  return `${signo}US$ ${separarMiles(entero)},${decimales}`;
}

/**
 * Resultado de una operación, siempre con signo explícito: `+US$ 1.200,00`.
 * Mostrar el `+` deja claro de un vistazo si la operación ganó o perdió.
 */
export function formatearResultado(valor: number): string {
  const signo = valor > 0 ? '+' : '';
  return `${signo}${formatearPrecio(valor)}`;
}

/** Tamaño de la posición: `0,50 lotes` o `1 lote`. */
export function formatearLotes(lotes: number): string {
  const texto = Number.isInteger(lotes) ? String(lotes) : lotes.toFixed(2).replace('.', ',');
  return `${texto} ${lotes === 1 ? 'lote' : 'lotes'}`;
}

/** Fecha legible a partir de un ISO 8601: `15 ago 2025 · 22:30`. */
export function formatearFecha(iso: string): string {
  const fecha = new Date(iso);

  if (Number.isNaN(fecha.getTime())) return 'Fecha desconocida';

  const dia = fecha.getDate();
  const mes = MESES_ABREVIADOS[fecha.getMonth()];
  const anio = fecha.getFullYear();
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');

  return `${dia} ${mes} ${anio} · ${hora}:${minutos}`;
}

/**
 * Convierte el texto de un campo de precio a número.
 * Acepta coma o punto como separador decimal, porque el teclado numérico
 * de Android e iOS ofrece uno u otro según la configuración del dispositivo.
 * Devuelve `undefined` si el texto no representa un número utilizable.
 */
export function parsearNumero(texto: string): number | undefined {
  const limpio = texto.trim().replace(',', '.');

  if (limpio.length === 0) return undefined;

  const valor = Number(limpio);

  if (!Number.isFinite(valor)) return undefined;

  return valor;
}
