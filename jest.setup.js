/**
 * Preparación del entorno de pruebas.
 *
 * Sustituye los módulos que dependen del hardware o de la red, para que la
 * suite corra en cualquier máquina sin cámara, sin GPS y sin conexión. Cada
 * prueba define después qué debe devolver cada sustituto según el caso que
 * esté verificando.
 */

// El almacenamiento del dispositivo se reemplaza por la implementación en
// memoria que publica la propia librería.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

// `Linking` no se sustituye acá: las pruebas que lo necesitan espían el
// módulo público de React Native, que es más estable que su ruta interna.
