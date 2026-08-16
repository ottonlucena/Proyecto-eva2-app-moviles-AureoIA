import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Boton from '../components/Boton';
import { useDiario } from '../context/DiarioContext';
import { colors } from '../theme/colors';
import { borderWidth, fontSize, radius, spacing } from '../theme/spacing';
import { formatearFecha } from '../utils/formato';
import type { ResultadoSincronizacion } from '../context/DiarioContext';

/**
 * Respaldo del diario en la nube.
 *
 * Las dos direcciones son explícitas y las dispara el usuario. No hay
 * sincronización automática en segundo plano: sin control de versiones por
 * operación, fusionar sin que el usuario lo pida puede resucitar registros
 * que borró a propósito.
 */
function SincronizacionScreen(): React.JSX.Element {
  const { operaciones, respaldo, sincronizando, respaldar, restaurar } = useDiario();
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoSincronizacion | undefined>();

  async function ejecutar(accion: () => Promise<ResultadoSincronizacion>): Promise<void> {
    setUltimoResultado(undefined);
    setUltimoResultado(await accion());
  }

  const haySincronizado = respaldo !== undefined;

  return (
    <ScrollView style={styles.pantalla} contentContainerStyle={styles.contenido}>
      <View style={styles.tarjeta}>
        <Text style={styles.tituloTarjeta}>Estado del respaldo</Text>

        <View style={styles.fila}>
          <Text style={styles.etiqueta}>En este dispositivo</Text>
          <Text style={styles.valor}>
            {operaciones.length} {operaciones.length === 1 ? 'operación' : 'operaciones'}
          </Text>
        </View>

        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Último respaldo</Text>
          <Text style={styles.valor}>
            {haySincronizado && respaldo.ultimaSincronizacion.length > 0
              ? formatearFecha(respaldo.ultimaSincronizacion)
              : 'Nunca'}
          </Text>
        </View>

        {haySincronizado && (
          <View style={styles.fila}>
            <Text style={styles.etiqueta}>Identificador</Text>
            <Text style={styles.identificador} numberOfLines={1}>
              {respaldo.idRemoto}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.acciones}>
        <Boton
          titulo="Respaldar en la nube"
          onPress={() => void ejecutar(respaldar)}
          disabled={sincronizando}
        />
        <Boton
          titulo="Importar desde la nube"
          variante="secundario"
          onPress={() => void ejecutar(restaurar)}
          disabled={sincronizando || !haySincronizado}
        />
      </View>

      {sincronizando && (
        <View style={styles.cargando}>
          <ActivityIndicator color={colors.primario} />
          <Text style={styles.textoCargando}>Hablando con el servidor…</Text>
        </View>
      )}

      {ultimoResultado !== undefined && !sincronizando && (
        <View
          style={[
            styles.aviso,
            { borderColor: ultimoResultado.ok ? colors.alcista : colors.bajista },
          ]}
        >
          <Text
            style={[
              styles.textoAviso,
              { color: ultimoResultado.ok ? colors.alcista : colors.bajista },
            ]}
          >
            {ultimoResultado.mensaje}
          </Text>
        </View>
      )}

      <Text style={styles.nota}>
        El diario funciona completo sin conexión. El respaldo es un extra para
        recuperarlo si cambiás de dispositivo. Al importar, las operaciones de
        este teléfono tienen prioridad: nunca se pisan con una versión vieja.
      </Text>

      <Text style={styles.advertencia}>
        El servicio de respaldo es público y sin autenticación, elegido para esta
        evaluación. No guardes en él información personal.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenido: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.borde,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tituloTarjeta: {
    color: colors.texto,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  etiqueta: {
    color: colors.textoTenue,
    fontSize: fontSize.sm,
  },
  valor: {
    color: colors.texto,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  identificador: {
    flex: 1,
    color: colors.textoTenue,
    fontSize: fontSize.xs,
    textAlign: 'right',
  },
  acciones: {
    gap: spacing.sm,
  },
  cargando: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  textoCargando: {
    color: colors.textoTenue,
    fontSize: fontSize.sm,
  },
  aviso: {
    borderWidth: borderWidth.thin,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  textoAviso: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  nota: {
    color: colors.textoTenue,
    fontSize: fontSize.xs,
    lineHeight: fontSize.md,
  },
  advertencia: {
    color: colors.primarioTenue,
    fontSize: fontSize.xs,
    lineHeight: fontSize.md,
  },
});

export default SincronizacionScreen;
