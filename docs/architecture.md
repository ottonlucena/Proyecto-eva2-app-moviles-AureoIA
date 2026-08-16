# Arquitectura — Áureo

## 1. Visión general

El código está organizado en capas con una **dependencia estrictamente descendente**: las
pantallas conocen los servicios, los servicios conocen el dominio, y el dominio no conoce a
nadie.

```
   screens / components          ← lo que el usuario toca
            │
            ▼
   context / hooks               ← coordinación y estado
            │
      ┌─────┴─────┬──────────┐
      ▼           ▼          ▼
   services      api      storage      ← fronteras con el exterior
      │           │          │
      └─────┬─────┴──────────┘
            ▼
        domain / types              ← reglas puras, sin dependencias
```

Nada apunta hacia arriba. El dominio no importa React, ni Expo, ni AsyncStorage.

## 2. Las capas y sus responsabilidades

| Capa | Responsabilidad | Puede importar |
|---|---|---|
| `types/` | Modelo de datos | nada |
| `domain/` | Reglas del diario y validación. **Funciones puras.** | `types` |
| `storage/` | Persistencia local | `domain`, `types`, AsyncStorage |
| `api/` | Comunicación con servicios web | `domain`, `types` |
| `services/` | Acceso a periféricos | `domain`, `types`, Expo |
| `context/` | Estado compartido y coordinación | todas las anteriores |
| `hooks/` | Lógica de pantalla reutilizable | `api`, `services` |
| `components/` | Piezas visuales reutilizables | `services`, `domain`, `theme` |
| `screens/` | Pantallas | todo |

### Dos reglas de aislamiento

1. **Ninguna pantalla llama a `fetch`.** Todo pasa por `api/cliente.ts`.
2. **Ninguna pantalla importa `expo-image-picker` ni `expo-location`.** Todo pasa por
   `services/`, que devuelve un `ResultadoPeriferico`.

El objetivo no es la pureza arquitectónica: es que cambiar de librería de cámara, o de
proveedor de precios, toque un solo archivo.

## 3. La decisión que ordena todo: separar la decisión de la ejecución

Es el principio que más condicionó el diseño, y el que hizo viables las pruebas.

Los módulos que hablan con la cámara, el GPS o la red **solo orquestan**: piden el permiso,
lanzan la operación, aplican el timeout. Toda la **lógica de criterio** —¿el usuario canceló?,
¿estas coordenadas son creíbles?, ¿esta respuesta del servidor es confiable?— vive en
funciones puras separadas.

```
camaraService.ts          interpretes.ts
─────────────────         ──────────────────────
pide permiso        ───▶  interpretarPermiso()
lanza la cámara     ───▶  interpretarSeleccion()
aplica el timeout
```

`src/services/interpretes.ts` importa los tipos de Expo con **`import type`**, que TypeScript
elimina al compilar. El archivo tipa contra la librería sin cargar nada nativo, y por eso se
prueba en cualquier entorno sin simular la cámara ni el GPS.

> Este patrón no salió a la primera. La versión inicial tenía las funciones puras dentro de
> los módulos que importan Expo, y al intentar probarlas fallaron: no se pueden cargar fuera
> de un dispositivo. El refactor fue consecuencia directa de escribir las pruebas.

## 4. Resultados como valor, no como excepción

Las dos fronteras con el exterior devuelven uniones discriminadas en vez de lanzar:

```ts
// Periféricos
type ResultadoPeriferico<T> =
  | { estado: 'exito'; datos: T }
  | { estado: 'cancelado' }
  | { estado: 'sin-permiso'; puedeReintentar: boolean; mensaje: string }
  | { estado: 'error'; mensaje: string };

// Red
type Resultado<T> =
  | { ok: true; datos: T }
  | { ok: false; error: ErrorApi };
```

**Por qué no excepciones:** en un móvil, quedarse sin señal o cancelar una cámara son parte
del flujo normal de uso, no situaciones excepcionales. Modelarlas como excepciones invita a
olvidarlas; modelarlas como valores hace que el compilador obligue a tratarlas.

**Por qué cuatro casos y no un valor nulo:** cada desenlace exige una respuesta distinta de
la interfaz. Un cancelado no se comenta —el usuario cerró la cámara a propósito—; un permiso
denegado definitivamente ofrece abrir los ajustes; un error se explica. Colapsarlos en `null`
obligaría a la pantalla a adivinar cuál ocurrió.

## 5. Periféricos

### Timeout en todo

Cada llamada a un periférico va envuelta en `conTimeout` (15 s). Un periférico que **falla**
y uno que **no responde** son problemas distintos, y el segundo es el peligroso: un GPS sin
señal no lanza ningún error, simplemente nunca resuelve la promesa. Sin un reloj que la corte,
la pantalla queda esperando para siempre.

### Permisos

- Se piden **en tiempo de ejecución**, cuando el usuario intenta usar la funcionalidad.
  Nunca al arrancar: pedir permisos antes de que la persona entienda para qué sirven es la
  forma más segura de que los niegue.
- Se declara el **mínimo necesario**. Deliberadamente **no** se declara
  `ACCESS_BACKGROUND_LOCATION`: la app registra dónde estabas al anotar una operación, no te
  sigue.
