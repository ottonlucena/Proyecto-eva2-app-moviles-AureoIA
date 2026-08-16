# Elección tecnológica y su justificación

## Resumen

| Capa | Elección | Versión |
|---|---|---|
| Framework | React Native mediante Expo | SDK 54 |
| Lenguaje | TypeScript en modo estricto | 5.9 |
| Navegación | React Navigation (native-stack) | 7 |
| Estado compartido | React Context | — |
| Persistencia local | AsyncStorage | 2.2 |
| Cámara y galería | `expo-image-picker` | 17.0.11 |
| Ubicación | `expo-location` | 19.0.8 |
| Pruebas | Jest + preset `jest-expo` + RNTL | 29.7 |
| Cotización | `api.gold-api.com` | pública, sin clave |

## 1. Framework: Expo, no Ionic

El enunciado de la evaluación menciona Ionic con plugins de Capacitor. Usamos Expo, y la
decisión está **confirmada con el profesor**.

**Por qué:**

- **Continuidad.** El enunciado pide ampliar el proyecto de la Unidad 1, que ya era Expo.
  Reescribirlo en Ionic no habría sido ampliarlo sino empezar de cero.
- **La cátedra.** La clase de esta unidad se dictó íntegramente sobre Expo, instalando
  `expo-image-picker` y `expo-location`.
- **La competencia no depende del framework.** El resultado de aprendizaje habla de usar
  periféricos e integrar servicios web. Ambas cosas se demuestran igual con los módulos de
  Expo que con los plugins de Capacitor.

**Lo que descartamos:** React Native puro sin Expo. Habría obligado a configurar a mano el
acceso a cámara y GPS en Android e iOS, y a compilar binarios nativos para probar. Expo Go
permite probar en un teléfono real escaneando un QR.

## 2. Instalación de dependencias: `expo install`

Todas las dependencias nativas se instalan con `npx expo install`, **nunca** con
`npm install`. La diferencia importa: `expo install` resuelve la versión compatible con el
SDK del proyecto, mientras que `npm install` trae la última publicada, que puede no serlo.

La única excepción documentada es `react-test-renderer`: `expo install` trajo la 19.2.8, que
exige React 19.2, pero el proyecto usa React 19.1. Se fijó a mano en 19.1.0.

## 3. Lenguaje: TypeScript estricto

`strict: true` y **prohibido `any`**. En una app que consume dos APIs externas y lee datos
guardados en el dispositivo, el sistema de tipos es la primera línea de defensa.

Se usa de forma deliberada en dos lugares donde aporta más que documentación:

- **Uniones discriminadas** para los resultados (`ResultadoPeriferico<T>`, `Resultado<T>`).
  El compilador obliga a tratar cada caso; no se puede olvidar el «canceló» ni el «sin red».
- **`import type`** en `services/interpretes.ts`. TypeScript borra esos imports al compilar,
  así que el módulo tipa contra Expo sin cargar nada nativo, y por eso se puede probar sin
  dispositivo. Ver [`testing.md`](./testing.md).

## 4. Navegación: React Navigation native-stack

Es el estándar de la comunidad Expo y da transiciones y gestos nativos (swipe-back en iOS)
sin reimplementarlos. Las rutas están tipadas en `src/navigation/types.ts`, de modo que
navegar a una pantalla inexistente o con parámetros equivocados es un error de compilación.

## 5. Estado compartido: Context, no una librería

El diario vive en un `DiarioContext` y no en Redux, Zustand ni Jotai.

**Por qué basta Context:** hay una sola colección de datos compartida entre tres pantallas.
Traer una librería de estado para eso agrega una dependencia, un concepto y una curva de
aprendizaje sin resolver ningún problema que exista en este proyecto.

**Por qué no estado local por pantalla:** fue la alternativa real, y se descartó. Con estado
por pantalla, la lista y el resumen quedan desincronizados al navegar, y hay que forzar una
recarga cada vez que una pantalla recupera el foco. Con una única fuente de verdad el
problema no existe.

## 6. Persistencia: AsyncStorage

Clave-valor simple, que es exactamente lo que se necesita: el diario entero se serializa a
JSON bajo una clave. No hay consultas, ni relaciones, ni índices que justifiquen SQLite.

**Lo que descartamos:** `expo-sqlite`. Habría aportado consultas que esta app no hace, a
cambio de esquemas y migraciones que sí habría que mantener.

## 7. API externa: pública y sin credenciales

El servicio se eligió **deliberadamente entre los que no requieren clave de acceso**.

El repositorio es público. Una API con credenciales habría exigido guardar un secreto que,
tarde o temprano, termina en el historial de commits —y en una app móvil el secreto además
viaja dentro del binario, donde cualquiera puede extraerlo—. No hay nada que filtrar porque
no hay nada que ocultar. Una prueba automatizada verifica que ninguna petición lleve
cabeceras de autorización ni claves en la URL.

| Servicio | Rol | Verbos usados |
|---|---|---|
| `api.gold-api.com/price/XAU` | Precio real del oro | GET |

**Sobre el respaldo remoto que no está.** Se implementó contra `api.restful-api.dev` y se
retiró tras medir sus límites reales: rechaza cuerpos mayores a ~1 KB y admite 50 peticiones
cada 24 horas. Se evaluaron cinco alternativas anónimas —jsonblob, npoint, extendsclass,
kvdb y textdb— y todas exigen credenciales, bloquean el acceso o fallan en silencio.
Firebase y Supabase sí funcionarían, pero requieren una cuenta viva al momento de la
corrección. Un backend propio se descartó desde el principio: es otra asignatura, y la
evaluación mide la integración **del cliente móvil**, no la del servidor. La conclusión está
documentada como deuda técnica en [`architecture.md`](./architecture.md).

## 8. Pruebas: Jest con preset `jest-expo`

El preset resuelve la transformación de los módulos de React Native y Expo, que no se pueden
importar en Node sin más. Se complementa con React Native Testing Library para lo poco que
necesita montar componentes.

Los módulos nativos y `fetch` se sustituyen en `jest.setup.js`. No es un atajo: es la única
forma de provocar de manera repetible un GPS que nunca responde, un servidor que devuelve
503 o un permiso denegado para siempre.

## 9. Lo que decidimos no incluir

| Descartado | Por qué |
|---|---|
| Redux / Zustand | Context alcanza para una sola colección compartida. |
| SQLite | No hay consultas que justifiquen un motor relacional. |
| Librería de gráficos | La foto del gráfico real cubre la necesidad y justifica la cámara. |
| Firebase / Supabase | Exigen credenciales en un repositorio público. |
| `expo-camera` | `expo-image-picker` da cámara **y** galería con una sola dependencia. |
| ESLint | El typecheck estricto y las reglas de `AGENTS.md` cubren lo que importa acá. |

---

Siguiente documento: [`architecture.md`](./architecture.md) — cómo se organiza el código.
