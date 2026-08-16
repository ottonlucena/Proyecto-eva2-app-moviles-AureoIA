# Áureo

Aplicación móvil construida con React Native + TypeScript mediante un arnés
agéntico de inteligencia artificial.

**Asignatura:** DESARROLLO DE APLICACIONES MÓVILES
**Integrantes:** Otton Lucena, Valeria Gomez

---

## 1. Objetivo de la app

Áureo es un compañero para aprender a operar oro (XAUUSD) sin arriesgar dinero
real: paper trading, diario de operaciones y micro-lecciones pensadas para
quien recién empieza en trading y quiere practicar en un entorno seguro antes
de tocar una cuenta real. La estética imita una terminal de trading —oro sobre
fondo casi negro, con verde y rojo reservados exclusivamente para representar
velas alcistas y bajistas— para que la app se sienta como una herramienta
profesional desde el primer momento, no como un juego.

En su versión final, Áureo permitiría al usuario simular operaciones de
compra/venta sobre el precio del oro con saldo ficticio, registrar cada
operación en un diario con notas y resultado, y avanzar por micro-lecciones
cortas sobre conceptos básicos de trading (spread, apalancamiento, gestión de
riesgo, lectura de velas). Esta entrega cubre únicamente la puerta de
entrada de esa app: la pantalla de **bienvenida** (presentación de marca y
llamada a la acción) y la pantalla de **login** (formulario controlado con
validación y respuesta visual), que es la base de navegación sobre la que se
construirán el resto de las pantallas.

---

## 2. Estructura de carpetas

```
src/
├── theme/
│   ├── colors.ts        Paleta de marca. Única fuente de colores.
│   └── spacing.ts       Escala de espaciados, radios y tamaños.
├── components/          Componentes reutilizables.
│   ├── Boton.tsx
│   └── CampoTexto.tsx
├── screens/
│   ├── WelcomeScreen.tsx
│   └── LoginScreen.tsx
└── navigation/
    └── RootNavigator.tsx
App.tsx                  Punto de entrada. Monta el navegador.
assets/                  Ícono, splash y logo.
```

La estructura separa el proyecto por responsabilidad: `theme/` centraliza
toda decisión de diseño (colores, espaciados, radios, tamaños de fuente) para
que ningún componente o pantalla defina un valor visual por su cuenta;
`components/` contiene únicamente piezas reutilizables sin lógica de
pantalla, para que un botón o un campo de texto se implementen una sola vez
y se reutilicen en toda la app; `screens/` contiene la lógica y el estado
propios de cada pantalla; y `navigation/` aísla la configuración del stack de
React Navigation del resto del código. Este criterio evita duplicación,
facilita mantener la identidad visual coherente y hace que agregar una
pantalla nueva no implique tocar el theme ni los componentes existentes.

---

## 3. Justificación de decisiones

**Template:** blank-typescript, como exige la evaluación, para construir desde
cero sin pantallas preconstruidas.

**SDK 54:** se fijó esta versión por compatibilidad garantizada con Expo Go
en dispositivo físico durante la transición de Expo al SDK 57, evitando que
el equipo tuviera que lidiar con incompatibilidades de la versión de Expo Go
publicada en las tiendas mientras se probaba en un teléfono real.

**React Navigation (native-stack):** es la librería exigida por la
constitución del equipo para navegación (regla no negociable del stack) y la
opción estándar de la comunidad Expo/React Native para transiciones entre
pantallas con apariencia y gestos nativos (swipe-back en iOS, animaciones de
plataforma), lo cual encaja con la estética de "terminal de trading" que se
buscaba para Áureo sin tener que reimplementar transiciones a mano.

**Diseño:** la identidad se definió alrededor del concepto de "terminal de
trading, no juego": paleta oro (`#E8B04B`) sobre fondo casi negro
(`#0B0E11`), con verde (`#16C784`) y rojo (`#EA3943`) reservados
estrictamente para representar velas alcistas y bajistas —nunca como color
decorativo—, tal como exige la regla de identidad visual del equipo. El logo
es una vela japonesa construida enteramente con `View` (sin assets
externos), reforzando la temática sin depender de imágenes. La tipografía
usa una escala de tamaños (`fontSize`) centralizada en el theme para mantener
jerarquía visual consistente entre pantallas.

---

## 4. Proveedor y modelos de IA

