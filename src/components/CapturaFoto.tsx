import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { elegirDeGaleria, tomarFoto } from '../services/camaraService';
import { colors } from '../theme/colors';
import { borderWidth, fontSize, opacity, radius, spacing } from '../theme/spacing';
import { avisarFalloPeriferico } from '../utils/avisos';

interface CapturaFotoProps {
  etiqueta: string;
  /** Ruta local de la foto ya adjunta, si hay alguna. */
  fotoUri: string | undefined;
  onCambiar: (fotoUri: string | undefined) => void;
}

/**
 * Adjunta una foto a la operación, con la cámara o desde la galería.
 *
 * Se ofrecen las dos vías porque un emulador sin cámara y un usuario que
 * negó ese permiso quedarían sin forma de adjuntar nada si solo existiera la
 * cámara.
 */
function CapturaFoto({ etiqueta, fotoUri, onCambiar }: CapturaFotoProps): React.JSX.Element {
  const [ocupado, setOcupado] = useState(false);

  async function capturar(
    accion: typeof tomarFoto,
    tituloError: string,
  ): Promise<void> {
    setOcupado(true);

    try {
      const resultado = await accion();

      if (resultado.estado === 'exito') {
        onCambiar(resultado.datos);
        return;
      }

      avisarFalloPeriferico(resultado, tituloError);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{etiqueta}</Text>

      {fotoUri !== undefined ? (
        <View style={styles.previsualizacion}>
          <Image
            source={{ uri: fotoUri }}
            style={styles.imagen}
            resizeMode="cover"
            accessibilityLabel="Foto adjunta a la operación"
          />
          <Pressable
            onPress={() => onCambiar(undefined)}
            accessibilityRole="button"
            accessibilityLabel="Quitar la foto"
            style={({ pressed }) => [styles.quitar, pressed && styles.presionado]}
          >
            <Text style={styles.textoQuitar}>Quitar</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.marcador}>
          <Text style={styles.textoMarcador}>Sin foto adjunta</Text>
        </View>
      )}

      <View style={styles.acciones}>
        <Pressable
          onPress={() => void capturar(tomarFoto, 'Cámara no disponible')}
          disabled={ocupado}
          accessibilityRole="button"
          accessibilityLabel="Tomar una foto con la cámara"
          style={({ pressed }) => [
            styles.accion,
            ocupado && styles.deshabilitado,
            pressed && styles.presionado,
          ]}
        >
          <Text style={styles.textoAccion}>
            {fotoUri === undefined ? 'Tomar foto' : 'Volver a tomar'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void capturar(elegirDeGaleria, 'Galería no disponible')}
          disabled={ocupado}
          accessibilityRole="button"
          accessibilityLabel="Elegir una foto de la galería"
          style={({ pressed }) => [
            styles.accion,
            ocupado && styles.deshabilitado,
            pressed && styles.presionado,
          ]}
        >
          <Text style={styles.textoAccion}>Galería</Text>
        </Pressable>
      </View>

      {ocupado && (
        <View style={styles.cargando}>
          <ActivityIndicator color={colors.primario} size="small" />
          <Text style={styles.textoCargando}>Esperando al dispositivo…</Text>
        </View>
      )}
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
  previsualizacion: {
    gap: spacing.sm,
  },
  imagen: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.superficie,
  },
  marcador: {
    height: spacing.xxl + spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.superficie,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.borde,
    borderStyle: 'dashed',
  },
  textoMarcador: {
    color: colors.textoTenue,
    fontSize: fontSize.sm,
  },
  acciones: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  accion: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.superficie,
    borderWidth: borderWidth.thin,
    borderColor: colors.borde,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + spacing.xs,
  },
  quitar: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.superficieAlta,
  },
  textoQuitar: {
    color: colors.bajista,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  textoAccion: {
    color: colors.primario,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  deshabilitado: {
    opacity: opacity.disabled,
  },
  presionado: {
    opacity: opacity.pressed,
  },
  cargando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  textoCargando: {
    color: colors.textoTenue,
    fontSize: fontSize.xs,
  },
});

export default CapturaFoto;
