import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { borrarSesion, cargarSesion, guardarSesion, normalizarUsuario } from '../storage/sesionStorage';

/**
 * Quién está usando la app.
 *
 * La sesión se guarda en el dispositivo para que el usuario no tenga que
 * volver a identificarse cada vez que abre la app, y para que el diario que se
 * carga sea el suyo.
 *
 * Es una autenticación local: no verifica credenciales contra ningún servidor.
 * Su función es separar los diarios de distintas personas que compartan el
 * teléfono, no impedir el acceso.
 */

interface SesionContextValor {
  /** Usuario activo, ya normalizado. Indefinido si nadie inició sesión. */
  usuario: string | undefined;
  /** Verdadero mientras se lee la sesión guardada. */
  cargando: boolean;
  iniciarSesion: (usuario: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const SesionContext = createContext<SesionContextValor | undefined>(undefined);

interface SesionProviderProps {
  children: ReactNode;
}

export function SesionProvider({ children }: SesionProviderProps): React.JSX.Element {
  const [usuario, setUsuario] = useState<string | undefined>();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;

    async function leerSesion(): Promise<void> {
      const guardado = await cargarSesion();
      if (!vigente) return;
      setUsuario(guardado);
      setCargando(false);
    }

    void leerSesion();

    return () => {
      vigente = false;
    };
  }, []);

  const iniciarSesion = useCallback(async (nuevo: string): Promise<void> => {
    const normalizado = normalizarUsuario(nuevo);
    await guardarSesion(normalizado);
    setUsuario(normalizado);
  }, []);

  const cerrarSesion = useCallback(async (): Promise<void> => {
    await borrarSesion();
    setUsuario(undefined);
  }, []);

  const valor = useMemo<SesionContextValor>(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion }),
    [usuario, cargando, iniciarSesion, cerrarSesion],
  );

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

/** Acceso a la sesión. Falla temprano si se usa fuera del proveedor. */
export function useSesion(): SesionContextValor {
  const contexto = useContext(SesionContext);

  if (contexto === undefined) {
    throw new Error('useSesion debe usarse dentro de un SesionProvider.');
  }

  return contexto;
}
