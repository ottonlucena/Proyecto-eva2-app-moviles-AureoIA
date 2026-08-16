import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { useSesion } from './SesionContext';

/**
 * Estado compartido del diario.
 *
 * Vive en un contexto y no en cada pantalla a propósito. Con estado local por
 * pantalla, la lista y el resumen quedan desincronizados al navegar entre
 * ellas y hay que forzar una recarga cada vez que una pantalla recupera el
 * foco. Con una única fuente de verdad, cualquier cambio se refleja al
 * instante en todas las pantallas montadas.
 *
 * El diario que se carga es el del usuario con la sesión activa.
 */

interface DiarioContextValor {
  operaciones: Operacion[];
  /** Verdadero mientras se lee el diario del dispositivo. */
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
  const { usuario, cargando: cargandoSesion } = useSesion();
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [cargando, setCargando] = useState(true);

  /**
   * Copia siempre actual del diario.
   *
   * React no ejecuta el actualizador de estado en el momento de llamarlo, así
   * que leer la lista desde ahí para persistirla guardaba el valor anterior.
   * La referencia se actualiza de forma inmediata, lo que da un valor fiable
   * tanto para escribir en el dispositivo como para dos acciones seguidas.
   */
  const diarioActual = useRef<Operacion[]>([]);

  /** Usuario dueño de lo que hay en memoria, para no guardar en la clave ajena. */
  const usuarioActual = useRef<string | undefined>(undefined);

  /** Deja la lista en memoria, en la referencia y en el dispositivo. */
  const asentarDiario = useCallback(async (siguiente: Operacion[]): Promise<void> => {
    diarioActual.current = siguiente;
    setOperaciones(siguiente);
    await guardarOperaciones(usuarioActual.current, siguiente);
  }, []);

  // Se relee al cambiar de usuario: cada uno tiene su propio diario.
  useEffect(() => {
    if (cargandoSesion) return;

    let vigente = true;
    setCargando(true);

    async function leerDiario(): Promise<void> {
      const guardadas = await cargarOperaciones(usuario);
      // El usuario pudo cerrar sesión mientras se leía el almacenamiento.
      if (!vigente) return;
      usuarioActual.current = usuario;
      diarioActual.current = guardadas;
      setOperaciones(guardadas);
      setCargando(false);
    }

    void leerDiario();

    return () => {
      vigente = false;
    };
  }, [usuario, cargandoSesion]);

  /** Aplica un cambio al diario y lo persiste. */
  const aplicarCambio = useCallback(
    (transformar: (previas: readonly Operacion[]) => Operacion[]): Promise<void> =>
      asentarDiario(transformar(diarioActual.current)),
    [asentarDiario],
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
