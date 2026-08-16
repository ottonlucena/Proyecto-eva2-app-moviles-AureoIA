import { useCallback, useEffect, useState } from 'react';
import { obtenerCotizacion, type Cotizacion } from '../api/cotizacionApi';
import type { ErrorApi } from '../api/cliente';

interface EstadoCotizacion {
  cotizacion: Cotizacion | undefined;
  cargando: boolean;
  error: ErrorApi | undefined;
  /** Vuelve a consultar el precio. */
  refrescar: () => void;
}

/**
 * Mantiene el precio del oro actualizado.
 *
 * Se consulta al montar y cuando el usuario lo pide. No se refresca en un
 * intervalo automático a propósito: en un móvil eso gasta batería y datos
 * para un valor que el usuario solo mira cuando va a registrar una operación.
 */
export function useCotizacion(): EstadoCotizacion {
  const [cotizacion, setCotizacion] = useState<Cotizacion | undefined>();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<ErrorApi | undefined>();
  // Cambiar este contador vuelve a disparar el efecto de consulta.
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;

    async function consultar(): Promise<void> {
      setCargando(true);
      const resultado = await obtenerCotizacion();

      // El componente pudo desmontarse mientras la petición estaba en curso.
      if (!vigente) return;

      if (resultado.ok) {
        setCotizacion(resultado.datos);
        setError(undefined);
      } else {
        setError(resultado.error);
      }

      setCargando(false);
    }

    void consultar();

    return () => {
      vigente = false;
    };
  }, [intento]);

  const refrescar = useCallback(() => {
    setIntento((previo) => previo + 1);
  }, []);

  return { cotizacion, cargando, error, refrescar };
}
