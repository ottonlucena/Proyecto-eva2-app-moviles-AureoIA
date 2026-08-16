import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { borderWidth, fontSize, opacity, radius, spacing } from '../theme/spacing';

interface BotonProps {
  titulo: string;
  onPress: (event: GestureResponderEvent) => void;
  variante?: 'primario' | 'secundario';
  disabled?: boolean;
}

function Boton({
  titulo,
  onPress,
  variante = 'primario',
  disabled = false,
}: BotonProps): React.JSX.Element {
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const baseStyle: ViewStyle = disabled
    ? styles.disabled
    : variante === 'primario'
      ? styles.primarioBase
      : styles.secundarioBase;

  const dynamicStyle: ViewStyle = (() => {
    if (disabled) return {};
    if (isPressed) {
      return variante === 'primario'
        ? styles.primarioPressed
        : styles.secundarioPressed;
    }
    if (isFocused) {
      return variante === 'primario'
        ? styles.primarioFocused
        : styles.secundarioFocused;
    }
    return {};
  })();

  const textColor = disabled
    ? colors.textoTenue
    : variante === 'primario'
      ? colors.fondo
      : colors.primario;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      disabled={disabled}
      accessibilityRole="button"
      style={[styles.base, baseStyle, dynamicStyle]}
    >
      <Text style={[styles.text, { color: textColor }]}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarioBase: {
    backgroundColor: colors.primario,
  },
  primarioPressed: {
    backgroundColor: colors.primarioTenue,
    opacity: opacity.pressed,
  },
  primarioFocused: {
    borderWidth: borderWidth.thick,
    borderColor: colors.primario,
  },
  secundarioBase: {
    backgroundColor: 'transparent',
    borderWidth: borderWidth.thick,
    borderColor: colors.primario,
  },
  secundarioPressed: {
    backgroundColor: colors.superficieAlta,
    opacity: opacity.pressed,
  },
  secundarioFocused: {
    backgroundColor: colors.superficie,
  },
  disabled: {
    backgroundColor: colors.superficie,
    opacity: opacity.disabled,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});

export default Boton;
