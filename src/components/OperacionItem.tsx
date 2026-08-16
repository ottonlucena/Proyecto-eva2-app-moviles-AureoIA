import { Pressable, StyleSheet, Text, View } from 'react-native';
import { calcularResultado } from '../domain/diario';
import { colors } from '../theme/colors';
import { borderWidth, fontSize, letterSpacing, opacity, radius, spacing } from '../theme/spacing';
import type { Operacion } from '../types/operacion';
import { formatearFecha, formatearLotes, formatearPrecio, formatearResultado } from '../utils/formato';

interface OperacionItemProps {
  operacion: Operacion;
  /** Abre la operación para editarla. */
  onPress: (id: string) => void;
  /** Cierra la operación en curso o vuelve a abrirla. */
  onAlternarEstado: (id: string) => void;
}

function OperacionItem({
  operacion,
  onPress,
  onAlternarEstado,
}: OperacionItemProps): React.JSX.Element {
  const esCompra = operacion.tipo === 'compra';
  const colorTipo = esCompra ? colors.alcista : colors.bajista;
  const resultado = calcularResultado(operacion);
  const estaCerrada = operacion.estado === 'cerrada';

  return (
    <Pressable
      onPress={() => onPress(operacion.id)}
      accessibilityRole="button"
      accessibilityLabel={`Operación de ${operacion.tipo} a ${formatearPrecio(operacion.precioEntrada)}`}
      style={({ pressed }) => [styles.tarjeta, pressed && styles.tarjetaPresionada]}
    >
      <View style={styles.encabezado}>
        <View style={[styles.insigniaTipo, { borderColor: colorTipo }]}>
          <Text style={[styles.textoTipo, { color: colorTipo }]}>
            {esCompra ? 'COMPRA' : 'VENTA'}
          </Text>
        </View>
        <Text style={styles.precio}>{formatearPrecio(operacion.precioEntrada)}</Text>
      </View>

      <Text style={styles.metadatos}>
        {formatearLotes(operacion.lotes)} · {formatearFecha(operacion.fechaCreacion)}
      </Text>

      {operacion.notas.length > 0 && (
        <Text style={styles.notas} numberOfLines={2}>
          {operacion.notas}
        </Text>
      )}

      <View style={styles.pie}>
        <Pressable
          onPress={() => onAlternarEstado(operacion.id)}
          accessibilityRole="button"
          accessibilityLabel={estaCerrada ? 'Reabrir operación' : 'Cerrar operación'}
          hitSlop={spacing.sm}
          style={({ pressed }) => [
            styles.estado,
            estaCerrada ? styles.estadoCerrada : styles.estadoAbierta,
            pressed && styles.estadoPresionado,
          ]}
        >
          <Text style={[styles.textoEstado, estaCerrada && styles.textoEstadoCerrada]}>
            {estaCerrada ? 'Cerrada' : 'Abierta'}
          </Text>
        </Pressable>

        {resultado !== undefined && (
          <Text
            style={[
              styles.resultado,
              { color: resultado >= 0 ? colors.alcista : colors.bajista },
            ]}
          >
            {formatearResultado(resultado)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.borde,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tarjetaPresionada: {
    backgroundColor: colors.superficieAlta,
    opacity: opacity.pressed,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  insigniaTipo: {
    borderWidth: borderWidth.thin,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  textoTipo: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: letterSpacing.wide,
  },
  precio: {
    color: colors.texto,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  metadatos: {
    color: colors.textoTenue,
    fontSize: fontSize.xs,
  },
  notas: {
    color: colors.texto,
    fontSize: fontSize.sm,
  },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  estado: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  estadoAbierta: {
    backgroundColor: colors.superficieAlta,
  },
  estadoCerrada: {
    backgroundColor: colors.primario,
  },
  estadoPresionado: {
    opacity: opacity.pressed,
  },
  textoEstado: {
    color: colors.textoTenue,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  textoEstadoCerrada: {
    color: colors.fondo,
  },
  resultado: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});

export default OperacionItem;
