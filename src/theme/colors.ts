export const colors = {
  primario: "#E8B04B",        // oro — acción principal, marca
  primarioTenue: "#B8863B",   // oro apagado — bordes, estados presionados
  secundario: "#3B82F6",      // azul — información, enlaces
  fondo: "#0B0E11",           // casi negro — fondo de la app
  superficie: "#151A21",      // tarjetas y campos
  superficieAlta: "#1E252E",  // elementos elevados
  borde: "#2A323C",           // bordes sutiles
  texto: "#F5F3EE",           // crema — texto principal
  textoTenue: "#9AA4B2",      // gris azulado — texto secundario
  alcista: "#16C784",         // verde vela — éxito, subida
  bajista: "#EA3943",         // rojo vela — error, bajada
} as const;

export type Colors = typeof colors;
