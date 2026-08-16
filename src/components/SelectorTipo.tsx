import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { borderWidth, fontSize, letterSpacing, opacity, radius, spacing } from '../theme/spacing';
import type { TipoOperacion } from '../types/operacion';

interface SelectorTipoProps {
  etiqueta: string;
  valor: TipoOperacion;
  onChange: (tipo: TipoOperacion) => void;
}

/**
 * Elige el sentido de la operación. Se usan dos botones visibles en lugar de
 * un desplegable porque solo hay dos opciones y el color —verde para compra,
 * rojo para venta— comunica el sentido de un vistazo.
 */
function SelectorTipo({ etiqueta, valor, onChange }: SelectorTipoProps): React.JSX.Element {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{etiqueta}</Text>
      <View style={styles.grupo}>
        <OpcionTipo
          tipo="compra"
          texto="Compra"
          color={colors.alcista}
          seleccionado={valor === 'compra'}
          onPress={onChange}
        />
        <OpcionTipo
          tipo="venta"
          texto="Venta"
          color={colors.bajista}
          seleccionado={valor === 'venta'}
          onPress={onChange}
        />
      </View>
    </View>
  );
}

interface OpcionTipoProps {
  tipo: TipoOperacion;
  texto: string;
  color: string;
  seleccionado: boolean;
  onPress: (tipo: TipoOperacion) => void;
}

function OpcionTipo({
  tipo,
  texto,
  color,
  seleccionado,
  onPress,
}: OpcionTipoProps): React.JSX.Element {
  return (
    <Pressable
      onPress={() => onPress(tipo)}
      accessibilityRole="radio"
      accessibilityState={{ selected: seleccionado }}
      accessibilityLabel={texto}
      style={({ pressed }) => [
        styles.opcion,
        seleccionado
          ? { backgroundColor: color, borderColor: color }
          : { borderColor: colors.borde },
        pressed && styles.opcionPresionada,
      ]}
    >
      <Text
        style={[
          styles.textoOpcion,
          { color: seleccionado ? colors.fondo : colors.textoTenue },
        ]}
      >
        {texto}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textoTenue,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  grupo: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  opcion: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.superficie,
    borderWidth: borderWidth.thick,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + spacing.xs,
  },
  opcionPresionada: {
    opacity: opacity.pressed,
  },
  textoOpcion: {
    fontSize: fontSize.md,
    fontWeight: '600',
    letterSpacing: letterSpacing.wide,
  },
});

export default SelectorTipo;
