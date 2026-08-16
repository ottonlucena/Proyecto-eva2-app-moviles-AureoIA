# Estrategia de pruebas — Áureo

## 1. Qué hay

**216 pruebas en 14 archivos**, ~3 segundos de ejecución.

```bash
npm test                 # suite completa
npm run test:watch       # re-ejecuta al guardar
npm run test:cobertura   # informe de cobertura
npm run typecheck        # tipos, sin generar archivos
```

| Archivo | Qué verifica |
|---|---|
| `domain/__tests__/diario.test.ts` | Reglas R1–R10, cálculo de resultado, fusión |
| `domain/__tests__/validacion.test.ts` | El guardián de las dos fronteras |
| `storage/__tests__/operacionesStorage.test.ts` | Persistencia y lectura defensiva |
| `api/__tests__/cliente.test.ts` | HTTPS, códigos de estado, red, timeout |
| `api/__tests__/cotizacionApi.test.ts` | Validación del precio, ausencia de credenciales |
| `api/__tests__/sincronizacionApi.test.ts` | POST/PUT/GET, 404, datos alterados |
| `services/__tests__/interpretes.test.ts` | Decisiones de cámara y GPS |
| `services/__tests__/camaraService.test.ts` | Flujo completo de captura |
| `services/__tests__/ubicacionService.test.ts` | Flujo completo de ubicación |
| `context/__tests__/DiarioContext.test.tsx` | Coordinación memoria–dispositivo–servidor |
| `hooks/__tests__/useCotizacion.test.ts` | Consulta, error y refresco |
| `components/__tests__/CapturaUbicacion.test.tsx` | Interacción real en pantalla |
| `utils/__tests__/formato.test.ts` | Formateo de precios, fechas y números |
| `utils/__tests__/avisos.test.ts` | Aviso de permisos y salida a ajustes |

## 2. El principio: separar la decisión de la ejecución

Es lo que hace posible esta suite. Los módulos que hablan con la cámara, el GPS o la red
**solo orquestan**; la lógica de criterio vive en funciones puras.

`src/services/interpretes.ts` importa los tipos de Expo con `import type`, que TypeScript
borra al compilar. El módulo tipa contra la librería sin cargar nada nativo, y por eso se
prueba en cualquier entorno.

> Este patrón salió de un fracaso. La primera versión tenía `interpretarSeleccion` e
> `interpretarPosicion` dentro de los módulos que importan Expo. Al intentar probarlas
> fallaron: no se pueden cargar fuera de un dispositivo. El refactor fue consecuencia
> directa de escribir las pruebas.

## 3. Por qué se sustituyen los módulos nativos

No es un atajo. Es la única forma de provocar **de manera repetible** los escenarios que más
importan:

| Escenario | Reproducirlo a mano exigiría |
|---|---|
| GPS que nunca fija posición | Bajar a un sótano y esperar |
| Permiso denegado para siempre | Reinstalar la app y negar dos veces |
| Servidor que devuelve 503 | Que el servicio real se caiga justo ahora |
| Respaldo alterado por un tercero | Que alguien modifique el objeto remoto |
| Sin conexión a mitad de una subida | Cortar el WiFi en el instante exacto |

Todo se sustituye en `jest.setup.js`: AsyncStorage por su implementación en memoria,
`expo-image-picker` y `expo-location` por funciones simuladas, y `fetch` en cada archivo que
lo necesita.

## 4. Qué se cubre en periféricos

Camino feliz, cancelación del usuario, permiso negado, permiso negado definitivamente,
respuesta sin imágenes, coordenadas fuera de rango, coordenadas no numéricas, valores de
borde (±90, ±180), el origen `(0,0)` como coordenada válida, y el periférico que no responde.

Dos pruebas merecen mención:

**El periférico que se cuelga.** Se simula con una promesa que nunca resuelve y se avanza el
reloj:

```ts
posicionActual.mockReturnValue(new Promise(() => {}));
const promesa = obtenerUbicacion();
await jest.advanceTimersByTimeAsync(16_000);
expect((await promesa).estado).toBe('error');
```