**Arnés:** OpenCode y Claude Code, ambos ejecutados en terminal Ghostty sobre
Linux Mint.

**Proveedor:** mixto. OpenCode enruta a distintos proveedores según el
modelo seleccionado; el modelo usado para generación de código dentro de
OpenCode se identifica internamente como `big-pickle`. Para revisión y
documentación se usó Claude Code (Anthropic).

| Modelo                        | Uso dentro del proyecto                           |
| ----------------------------- | ------------------------------------------------- |
| `big-pickle` (OpenCode)       | Generación de componentes, pantallas y navegación |
| Claude Sonnet 5 (Claude Code) | Revisión de código contra las reglas de AGENTS.md |
| Claude Sonnet 5 (Claude Code) | Documentación                                     |

Se usó OpenCode con `big-pickle` para el trabajo de generación pantalla por
pantalla porque era la herramienta con la que el equipo iteraba día a día en
el editor. Para la auditoría de cumplimiento contra `AGENTS.md` y para
redactar este README se cambió a Claude Code con Sonnet 5, ejecutado en una
sesión aparte con visión de todo el repositorio a la vez: esto permitió
contrastar cada archivo contra las reglas del equipo (colores fuera del
theme, `any`, inputs no controlados, props sin tipar) en una sola pasada y
corregir lo que encontró, algo que resultaba más difícil de mantener
disciplinado dentro del flujo de generación rápida de OpenCode.

---

## 5. Constitución del arnés agéntico

**Transparencia:** Expo genera automáticamente un `AGENTS.md`, un `CLAUDE.md`
y `.claude/settings.json` con contexto de la SDK. El equipo **conservó esa
base y la amplió** con una constitución propia (secciones "Constitución del
equipo" dentro de `AGENTS.md`): stack, estructura de carpetas, reglas
innegociables, identidad visual, convenciones y flujo de trabajo.

**Archivos de contexto:**

- `AGENTS.md` — contexto de Expo (generado) + constitución del equipo (propia).
- `CLAUDE.md` — configuración para Claude Code.

**Reglas definidas:** ningún color hexadecimal fuera de `theme/colors.ts`;
ningún espaciado, radio o tamaño de fuente —ni, en general, ningún número
mágico— fuera de `theme/spacing.ts`; estilos siempre con `StyleSheet.create`;
solo componentes funcionales con hooks (nada de clases); todo input
controlado vía `useState` + `onChangeText`; toda prop de componente tipada
con una `interface` explícita; TypeScript en modo estricto, prohibido `any`;
el botón de login siempre debe dar una respuesta visual al presionarse
(nunca un botón muerto); y los componentes reutilizables viven en
`components/`, nunca se duplica un botón o campo de texto copiando y
pegando.

**Flujo de trabajo:** una pantalla o funcionalidad por sesión (los commits
del repositorio reflejan esto: componentes base → pantalla de bienvenida →
navegación → login interactivo → pulido visual), con el agente explicando
en español qué generó archivo por archivo antes de cada commit, y prueba en
Expo Go en un teléfono real previa a confirmar. Un caso concreto de
corrección: en la auditoría de cumplimiento contra `AGENTS.md`, Claude Code
detectó que `Boton.tsx`, `CampoTexto.tsx` y `WelcomeScreen.tsx` tenían
valores de `opacity`, `borderWidth` y `letterSpacing` escritos como
literales sueltos en los estilos en vez de salir de `theme/spacing.ts` —una
violación de la regla 2 de la constitución que había pasado el review visual
pero no una auditoría regla por regla—. Se le pidió al agente corregirlo:
agregó las escalas `borderWidth`, `opacity` y `letterSpacing` al theme y
reemplazó cada literal por su referencia, dejando el proyecto sin números
mágicos sueltos.

---

## 6. Instrucciones de ejecución

### Requisitos previos

- Node.js 20 o superior
- La app **Expo Go** en tu teléfono (Android o iOS)

### Pasos

```bash
git clone https://github.com/ottonlucena/Proyecto-eva1-app-moviles-AureoIA.git
cd Proyecto-eva1-app-moviles-AureoIA
npm install
npx expo start
```

Escanea el código QR con Expo Go (Android) o con la cámara (iOS). El teléfono
y el computador deben estar en la misma red Wi-Fi. Si la conexión falla, usa
`npx expo start --tunnel`.
