# Áureo

Diario de operaciones de oro con periféricos del dispositivo e integración con
servicios web. Aplicación móvil construida con React Native + Expo + TypeScript
mediante un arnés agéntico de inteligencia artificial.

**Asignatura:** DESARROLLO DE APLICACIONES MÓVILES
**Evaluación:** Sumativa Unidad 2
**Profesor:** Boris Marcelo Belmar Muñoz
**Integrantes:** Otton Lucena, Valeria Gomez

---

## 1. Objetivo de la app

Áureo es un compañero para aprender a operar oro (XAUUSD) sin arriesgar dinero
real: paper trading y diario de operaciones pensados para quien recién empieza
en trading y quiere practicar en un entorno seguro antes de tocar una cuenta
real. La estética imita una terminal de trading —oro sobre fondo casi negro,
con verde y rojo reservados exclusivamente para representar velas alcistas y
bajistas— para que la app se sienta como una herramienta profesional desde el
primer momento, no como un juego.

La **Unidad 1** dejó construida la puerta de entrada: identidad visual,
componentes reutilizables, navegación y las pantallas de bienvenida y login.

La **Unidad 2** —esta entrega— amplía el proyecto con lo que exige el resultado
de aprendizaje de la unidad:

- **Diario de operaciones** con alta, edición, baja y cierre/reapertura, más el
  cálculo del resultado en dólares de cada operación cerrada.
- **Cámara y galería** para adjuntar la foto del gráfico a cada operación.
- **GPS** para registrar dónde se anotó cada operación.
- **Cotización real del oro** consultada a una API pública.
- **Respaldo e importación** del diario contra un servicio web REST.
- **Almacenamiento local** que permite usar la app completa sin conexión.
- **216 pruebas automatizadas** que verifican periféricos y APIs.

---

## 2. Estructura de carpetas

```
src/
├── types/
│   └── operacion.ts          Modelo de datos. Sin dependencias.
├── domain/
│   ├── diario.ts             Reglas del diario. Funciones puras.
│   └── validacion.ts         Guardián de los datos que vienen de afuera.
├── storage/
│   ├── operacionesStorage.ts Persistencia del diario en el dispositivo.
│   └── respaldoStorage.ts    Identificador del último respaldo remoto.
├── api/
│   ├── cliente.ts            Cliente HTTP común. Timeout y errores tipados.
│   ├── cotizacionApi.ts      Precio del oro en vivo.
│   └── sincronizacionApi.ts  Respaldo e importación del diario.
├── services/
│   ├── interpretes.ts        Decisiones de los periféricos. Puro, testeable.
│   ├── camaraService.ts      Cámara y galería.
│   ├── ubicacionService.ts   GPS.
│   └── tipos.ts              Resultado de periférico y límite de espera.
├── context/
│   └── DiarioContext.tsx     Estado compartido. Única fuente de verdad.
├── hooks/
│   └── useCotizacion.ts      Consulta y refresco del precio.
├── components/               Piezas visuales reutilizables.
├── screens/                  Pantallas de la aplicación.
├── navigation/               Configuración del stack.
├── theme/                    Colores y espaciados. Única fuente de estilo.
└── utils/                    Formateo y avisos al usuario.
```

Las capas tienen una **dependencia estrictamente descendente**: las pantallas
conocen los servicios, los servicios conocen el dominio, y el dominio no conoce
a nadie. Ninguna pantalla llama a `fetch` ni a un módulo de Expo directamente;
todo pasa por la capa correspondiente, que devuelve un resultado ya
interpretado.

La consecuencia práctica de esa separación es la testabilidad: las decisiones
—¿el usuario canceló?, ¿estas coordenadas son creíbles?, ¿esta respuesta del
servidor es confiable?— viven en funciones puras, separadas de la ejecución.
`services/interpretes.ts` es el ejemplo más claro: importa los tipos de Expo
con `import type`, que TypeScript borra al compilar, así que se prueba sin
cámara ni GPS.

---

## 3. Justificación de decisiones

### Stack: Expo en lugar de Ionic

