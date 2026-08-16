import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BannerCotizacion from '../components/BannerCotizacion';
import Boton from '../components/Boton';
import CampoTexto from '../components/CampoTexto';
import SelectorTipo from '../components/SelectorTipo';
import { useDiario } from '../context/DiarioContext';
import { useCotizacion } from '../hooks/useCotizacion';
import { colors } from '../theme/colors';
import { fontSize, spacing } from '../theme/spacing';
import type { RootStackParamList } from '../navigation/types';
import type { DatosOperacion, TipoOperacion } from '../types/operacion';
import { parsearNumero } from '../utils/formato';

type OperacionFormScreenProps = NativeStackScreenProps<RootStackParamList, 'OperacionForm'>;

interface ErroresFormulario {
  precioEntrada?: string;
  lotes?: string;
  precioSalida?: string;
}

/** Convierte un número a texto para el campo, o deja vacío si no hay valor. */
function aTexto(valor: number | undefined): string {
  return valor === undefined ? '' : String(valor);
}

function OperacionFormScreen({
  navigation,
  route,
}: OperacionFormScreenProps): React.JSX.Element {
  const { operaciones, registrar, editar, eliminar } = useDiario();
  const { cotizacion, cargando: cargandoPrecio, error: errorPrecio, refrescar } = useCotizacion();

  const id = route.params?.id;
  const operacionExistente = operaciones.find((operacion) => operacion.id === id);
  const esEdicion = operacionExistente !== undefined;

  const [tipo, setTipo] = useState<TipoOperacion>(operacionExistente?.tipo ?? 'compra');
  const [precioEntrada, setPrecioEntrada] = useState(
    aTexto(operacionExistente?.precioEntrada),
  );
  const [precioSalida, setPrecioSalida] = useState(aTexto(operacionExistente?.precioSalida));
  const [lotes, setLotes] = useState(aTexto(operacionExistente?.lotes) || '1');
  const [notas, setNotas] = useState(operacionExistente?.notas ?? '');
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [guardando, setGuardando] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: esEdicion ? 'Editar operación' : 'Nueva operación',
    });
  }, [navigation, esEdicion]);

  /**
   * Valida los campos numéricos y devuelve los datos listos para guardar.
   * Devuelve `undefined` si algo no pasa la validación, dejando los mensajes
   * de error visibles junto a cada campo.
   */
  function validar(): DatosOperacion | undefined {
    const entradaNumero = parsearNumero(precioEntrada);
    const lotesNumero = parsearNumero(lotes);
    const salidaNumero = parsearNumero(precioSalida);

    const nuevosErrores: ErroresFormulario = {};

    if (entradaNumero === undefined || entradaNumero <= 0) {
      nuevosErrores.precioEntrada = 'Ingresá un precio de entrada mayor a cero.';
    }

    if (lotesNumero === undefined || lotesNumero <= 0) {
      nuevosErrores.lotes = 'Ingresá una cantidad de lotes mayor a cero.';
    }

    // El precio de salida es opcional, pero si se escribe algo debe ser válido.
    if (precioSalida.trim().length > 0 && (salidaNumero === undefined || salidaNumero <= 0)) {
      nuevosErrores.precioSalida = 'El precio de salida debe ser mayor a cero.';
    }

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) return undefined;
    if (entradaNumero === undefined || lotesNumero === undefined) return undefined;

    return {
      tipo,
      precioEntrada: entradaNumero,
      lotes: lotesNumero,
      notas: notas.trim(),
      ...(salidaNumero !== undefined ? { precioSalida: salidaNumero } : {}),
    };
  }

  async function handleGuardar(): Promise<void> {
    const datos = validar();
    if (datos === undefined) return;

    setGuardando(true);

    try {
      if (esEdicion && id !== undefined) {
        await editar(id, datos);
      } else {
        await registrar(datos);
      }
      navigation.goBack();
    } catch {
      setGuardando(false);
      Alert.alert(
        'No se pudo guardar',
        'Ocurrió un problema al escribir en el dispositivo. Intentá de nuevo.',
      );
    }
  }

  function handleEliminar(): void {
    if (id === undefined) return;

    Alert.alert(
      'Eliminar operación',
      'Esta operación se borrará de tu diario y no se puede recuperar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void eliminar(id).then(() => navigation.goBack());
          },
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <BannerCotizacion
          cotizacion={cotizacion}
          cargando={cargandoPrecio}
          error={errorPrecio}
          onRefrescar={refrescar}
          onUsarPrecio={(precio) => {
            setPrecioEntrada(precio.toFixed(2));
            setErrores({ ...errores, precioEntrada: undefined });
          }}
        />

        <SelectorTipo etiqueta="Sentido de la operación" valor={tipo} onChange={setTipo} />

        <CampoTexto
          etiqueta="Precio de entrada (US$ por onza)"
          valor={precioEntrada}
          onChangeText={(texto) => {
            setPrecioEntrada(texto);
            if (errores.precioEntrada) setErrores({ ...errores, precioEntrada: undefined });
          }}
          placeholder="2345.60"
          keyboardType="decimal-pad"
          error={errores.precioEntrada}
        />

        <CampoTexto
          etiqueta="Precio de salida (opcional)"
          valor={precioSalida}
          onChangeText={(texto) => {
            setPrecioSalida(texto);
            if (errores.precioSalida) setErrores({ ...errores, precioSalida: undefined });
          }}
          placeholder="Dejalo vacío si la operación sigue abierta"
          keyboardType="decimal-pad"
          error={errores.precioSalida}
        />

        <CampoTexto
          etiqueta="Lotes"
          valor={lotes}
          onChangeText={(texto) => {
            setLotes(texto);
            if (errores.lotes) setErrores({ ...errores, lotes: undefined });
          }}
          placeholder="1"
          keyboardType="decimal-pad"
          error={errores.lotes}
        />

        <CampoTexto
          etiqueta="Notas"
          valor={notas}
          onChangeText={setNotas}
          placeholder="¿Por qué entraste? ¿Qué viste en el gráfico?"
          multiline
        />

        <View style={styles.acciones}>
          <Boton
            titulo={guardando ? 'Guardando…' : 'Guardar operación'}
            onPress={() => void handleGuardar()}
            disabled={guardando}
          />

          {esEdicion && (
            <Boton titulo="Eliminar" onPress={handleEliminar} variante="secundario" />
          )}
        </View>

        <Text style={styles.ayuda}>
          Un lote equivale a 100 onzas. El resultado se calcula al cerrar la operación.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenido: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  acciones: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ayuda: {
    color: colors.textoTenue,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
});

export default OperacionFormScreen;
