---

# Constitución del equipo — [Nombre de tu app]

Estas reglas las define el equipo y complementan el contexto de Expo de arriba.
Todo agente que trabaje en este repositorio debe leerlas antes de generar código.

## 1. Stack (no negociable, exigido por la evaluación)

- Framework: React Native mediante Expo
- Lenguaje: TypeScript en modo estricto. Prohibido `any`. Prohibido JavaScript plano.
- Navegación: React Navigation (native-stack)
- Punto de partida: template blank-typescript (sin pantallas preconstruidas)

## 2. Estructura de carpetas

src/
theme/
colors.ts Paleta de marca. ÚNICA fuente de colores.
spacing.ts Escala de espaciados y tamaños.
components/ Componentes reutilizables (Boton, CampoTexto, Logo).
screens/
WelcomeScreen.tsx
LoginScreen.tsx
navigation/
RootNavigator.tsx
App.tsx Punto de entrada. Solo monta el navegador.
assets/ Ícono, splash, logo.

## 3. Reglas innegociables

1. NINGÚN color hexadecimal escrito directamente en un componente o pantalla.
   Todo color sale de `src/theme/colors.ts`.
2. Todo espaciado, radio y tamaño de fuente sale de `src/theme/spacing.ts`.
   Nada de números mágicos sueltos en los estilos.
3. Estilos SIEMPRE con `StyleSheet.create(...)`. Prohibido el estilo inline
   disperso.
4. Solo componentes funcionales con hooks. Prohibidas las clases.
5. Todo input es controlado: su valor vive en un `useState` y se actualiza
   con `onChangeText`.
6. Toda prop de componente se tipa con una `interface` explícita.
7. El botón de login SIEMPRE da una respuesta visual al presionarse
   (validación, mensaje, alerta o navegación). Nunca un botón muerto.
8. Componentes reutilizables van en `components/`; nunca se duplica un botón
   o un campo de texto copiando y pegando.

## 4. Identidad visual (criterio 2, 20%)

La app NO puede parecerse al template por defecto. El equipo define y respeta:

- Nombre de la app: Áureo
- Concepto: compañero para aprender a operar oro (XAUUSD) sin dinero real —
  paper trading, diario de operaciones y micro-lecciones.
- Usuario objetivo: alguien que empieza en trading y quiere practicar seguro.
- Paleta: oro sobre fondo casi negro (estética de terminal de trading);
  verde/rojo reservados para vela alcista/bajista, no como decoración.
- Logo: vela japonesa dorada construida con Views (sin assets externos).
- Eslogan: "Aprende a operar oro, sin arriesgar."

## 5. Convenciones

- Archivos de componentes y pantallas: PascalCase (`LoginScreen.tsx`).
- Archivos de utilidades y tema: camelCase (`colors.ts`).
- Funciones y variables: camelCase.
- Textos de interfaz y comentarios: en español.
- Commits: Conventional Commits en español (`feat:`, `fix:`, `docs:`, `style:`).

## 6. Flujo de trabajo con el agente

1. Una pantalla o funcionalidad por sesión. Prohibido generar toda la app
   en un solo prompt.
2. Después de cada funcionalidad, el agente explica en español qué generó,
   archivo por archivo, antes del commit.
3. El equipo prueba en Expo Go en un teléfono real antes de cada commit.
4. Si el agente propone una librería nueva, debe justificarla y esperar
   aprobación.
