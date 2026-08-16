/**
 * Modelo de una operación del diario de trading.
 *
 * Los campos `fotoUri` y `ubicacion` son opcionales a propósito: se llenan
 * con los periféricos del dispositivo (cámara y GPS) y una operación creada
 * sin permisos concedidos sigue siendo válida. Al declararlos desde ahora,
 * las operaciones ya guardadas en el dispositivo no necesitan migrarse
 * cuando se incorporen esos periféricos.
 */

/** Coordenadas capturadas por el GPS al registrar la operación. */
export interface Ubicacion {
  latitud: number;
  longitud: number;
}

/** Sentido de la operación: se compra esperando que suba, se vende esperando que baje. */
export type TipoOperacion = 'compra' | 'venta';

/** Una operación abierta sigue en curso; una cerrada ya tiene precio de salida. */
export type EstadoOperacion = 'abierta' | 'cerrada';

export interface Operacion {
  id: string;
  tipo: TipoOperacion;
  /** Precio del oro al que se entró, en dólares por onza. */
  precioEntrada: number;
  /** Precio al que se cerró. Ausente mientras la operación siga abierta. */
  precioSalida?: number;
  /** Tamaño de la posición en lotes. */
  lotes: number;
  notas: string;
  estado: EstadoOperacion;
  /** Fecha de creación en formato ISO 8601. */
  fechaCreacion: string;
  /** Ruta local de la foto tomada con la cámara del dispositivo. */
  fotoUri?: string;
  /** Coordenadas donde se registró la operación. */
  ubicacion?: Ubicacion;
}

/**
 * Datos que aporta el usuario al crear o editar una operación.
 * El resto de los campos los administra la propia app.
 */
export type DatosOperacion = Omit<Operacion, 'id' | 'estado' | 'fechaCreacion'>;
