import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ErrorApi } from '../api/cliente';
import type { Cotizacion } from '../api/cotizacionApi';
import { colors } from '../theme/colors';
import { borderWidth, fontSize, letterSpacing, opacity, radius, spacing } from '../theme/spacing';
import { formatearFecha, formatearPrecio } from '../utils/formato';

interface BannerCotizacionProps {
  cotizacion: Cotizacion | undefined;
  cargando: boolean;
  error: ErrorApi | undefined;
  onRefrescar: () => void;
  /** Acción opcional para volcar el precio en un formulario. */
  onUsarPrecio?: (precio: number) => void;
}

/**
 * Muestra el precio del oro traído de la API externa.
 *
 * Cuando la consulta falla se explica qué pasó y se ofrece reintentar, en
 * lugar de dejar el espacio vacío: el usuario debe poder distinguir entre
 * "no hay señal" y "la app está rota".
 */
function BannerCotizacion({
  cotizacion,
  cargando,
  error,
  onRefrescar,
  onUsarPrecio,
}: BannerCotizacionProps): React.JSX.Element {
  return (
    <View style={styles.banner}>
      <View style={styles.info}>
        <Text style={styles.titulo}>ORO · XAU/USD</Text>

        {cargando && cotizacion === undefined ? (
          <View style={styles.linea}>
            <ActivityIndicator color={colors.primario} size="small" />
            <Text style={styles.detalle}>Consultando el mercado…</Text>
          </View>
        ) : cotizacion !== undefined ? (
          <>
            <Text style={styles.precio}>{formatearPrecio(cotizacion.precio)}</Text>
            <Text style={styles.detalle}>
              {cargando ? 'Actualizando…' : `Actualizado ${formatearFecha(cotizacion.actualizado)}`}
            </Text>
          </>
        ) : (
          <Text style={styles.error}>{error?.mensaje ?? 'No pudimos obtener el precio.'}</Text>
        )}
      </View>

      <View style={styles.acciones}>
        {onUsarPrecio !== undefined && cotizacion !== undefined && (
          <Pressable
            onPress={() => onUsarPrecio(cotizacion.precio)}
            accessibilityRole="button"
            accessibilityLabel="Usar el precio de mercado"
            style={({ pressed }) => [styles.accion, styles.accionPrimaria, pressed && styles.presionado]}
          >
            <Text style={styles.textoAccionPrimaria}>Usar</Text>
          </Pressable>
        )}

        <Pressable
          onPress={onRefrescar}
          disabled={cargando}
          accessibilityRole="button"
          accessibilityLabel="Actualizar el precio del oro"
          style={({ pressed }) => [
            styles.accion,
            cargando && styles.accionDeshabilitada,
            pressed && styles.presionado,
          ]}
        >
          <Text style={styles.textoAccion}>Actualizar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.superficieAlta,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.borde,
    padding: spacing.md,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  titulo: {
    color: colors.textoTenue,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: letterSpacing.wide,
  },
  linea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  precio: {
    color: colors.primario,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  detalle: {
    color: colors.textoTenue,
    fontSize: fontSize.xs,
  },
  error: {
    color: colors.bajista,
    fontSize: fontSize.xs,
  },
  acciones: {
    gap: spacing.sm,
  },
  accion: {
    borderWidth: borderWidth.thin,
    borderColor: colors.borde,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  accionPrimaria: {
    backgroundColor: colors.primario,
    borderColor: colors.primario,
  },
  accionDeshabilitada: {
    opacity: opacity.disabled,
  },
  presionado: {
    opacity: opacity.pressed,
  },
  textoAccion: {
    color: colors.textoTenue,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  textoAccionPrimaria: {
    color: colors.fondo,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default BannerCotizacion;