El enunciado de la evaluación menciona Ionic con plugins de Capacitor. Esta
entrega usa **React Native con Expo**, decisión **confirmada con el profesor**.
Las razones:

1. **Continuidad.** El enunciado dice que "este proyecto será ampliado en esta
   unidad", y el proyecto de la Unidad 1 ya era Expo. Reescribirlo en Ionic no
   habría sido ampliarlo sino empezar de cero.
2. **La cátedra.** La clase de esta unidad se dictó íntegramente sobre Expo,
   instalando `expo-image-picker` y `expo-location`.
3. **La competencia no depende del framework.** El resultado de aprendizaje
   habla de usar periféricos e integrar servicios web; ambas cosas se
   demuestran igual con los módulos de Expo que con los plugins de Capacitor.

### Periféricos

**Instalación con `npx expo install`**, no con `npm install`, para que Expo
resuelva la versión compatible con el SDK en lugar de traer la última
publicada. Versiones: `expo-image-picker` 17.0.11 y `expo-location` 19.0.8.

**Calidad de foto 0.6.** Las imágenes se guardan en el dispositivo y viajan en
el respaldo; sin comprimir inflan ambos sin aportar detalle útil para lo que se
captura, que es un gráfico.

**Galería además de cámara.** Un emulador sin cámara configurada, o un usuario
que prefiere no dar ese permiso, quedarían sin forma de adjuntar nada si la
cámara fuera la única vía.

**Timeout de 15 s en todo periférico.** Un GPS sin señal no falla: simplemente
nunca resuelve la promesa. Sin un reloj que la corte, la pantalla queda
esperando para siempre.

**Precisión balanceada** en el GPS. Alcanza para dejar constancia de dónde se
registró la operación, consume menos batería y fija posición más rápido bajo
techo que la precisión máxima.

### Permisos

Se piden **en tiempo de ejecución**, cuando el usuario intenta usar la
funcionalidad, nunca al arrancar la app. Se declaran **solo los necesarios**:
deliberadamente **no** se declara `ACCESS_BACKGROUND_LOCATION`, porque la app
registra dónde estabas al anotar una operación, no te sigue.

Cuando el permiso queda **denegado definitivamente** (`canAskAgain: false`), el
sistema ya no vuelve a preguntar y la app no tiene forma de solicitarlo: se
ofrece abrir los ajustes, que es la única salida. Sin eso el usuario queda
bloqueado sin entender por qué el botón no hace nada.

La app **funciona sin ningún permiso concedido**: foto y coordenadas son campos
opcionales.

### Integración con servicios web

Dos servicios, ambos **sin clave de acceso, elegidos a propósito**: el
repositorio es público y una API con credenciales habría exigido guardar un
secreto que tarde o temprano termina en el historial de commits. No hay nada
que filtrar porque no hay nada que ocultar. Una prueba verifica que ninguna
petición lleve cabeceras de autorización.

| Servicio               | Uso                                    |
| ---------------------- | -------------------------------------- |
| `api.gold-api.com`     | Precio real de XAU/USD                 |
| `api.restful-api.dev`  | Respaldo e importación del diario      |

**Errores como valor, no como excepción.** En un móvil la red falla
constantemente; quedarse sin señal es flujo normal, no una situación
excepcional. Se distinguen cuatro tipos (`red`, `timeout`, `http`, `formato`)
porque llevan a acciones distintas, y se conserva el código de estado: de
detectar un 404 depende que un respaldo borrado se vuelva a crear.

**Importar fusiona, no reemplaza.** Reemplazar borraría lo registrado después
del último respaldo. Ante el mismo `id` gana la versión local, porque el
dispositivo es la fuente de verdad de lo que el usuario acaba de hacer.

**Todo dato entrante se valida.** Una API puede cambiar su contrato sin avisar,
y un precio inválido llegaría hasta el cálculo de resultados y lo falsearía en
silencio.

### Estado compartido

El diario vive en un **Context**, no en estado local por pantalla. Con estado
por pantalla, la lista y el resumen quedan desincronizados al navegar y hay que
forzar una recarga cada vez que una pantalla recupera el foco. Con una única
fuente de verdad el problema no existe.

