import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatearUbicacion, obtenerUbicacion } from '../services/ubicacionService';
import { colors } from '../theme/colors';
import { borderWidth, fontSize, opacity, radius, spacing } from '../theme/spacing';
import type { Ubicacion } from '../types/operacion';
import { avisarFalloPeriferico } from '../utils/avisos';

interface CapturaUbicacionProps {
  etiqueta: string;
  ubicacion: Ubicacion | undefined;
  onCambiar: (ubicacion: Ubicacion | undefined) => void;
}

/**
 * Registra dónde se anotó la operación.
 *
 * La captura la dispara el usuario y no ocurre sola al abrir el formulario:
 * encender el GPS sin que nadie lo haya pedido gasta batería y toma una
 * posición que quizá termine descartada si la operación no se guarda.
 */
function CapturaUbicacion({
  etiqueta,
  ubicacion,
  onCambiar,
}: CapturaUbicacionProps): React.JSX.Element {
  const [ocupado, setOcupado] = useState(false);

  async function capturar(): Promise<void> {
    setOcupado(true);

    try {
      const resultado = await obtenerUbicacion();

      if (resultado.estado === 'exito') {
        onCambiar(resultado.datos);
        return;
      }

      avisarFalloPeriferico(resultado, 'Ubicación no disponible');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{etiqueta}</Text>

      <View style={styles.caja}>
        <View style={styles.info}>
          {ubicacion !== undefined ? (
            <>
              <Text style={styles.coordenadas}>{formatearUbicacion(ubicacion)}</Text>
              <Text style={styles.detalle}>Coordenadas del dispositivo</Text>
            </>
          ) : (
            <Text style={styles.detalle}>Sin ubicación registrada</Text>
          )}
        </View>

        {ocupado ? (
          <ActivityIndicator color={colors.primario} size="small" />
        ) : (
          <View style={styles.acciones}>
            {ubicacion !== undefined && (
              <Pressable
                onPress={() => onCambiar(undefined)}
                accessibilityRole="button"
                accessibilityLabel="Quitar la ubicación"
                style={({ pressed }) => [styles.accion, pressed && styles.presionado]}
              >
                <Text style={styles.textoQuitar}>Quitar</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => void capturar()}
              accessibilityRole="button"
              accessibilityLabel="Capturar la ubicación actual"
              style={({ pressed }) => [
                styles.accion,
                styles.accionPrincipal,
                pressed && styles.presionado,
              ]}
            >
              <Text style={styles.textoAccion}>
                {ubicacion === undefined ? 'Capturar' : 'Actualizar'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textoTenue,
    fontSize: fontSize.sm,
  },
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.superficie,
    borderRadius: radius.sm,
    borderWidth: borderWidth.thin,
    borderColor: colors.borde,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  coordenadas: {
    color: colors.texto,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  detalle: {
    color: colors.textoTenue,
    fontSize: fontSize.xs,
  },
  acciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  accion: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + spacing.sm / 2,
    borderRadius: radius.full,
  },
  accionPrincipal: {
    backgroundColor: colors.superficieAlta,
  },
  textoAccion: {
    color: colors.primario,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  textoQuitar: {
    color: colors.bajista,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  presionado: {
    opacity: opacity.pressed,
  },
});

export default CapturaUbicacion;