- Si el permiso queda denegado con `canAskAgain: false`, el sistema ya no vuelve a preguntar
  y la app no tiene forma de solicitarlo. Se **ofrece abrir los ajustes**, que es la única
  salida. Sin eso el usuario queda bloqueado sin entender por qué el botón no hace nada.
- La app **funciona sin ningún permiso concedido**. Foto y coordenadas son opcionales.

## 6. Red

| Medida | Motivo |
|---|---|
| Solo HTTPS, verificado antes de conectar | Los datos nunca llegan a viajar en claro |
| Timeout de 10 s con `AbortController` | Aborta de verdad, no solo ignora la respuesta tardía |
| Errores tipados en 4 clases | Cada uno lleva a una acción distinta del usuario |
| Se conserva el código HTTP | De detectar un 404 depende recrear un respaldo borrado |
| Todo dato entrante se valida | Una API puede cambiar su contrato sin avisar |
| Cero credenciales | El repositorio es público |

### Fusión al importar

Importar **no reemplaza** el diario local: lo fusiona. Reemplazar borraría todo lo registrado
después del último respaldo. Ante el mismo `id` en ambos lados **gana la versión local**,
porque el dispositivo es la fuente de verdad de lo que el usuario acaba de hacer, mientras
que el respaldo puede ser de hace días.

### Respaldo desaparecido

Si el objeto remoto fue borrado, el 404 se maneja explícitamente: **al subir** se crea uno
nuevo; **al bajar** se olvida el identificador muerto en vez de reintentar eternamente.

## 7. Dónde vive el estado

| Tipo de estado | Dónde | Ejemplo |
|---|---|---|
| Compartido entre pantallas | `DiarioContext` | La lista de operaciones |
| De una pantalla | `useState` local | Los campos del formulario |
| Derivado | Se calcula al renderizar | Resultado acumulado, contador de abiertas |
| Remoto cacheado | `useCotizacion` | El precio del oro |

**El estado derivado nunca se guarda.** El resultado acumulado se recalcula a partir de las
operaciones en cada render. Guardarlo abriría la posibilidad de que quede desincronizado.

### La referencia junto al estado

`DiarioContext` mantiene la lista **también** en un `useRef`. No es duplicación gratuita:

React no ejecuta el actualizador de `setState` en el momento de llamarlo, sino durante el
renderizado posterior. La primera versión leía la lista desde ahí para persistirla, y
`guardarOperaciones` recibía el valor anterior —el usuario registraba su primera operación,
la veía en pantalla, cerraba la app y el diario aparecía vacío—. La referencia se actualiza
de forma inmediata y da un valor fiable tanto para escribir en el dispositivo como para dos
acciones seguidas.

El defecto lo encontró una prueba. Ver [`testing.md`](./testing.md).

## 8. Cuando algo falla de verdad

| Falla | Qué hace la app |
|---|---|
| Sin red al consultar el precio | Muestra el error y ofrece reintentar. Si ya había un precio, lo conserva |
| Sin red al respaldar | Informa y no toca el diario local |
| Permiso denegado | Explica; si es definitivo, ofrece los ajustes |
| GPS sin señal | Se rinde a los 15 s con «Probá al aire libre» |
| Datos corruptos en el dispositivo | Descarta lo inválido y conserva lo válido |
| Respaldo alterado por terceros | Valida operación por operación y descarta lo que no cumple |
| Respaldo borrado del servidor | Crea uno nuevo al subir; olvida el id al bajar |

El principio común: **degradar, no romper**. El diario siempre sigue usable.

## 9. Estructura de carpetas

```
src/
├── types/operacion.ts
├── domain/
│   ├── diario.ts             Reglas R1–R10
│   └── validacion.ts         Guardián de las dos fronteras
├── storage/
│   ├── operacionesStorage.ts
│   └── respaldoStorage.ts
├── api/
│   ├── cliente.ts            Timeout, HTTPS, errores tipados
│   ├── cotizacionApi.ts
│   └── sincronizacionApi.ts
├── services/
│   ├── interpretes.ts        Puro. Se prueba sin dispositivo
│   ├── camaraService.ts
│   ├── ubicacionService.ts
│   └── tipos.ts              ResultadoPeriferico y conTimeout
├── context/DiarioContext.tsx
├── hooks/useCotizacion.ts
├── components/
├── screens/
├── navigation/
├── theme/                    Única fuente de color y espaciado
└── utils/
```

Las pruebas viven en `__tests__/` dentro de la carpeta que prueban.

## 10. Deuda técnica declarada

| Deuda | Por qué se asumió | Qué haría falta |
|---|---|---|
| El respaldo es público y sin autenticación | Demuestra la integración REST sin credenciales en un repo público. El diario es simulado. La app lo advierte en pantalla | Backend propio con auth por usuario |
| La autenticación es local | La rúbrica de la unidad no la evalúa | Verificación contra servidor y clave de storage por usuario |
| Las fotos no viajan al respaldo | Se guarda la ruta local, no la imagen. Subirlas multiplicaría el tamaño | Codificar y subir a almacenamiento de objetos |
| Pantallas sin pruebas de renderizado | Caras de mantener y frágiles ante cambios de diseño | Pruebas de interacción en las pantallas críticas |
| Sin ESLint | El typecheck estricto y las reglas de `AGENTS.md` cubren lo esencial | Configurar `eslint-config-expo` |

---

Siguiente documento: [`design.md`](./design.md) — cómo se ve la app y por qué.
