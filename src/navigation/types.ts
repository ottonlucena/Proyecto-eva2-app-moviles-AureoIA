/**
 * Tipos de navegación — cada pantalla y sus parámetros.
 * Agregá aquí cada ruta nueva a medida que crezca la app.
 */
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Diario: undefined;
  /** Sin `id` registra una operación nueva; con `id` edita la existente. */
  OperacionForm: { id?: string } | undefined;
  Sincronizacion: undefined;
};
