import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

/**
 * Vela japonesa estilizada — solo Views y theme.
 * Cuatro barras verticales de distinta altura que evocan un mini gráfico de velas.
 */
function Logo(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={[styles.bar, { height: spacing.xl, backgroundColor: colors.borde }]} />
      <View style={[styles.bar, { height: spacing.xxl, backgroundColor: colors.primario }]} />
      <View style={[styles.bar, { height: spacing.lg, backgroundColor: colors.alcista }]} />
      <View style={[styles.bar, { height: spacing.xl + spacing.sm, backgroundColor: colors.borde }]} />
    </View>
  );
}

const BAR_WIDTH = spacing.sm + spacing.xs; // 12

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: radius.sm,
  },
});

export default Logo;