**Que el periférico no se invoque sin permiso.** No es visible en la interfaz, pero es lo que
distingue una gestión de permisos correcta de una que solo muestra un cartel:

```ts
expect(abrirCamara).not.toHaveBeenCalled();
```

## 5. Qué se cubre en la integración con APIs

Rechazo de HTTP plano, códigos 400/404/429/500/503, caída de red, respuesta que no es JSON,
aborto por timeout, serialización del cuerpo, y que la cabecera de tipo de contenido solo
viaje cuando hay cuerpo.

Sobre seguridad, hay una prueba explícita:

```ts
it('no envía ninguna credencial: no hay secretos que filtrar', async () => {
  await obtenerCotizacion();
  const [url, opciones] = fetchSimulado.mock.calls[0];
  expect(url).not.toMatch(/api[_-]?key|token|secret/i);
  expect(JSON.stringify(opciones.headers)).not.toMatch(/authorization|api[_-]?key/i);
});
```

Sobre la manipulación de datos externos: que un respaldo con registros alterados no contamine
el diario, que la fusión no genere duplicados, y que la versión local prevalezca sobre la
remota.

## 6. El defecto que encontraron las pruebas

Las pruebas de `DiarioContext` no confirmaron un comportamiento correcto: **encontraron un
error que ya estaba en el código** y que no se veía ni revisándolo ni corriendo `tsc`.

La versión defectuosa:

```ts
let resultado: Operacion[] = [];

setOperaciones((previas) => {
  resultado = transformar(previas);
  return resultado;
});

await guardarOperaciones(resultado);   // ← guardaba el valor anterior
```

React no ejecuta el actualizador en el momento de llamarlo, sino durante el renderizado
posterior. El síntoma para el usuario habría sido: **registrar la primera operación, verla en
pantalla, cerrar la app y encontrar el diario vacío.**

La prueba lo detectó al instante porque verificaba no solo el estado en memoria sino lo
efectivamente escrito en el dispositivo:

```
Expected length: 1
Received length: 0
Received array:  []
```

La corrección fue mantener el diario también en una referencia que se actualiza de inmediato.

**La lección:** una prueba que solo comprueba lo que devuelve la función habría pasado. Lo
que encontró el error fue verificar el **efecto observable** —lo que quedó en disco—, no el
valor de retorno.

## 7. Cobertura

| Capa | Cobertura |
|---|---|
| `utils` | 100 % |
| `domain` | 98 % |
| `api` | 98 % |
| `services` | 98 % |
| `context` | 97 % |
| `storage` | 96 % |
| `hooks` | 95 % |
| **Global** | **64 %** |

## 8. Qué NO se prueba, y por qué

**Las pantallas y la mayoría de componentes visuales.** Decisión deliberada, no descuido:

- Lo que se evalúa es la fiabilidad de los periféricos y de la integración con APIs, no la
  disposición de elementos en pantalla.
- Las pruebas de renderizado son caras de mantener y se rompen ante cualquier cambio de
  diseño, sin que eso signifique que algo dejó de funcionar.
- La lógica que podría fallar ya vive fuera de las pantallas, en capas que sí están cubiertas
  al 95 % o más.

La excepción es `CapturaUbicacion`, que se prueba de punta a punta —pulsación en pantalla →
coordenadas mostradas— porque concentra interacción real con un periférico.

Por eso la cifra global de 64 % no representa el estado del proyecto: **la lógica está sobre
el 95 %**, y lo que baja el promedio es código declarativo de presentación.

## 9. Regla para quien siga el proyecto

Toda lógica nueva en `domain/`, `api/`, `services/`, `storage/`, `hooks/` o `context/` viene
con sus pruebas, y esas capas se mantienen sobre el 95 %. Las pruebas cubren **los caminos de
fallo, no solo el feliz**. `npm test` y `npm run typecheck` pasan antes de cada commit.

Está escrito como reglas 22 a 25 en [`../AGENTS.md`](../AGENTS.md).

---

Volver al [índice de documentación](./README.md).