### Diseño

La identidad se definió alrededor del concepto de "terminal de trading, no
juego": paleta oro (`#E8B04B`) sobre fondo casi negro (`#0B0E11`), con verde
(`#16C784`) y rojo (`#EA3943`) reservados estrictamente para velas alcistas y
bajistas —nunca como color decorativo—. El logo es una vela japonesa construida
enteramente con `View`, sin assets externos.

---

## 4. Pruebas automatizadas

**216 pruebas en 14 archivos**, ~3 segundos de ejecución. Jest con el preset
`jest-expo`, más React Native Testing Library para lo que necesita montar
componentes.

```bash
npm test                 # ejecuta la suite completa
npm run test:watch       # re-ejecuta al guardar
npm run test:cobertura   # informe de cobertura
npm run typecheck        # verifica tipos sin generar archivos
```

Los módulos nativos y `fetch` se sustituyen en `jest.setup.js`. No es un
atajo: es la única forma de provocar de manera repetible los escenarios que más
importan y que a mano serían casi irreproducibles —un GPS que nunca responde,
un servidor que devuelve 503, un permiso denegado para siempre—.

### Cobertura por capa

| Capa       | Cobertura |
| ---------- | --------- |
| `utils`    | 100 %     |
| `domain`   | 98 %      |
| `api`      | 98 %      |
| `services` | 98 %      |
| `context`  | 97 %      |
| `storage`  | 96 %      |
| `hooks`    | 95 %      |

La cobertura global es 64 %: las pantallas y la mayoría de componentes visuales
no tienen pruebas. Fue **deliberado** — la rúbrica evalúa la fiabilidad de los
periféricos y de la integración con APIs, no la disposición de elementos en
pantalla, y las pruebas de renderizado son caras de mantener y frágiles ante
cualquier cambio de diseño. Aun así se incluyó una prueba de interacción
completa sobre `CapturaUbicacion`, desde la pulsación hasta las coordenadas
mostradas.

### Un defecto real que encontraron las pruebas

La primera versión de `aplicarCambio` en `DiarioContext` leía la lista desde el
actualizador de `setState` para persistirla. React no ejecuta ese actualizador
en el momento de llamarlo, así que `guardarOperaciones` recibía el valor
anterior: **registrabas tu primera operación, la veías en pantalla, cerrabas la
app y el diario aparecía vacío**.

La prueba lo detectó de inmediato porque verificaba no solo el estado en memoria
sino lo efectivamente escrito en el dispositivo. Es exactamente el tipo de
defecto que no aparece revisando el código ni corriendo `tsc`, y que llega al
usuario como pérdida silenciosa de datos. La corrección fue mantener el diario
también en una referencia que se actualiza de inmediato.

---

## 5. Limitaciones conocidas

Documentadas a conciencia, no omitidas:

- **El servicio de respaldo es público y sin autenticación.** Quien conozca el
  identificador de un respaldo puede leerlo o borrarlo. Sirve para demostrar la
  integración REST, que es lo que evalúa la unidad, pero no para datos reales.
  El diario es de operaciones simuladas. La app advierte esto en pantalla.
- **La autenticación es local.** El login valida campos y da respuesta visual,
  pero no verifica contra un servidor ni separa datos por usuario.
- **Las fotos no viajan al respaldo.** Se guarda la ruta local de la imagen, no
  la imagen. Al importar en otro teléfono las operaciones llegan completas pero
  sin sus fotos.
- **Dependencia de servicios gratuitos de terceros.** Mitigado por diseño: el
  diario funciona completo sin conexión y la caída de cualquier servicio degrada
  la experiencia sin impedir el uso.

---

## 6. Proveedor y modelos de IA

**Arnés:** OpenCode y Claude Code, ambos en terminal Ghostty sobre Linux Mint.

