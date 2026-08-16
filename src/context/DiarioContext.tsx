import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  actualizarOperacion,
  agregarOperacion,
  alternarEstado,
  crearOperacion,
  eliminarOperacion,
} from '../domain/diario';
import { cargarOperaciones, guardarOperaciones } from '../storage/operacionesStorage';
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

interface DiarioContextValor {
  operaciones: Operacion[];
  /** Verdadero mientras se lee el diario del dispositivo por primera vez. */
  cargando: boolean;
  registrar: (datos: DatosOperacion) => Promise<void>;
  editar: (id: string, datos: DatosOperacion) => Promise<void>;
  eliminar: (id: string) => Promise<void>;
  alternar: (id: string, precioSalida?: number) => Promise<void>;
}

const DiarioContext = createContext<DiarioContextValor | undefined>(undefined);

interface DiarioProviderProps {
  children: ReactNode;
}

export function DiarioProvider({ children }: DiarioProviderProps): React.JSX.Element {
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;

    async function leerDiario(): Promise<void> {
      const guardadas = await cargarOperaciones();
      // La pantalla pudo desmontarse mientras se leía el almacenamiento.
      if (!vigente) return;
      setOperaciones(guardadas);
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

  const valor = useMemo<DiarioContextValor>(
    () => ({ operaciones, cargando, registrar, editar, eliminar, alternar }),
    [operaciones, cargando, registrar, editar, eliminar, alternar],
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
