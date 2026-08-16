import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ErrorApi } from '../api/cliente';
import { descargarDiario, subirDiario } from '../api/sincronizacionApi';
import {
  actualizarOperacion,
  agregarOperacion,
  alternarEstado,
  contarNuevasDesdeRemoto,
  crearOperacion,
  eliminarOperacion,
  fusionarDiarios,
} from '../domain/diario';
import { cargarOperaciones, guardarOperaciones } from '../storage/operacionesStorage';
import {
  borrarRespaldo,
  cargarRespaldo,
  guardarRespaldo,
  type DatosRespaldo,
} from '../storage/respaldoStorage';
import type { DatosOperacion, Operacion } from '../types/operacion';

/**
 * Estado compartido del diario.
 *
 * Vive en un contexto y no en cada pantalla a propósito. Con estado local por
 * pantalla, la lista y el resumen quedan desincronizados al navegar entre
 * ellas y hay que forzar una recarga cada vez que una pantalla recupera el
 * foco. Con una única fuente de verdad, cualquier cambio se refleja al
 * instante en todas las pantallas montadas.
 */

/** Resultado de una operación de sincronización, listo para mostrar. */
export interface ResultadoSincronizacion {
  ok: boolean;
  mensaje: string;
}

interface DiarioContextValor {
  operaciones: Operacion[];
  /** Verdadero mientras se lee el diario del dispositivo por primera vez. */
  cargando: boolean;
  registrar: (datos: DatosOperacion) => Promise<void>;
  editar: (id: string, datos: DatosOperacion) => Promise<void>;
  eliminar: (id: string) => Promise<void>;
  alternar: (id: string, precioSalida?: number) => Promise<void>;
  /** Datos del último respaldo, si alguna vez se hizo uno. */
  respaldo: DatosRespaldo | undefined;
  /** Verdadero mientras hay una subida o bajada en curso. */
  sincronizando: boolean;
  respaldar: () => Promise<ResultadoSincronizacion>;
  restaurar: () => Promise<ResultadoSincronizacion>;
}

const DiarioContext = createContext<DiarioContextValor | undefined>(undefined);

interface DiarioProviderProps {
  children: ReactNode;
}