| Modelo                       | Uso dentro del proyecto                             |
| ---------------------------- | --------------------------------------------------- |
| `big-pickle` (OpenCode)      | Generación de componentes y pantallas (Unidad 1)    |
| Claude Sonnet 5 (Claude Code)| Revisión contra AGENTS.md y documentación (Unidad 1)|
| Claude Opus 5 (Claude Code)  | Desarrollo completo de la Unidad 2                  |

En la Unidad 2 se trabajó con Claude Code sobre Opus 5 en una sola sesión con
visión de todo el repositorio. El flujo fue una funcionalidad por vez, cada una
verificada antes de commitear con `tsc --noEmit`, la suite de pruebas y un
`expo export` que confirma que el bundle compila. Ese ciclo de verificación fue
lo que expuso el defecto de persistencia descrito arriba.

---

## 7. Constitución del arnés agéntico

Expo genera automáticamente un `AGENTS.md`, un `CLAUDE.md` y
`.claude/settings.json` con contexto del SDK. El equipo **conservó esa base y la
amplió** con una constitución propia: stack, estructura de carpetas, reglas
innegociables, identidad visual, convenciones y flujo de trabajo. Ver
[`AGENTS.md`](./AGENTS.md).

Reglas principales: ningún color hexadecimal fuera de `theme/colors.ts`; ningún
número mágico fuera de `theme/spacing.ts`; estilos siempre con
`StyleSheet.create`; solo componentes funcionales con hooks; todo input
controlado; toda prop tipada con `interface`; TypeScript estricto, prohibido
`any`; los componentes reutilizables viven en `components/` y nunca se duplican.

---

## 8. Instrucciones de ejecución

### Requisitos previos

- Node.js 20 o superior
- La app **Expo Go** en tu teléfono (Android o iOS)

### Pasos

```bash
git clone https://github.com/ottonlucena/Proyecto-eva2-app-moviles-AureoIA.git
cd Proyecto-eva2-app-moviles-AureoIA
npm install
npm start
```

Escanea el código QR con Expo Go (Android) o con la cámara (iOS). El teléfono y
el computador deben estar en la misma red Wi-Fi. Si la conexión falla, usa
`npx expo start --tunnel`.

### Probar los periféricos en un emulador

- **GPS:** en los controles extendidos del emulador → *Location*, activar la
  señal de GPS, fijar un punto en el mapa y guardarlo. **Sin este paso el
  emulador no entrega coordenadas** y la captura agotará su tiempo de espera.
- **Cámara:** el perfil del dispositivo virtual debe tener una cámara
  configurada. Si no, usar la opción *Galería*.

Ambos periféricos se comportan mejor en un teléfono físico con Expo Go.

---

## 9. Documentación

El análisis, el diseño y las decisiones técnicas están en [`docs/`](./docs/), con
su propio índice y orden de lectura:

| Documento | Qué contiene |
| --------- | ------------ |
| [`docs/brief.md`](./docs/brief.md) | El problema en nuestras palabras y qué queda fuera |
| [`docs/mvp.md`](./docs/mvp.md) | Alcance, historias de usuario y definición de "terminado" |
| [`docs/domain.md`](./docs/domain.md) | La operación, sus estados y las reglas R1–R10 |
| [`docs/stack.md`](./docs/stack.md) | Tecnologías elegidas y alternativas descartadas |
| [`docs/architecture.md`](./docs/architecture.md) | Capas, periféricos, red, estado y deuda técnica |
| [`docs/design.md`](./docs/design.md) | Paleta, tipografía, formatos y tono |
| [`docs/testing.md`](./docs/testing.md) | Estrategia de pruebas |

## 10. Entrega

En [`entrega/`](./entrega/):

- `informe-evu2.fodt` — fuente del informe en ODF plano. **Es lo único versionado.**
- `capturas-pendientes.md` — guía de las 16 capturas: dónde tomarlas y qué debe
  verse en cada una.

Los entregables se generan desde la fuente y quedan fuera del repositorio:

```bash
soffice --headless --convert-to docx entrega/informe-evu2.fodt --outdir entrega
soffice --headless --convert-to pdf  entrega/informe-evu2.fodt --outdir entrega
```
