import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import Boton from '../components/Boton';
import OperacionItem from '../components/OperacionItem';
import { useDiario } from '../context/DiarioContext';
import { calcularResultadoTotal, contarAbiertas } from '../domain/diario';
import { colors } from '../theme/colors';
import { borderWidth, fontSize, radius, spacing } from '../theme/spacing';
import type { RootStackParamList } from '../navigation/types';
import type { Operacion } from '../types/operacion';
import { formatearResultado } from '../utils/formato';

type DiarioScreenProps = NativeStackScreenProps<RootStackParamList, 'Diario'>;

function DiarioScreen({ navigation }: DiarioScreenProps): React.JSX.Element {
  const { operaciones, cargando, alternar } = useDiario();

  const abiertas = contarAbiertas(operaciones);
  const resultadoTotal = calcularResultadoTotal(operaciones);

  function abrirFormulario(id?: string): void {
    navigation.navigate('OperacionForm', id === undefined ? undefined : { id });
  }

  /**
   * Cerrar una operación necesita un precio de salida. Se confirma con el
   * usuario en lugar de asumir uno, porque de ese precio depende el resultado.
   */
  function handleAlternarEstado(id: string): void {
    const operacion = operaciones.find((actual) => actual.id === id);
    if (operacion === undefined) return;

    if (operacion.estado === 'cerrada') {
      void alternar(id);
      return;
    }

    Alert.alert(
      'Cerrar operación',
      'Se registrará el resultado usando el precio de entrada. Podés ajustar el precio de salida editando la operación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar', onPress: () => void alternar(id) },
      ],
    );
  }

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator color={colors.primario} size="large" />
        <Text style={styles.textoCargando}>Abriendo tu diario…</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <View style={styles.resumen}>
        <View style={styles.bloqueResumen}>
          <Text style={styles.valorResumen}>{abiertas}</Text>
          <Text style={styles.etiquetaResumen}>
            {abiertas === 1 ? 'operación abierta' : 'operaciones abiertas'}
          </Text>
        </View>
        <View style={styles.separadorResumen} />
        <View style={styles.bloqueResumen}>
          <Text
            style={[
              styles.valorResumen,
              { color: resultadoTotal >= 0 ? colors.alcista : colors.bajista },
            ]}
          >
            {formatearResultado(resultadoTotal)}
          </Text>
          <Text style={styles.etiquetaResumen}>resultado acumulado</Text>
        </View>
      </View>

      <FlatList<Operacion>
        data={operaciones}
        keyExtractor={(operacion) => operacion.id}
        renderItem={({ item }) => (
          <OperacionItem
            operacion={item}
            onPress={abrirFormulario}
            onAlternarEstado={handleAlternarEstado}
          />
        )}
        contentContainerStyle={[
          styles.lista,
          operaciones.length === 0 && styles.listaVacia,
        ]}
        ItemSeparatorComponent={() => <View style={styles.separadorItems} />}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Text style={styles.tituloVacio}>Tu diario está en blanco</Text>
            <Text style={styles.textoVacio}>
              Registrá tu primera operación de oro para empezar a llevar la cuenta.
            </Text>
          </View>
        }
      />

      <View style={styles.pie}>
        <Boton titulo="Registrar operación" onPress={() => abrirFormulario()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  centrado: {
    flex: 1,
    backgroundColor: colors.fondo,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  textoCargando: {
    color: colors.textoTenue,
    fontSize: fontSize.sm,
  },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.superficie,
    borderBottomWidth: borderWidth.thin,
    borderBottomColor: colors.borde,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  bloqueResumen: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  separadorResumen: {
    width: borderWidth.thin,
    alignSelf: 'stretch',
    backgroundColor: colors.borde,
  },
  valorResumen: {
    color: colors.texto,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  etiquetaResumen: {
    color: colors.textoTenue,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  lista: {
    padding: spacing.md,
  },
  listaVacia: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separadorItems: {
    height: spacing.sm,
  },
  vacio: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  tituloVacio: {
    color: colors.texto,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  textoVacio: {
    color: colors.textoTenue,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  pie: {
    padding: spacing.md,
    borderTopWidth: borderWidth.thin,
    borderTopColor: colors.borde,
    backgroundColor: colors.fondo,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
});

export default DiarioScreen;
