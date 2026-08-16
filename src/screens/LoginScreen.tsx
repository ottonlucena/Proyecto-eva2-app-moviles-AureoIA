import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Boton from '../components/Boton';
import CampoTexto from '../components/CampoTexto';
import { useSesion } from '../context/SesionContext';
import { colors } from '../theme/colors';
import { fontSize, spacing } from '../theme/spacing';
import type { RootStackParamList } from '../navigation/types';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

function LoginScreen({ navigation }: LoginScreenProps): React.JSX.Element {
  const { iniciarSesion } = useSesion();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errorUsuario, setErrorUsuario] = useState<string | undefined>();
  const [errorContrasena, setErrorContrasena] = useState<string | undefined>();

  function handleIngresar(): void {
    const hayErrorUsuario = usuario.trim().length === 0;
    const hayErrorContrasena = contrasena.trim().length === 0;

    setErrorUsuario(hayErrorUsuario ? 'El correo es obligatorio.' : undefined);
    setErrorContrasena(
      hayErrorContrasena ? 'La contraseña es obligatoria.' : undefined,
    );

    if (hayErrorUsuario || hayErrorContrasena) return;

    // Al iniciar sesión se carga el diario de este usuario. Dos personas que
    // compartan el teléfono no ven las operaciones de la otra.
    void iniciarSesion(usuario).then(() => {
      // `replace` en lugar de `navigate`: una vez dentro, el gesto de volver
      // no debe devolver al formulario de acceso.
      navigation.replace('Diario');
    });
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
});

export default LoginScreen;
