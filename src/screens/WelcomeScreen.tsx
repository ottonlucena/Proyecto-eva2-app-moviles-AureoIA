import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Boton from '../components/Boton';
import Logo from '../components/Logo';
import { colors } from '../theme/colors';
import { fontSize, letterSpacing, radius, spacing } from '../theme/spacing';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

function WelcomeScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      {/* Zona superior: logo + nombre + eslogan */}
      <View style={styles.hero}>
        <Logo />
        <Text style={styles.name}>Áureo</Text>
        <Text style={styles.slogan}>Aprende a operar oro, sin arriesgar.</Text>
      </View>

      {/* Zona inferior: botones */}
      <View style={styles.actions}>
        <Boton
          titulo="Comenzar"
          onPress={() => navigation.navigate('Login')}
        />
        <Pressable
          onPress={() => navigation.navigate('Login')}
          style={({ pressed }) => [
            styles.link,
            pressed && styles.linkPressed,
          ]}
        >
          <Text style={styles.linkText}>Ya tengo cuenta</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.fondo,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  name: {
    color: colors.texto,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    letterSpacing: letterSpacing.wide,
  },
  slogan: {
    color: colors.textoTenue,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  actions: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  link: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
  },
  linkPressed: {
    backgroundColor: colors.superficie,
  },
  linkText: {
    color: colors.textoTenue,
    fontSize: fontSize.sm,
  },
});

export default WelcomeScreen;