export function DiarioProvider({ children }: DiarioProviderProps): React.JSX.Element {
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [respaldo, setRespaldo] = useState<DatosRespaldo | undefined>();
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    let vigente = true;

    async function leerDiario(): Promise<void> {
      const [guardadas, datosRespaldo] = await Promise.all([
        cargarOperaciones(),
        cargarRespaldo(),
      ]);
      // La pantalla pudo desmontarse mientras se leía el almacenamiento.
      if (!vigente) return;
      setOperaciones(guardadas);
      setRespaldo(datosRespaldo);
      setCargando(false);
    }

    void leerDiario();

    return () => {
      vigente = false;
    };
  }, []);

  /**
   * Aplica un cambio al diario y lo persiste. El estado se actualiza a partir
   * del valor previo para no perder cambios si se disparan dos acciones
   * seguidas, y se guarda la misma lista que quedó en memoria.
   */
  const aplicarCambio = useCallback(
    async (transformar: (previas: readonly Operacion[]) => Operacion[]): Promise<void> => {
      let resultado: Operacion[] = [];

      setOperaciones((previas) => {
        resultado = transformar(previas);
        return resultado;
      });

      await guardarOperaciones(resultado);
    },
    [],
  );

  const registrar = useCallback(
    (datos: DatosOperacion) =>
      aplicarCambio((previas) => agregarOperacion(previas, crearOperacion(datos))),
    [aplicarCambio],
  );

  const editar = useCallback(
    (id: string, datos: DatosOperacion) =>
      aplicarCambio((previas) => actualizarOperacion(previas, id, datos)),
    [aplicarCambio],
  );

  const eliminar = useCallback(
    (id: string) => aplicarCambio((previas) => eliminarOperacion(previas, id)),
    [aplicarCambio],
  );

  const alternar = useCallback(
    (id: string, precioSalida?: number) =>
      aplicarCambio((previas) => alternarEstado(previas, id, precioSalida)),
    [aplicarCambio],
  );

  /**
   * Sube el diario al servicio remoto.
   *
   * Si el respaldo anterior ya no está en el servidor —alguien lo borró, o
   * el servicio lo purgó— la actualización devuelve 404. En ese caso se crea
   * uno nuevo en lugar de dejar al usuario sin respaldo posible.
   */
  const respaldar = useCallback(async (): Promise<ResultadoSincronizacion> => {
    setSincronizando(true);

    try {
      let resultado = await subirDiario(operaciones, respaldo?.idRemoto);

      if (!resultado.ok && resultado.error.codigoHttp === 404) {
        await borrarRespaldo();
        resultado = await subirDiario(operaciones);
      }

      if (!resultado.ok) {
        return { ok: false, mensaje: resultado.error.mensaje };
      }

      const datos: DatosRespaldo = {
        idRemoto: resultado.datos,
        ultimaSincronizacion: new Date().toISOString(),
      };

      await guardarRespaldo(datos);
      setRespaldo(datos);

      const cantidad = operaciones.length;
      return {
        ok: true,
        mensaje: `Se respaldaron ${cantidad} ${cantidad === 1 ? 'operación' : 'operaciones'} en la nube.`,
      };
    } finally {
      setSincronizando(false);
    }
  }, [operaciones, respaldo]);

  /**
   * Baja el diario remoto y lo combina con el local.
   *
   * Se fusiona en lugar de reemplazar: reemplazar borraría las operaciones
   * registradas en este dispositivo después del último respaldo.
   */
  const restaurar = useCallback(async (): Promise<ResultadoSincronizacion> => {
    if (respaldo === undefined) {
      return { ok: false, mensaje: 'Todavía no hay ningún respaldo en la nube.' };
    }

    setSincronizando(true);

    try {
      const resultado = await descargarDiario(respaldo.idRemoto);

      if (!resultado.ok) {
        // El respaldo desapareció del servidor: se olvida para no reintentar
        // eternamente contra un identificador muerto.
        if (resultado.error.codigoHttp === 404) {
          await borrarRespaldo();
          setRespaldo(undefined);
          return { ok: false, mensaje: 'El respaldo ya no existe en el servidor.' };
        }

        return { ok: false, mensaje: resultado.error.mensaje };
      }

      const nuevas = contarNuevasDesdeRemoto(operaciones, resultado.datos);
      const fusionadas = fusionarDiarios(operaciones, resultado.datos);

      setOperaciones(fusionadas);
      await guardarOperaciones(fusionadas);

      return {
        ok: true,
        mensaje:
          nuevas === 0
            ? 'Tu diario ya estaba al día.'
            : `Se importaron ${nuevas} ${nuevas === 1 ? 'operación' : 'operaciones'} desde la nube.`,
      };
    } finally {
      setSincronizando(false);
    }
  }, [operaciones, respaldo]);

  const valor = useMemo<DiarioContextValor>(
    () => ({
      operaciones,
      cargando,
      registrar,
      editar,
      eliminar,
      alternar,
      respaldo,
      sincronizando,
      respaldar,
      restaurar,
    }),
    [
      operaciones,
      cargando,
      registrar,
      editar,
      eliminar,
      alternar,
      respaldo,
      sincronizando,
      respaldar,
      restaurar,
    ],
  );

  return <DiarioContext.Provider value={valor}>{children}</DiarioContext.Provider>;
}

/** Acceso al diario. Falla temprano si se usa fuera del proveedor. */
export function useDiario(): DiarioContextValor {
  const contexto = useContext(DiarioContext);

  if (contexto === undefined) {
    throw new Error('useDiario debe usarse dentro de un DiarioProvider.');
  }

  return contexto;
}
