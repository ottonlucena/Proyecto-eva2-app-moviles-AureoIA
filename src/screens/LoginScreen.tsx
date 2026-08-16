import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Boton from '../components/Boton';
import CampoTexto from '../components/CampoTexto';
import { colors } from '../theme/colors';
import { fontSize, spacing } from '../theme/spacing';

function LoginScreen(): React.JSX.Element {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errorUsuario, setErrorUsuario] = useState<string | undefined>();
  const [errorContrasena, setErrorContrasena] = useState<string | undefined>();
  const [logueado, setLogueado] = useState(false);

  function handleIngresar(): void {
    const hayErrorUsuario = usuario.trim().length === 0;
    const hayErrorContrasena = contrasena.trim().length === 0;

    setErrorUsuario(hayErrorUsuario ? 'El correo es obligatorio.' : undefined);
    setErrorContrasena(
      hayErrorContrasena ? 'La contraseña es obligatoria.' : undefined,
    );

    if (hayErrorUsuario || hayErrorContrasena) return;

    Alert.alert('Bienvenido', `Hola, ${usuario}!`);
    setLogueado(true);
  }

  if (logueado) {
    return (
      <View style={styles.centered}>
        <Text style={styles.welcomeTitle}>¡Bienvenido, {usuario}!</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <Text style={styles.heading}>Iniciar sesión</Text>

        <View style={styles.form}>
          <CampoTexto
            etiqueta="Correo o usuario"
            valor={usuario}
            onChangeText={(t) => {
              setUsuario(t);
              if (errorUsuario) setErrorUsuario(undefined);
            }}
            placeholder="tu@email.com"
            error={errorUsuario}
          />

          <CampoTexto
            etiqueta="Contraseña"
            valor={contrasena}
            onChangeText={(t) => {
              setContrasena(t);
              if (errorContrasena) setErrorContrasena(undefined);
            }}
            placeholder="••••••••"
            secureTextEntry
            error={errorContrasena}
          />

          <View style={styles.buttonWrapper}>
            <Boton titulo="Ingresar" onPress={handleIngresar} />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.fondo,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.fondo,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  heading: {
    color: colors.texto,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.xl + spacing.sm,
    textAlign: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  buttonWrapper: {
    marginTop: spacing.md,
  },
  welcomeTitle: {
    color: colors.primario,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LoginScreen;
