import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { borderWidth, fontSize, radius, spacing } from '../theme/spacing';

interface CampoTextoProps {
  etiqueta: string;
  valor: string;
  onChangeText: (texto: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  /** Teclado a mostrar. `decimal-pad` para precios y cantidades. */
  keyboardType?: KeyboardTypeOptions;
  /** Campo de varias líneas, para textos largos como las notas. */
  multiline?: boolean;
}

function CampoTexto({
  etiqueta,
  valor,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  multiline = false,
}: CampoTextoProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = error !== undefined && error.length > 0;

  const borderColor: ViewStyle['borderColor'] = hasError
    ? colors.bajista
    : isFocused
      ? colors.primario
      : colors.borde;

  const anchoBorde: ViewStyle['borderWidth'] = isFocused || hasError
    ? borderWidth.thick
    : borderWidth.thin;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{etiqueta}</Text>
      <TextInput
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textoTenue}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel={etiqueta}
        style={[
          styles.input,
          multiline && styles.inputMultilinea,
          { borderColor, borderWidth: anchoBorde },
        ]}
      />
      {hasError && <Text style={styles.error}>{error}</Text>}
    </View>
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
  input: {
    backgroundColor: colors.superficie,
    color: colors.texto,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    fontSize: fontSize.md,
  },
  inputMultilinea: {
    minHeight: spacing.xxl + spacing.lg,
    paddingTop: spacing.sm + spacing.xs,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.bajista,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});

export default CampoTexto;
