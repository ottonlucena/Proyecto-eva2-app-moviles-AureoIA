---

# Constitución del equipo — Áureo

Estas reglas las define el equipo y complementan el contexto de Expo de arriba.
Todo agente que trabaje en este repositorio debe leerlas antes de generar
código.

## 1. Stack (no negociable)

- Framework: React Native mediante Expo (SDK 54)
- Lenguaje: TypeScript en modo estricto. Prohibido `any`. Prohibido JavaScript
  plano.
- Navegación: React Navigation (native-stack)
- Estado compartido: React Context. Nada de librerías de estado externas.
- Persistencia local: AsyncStorage
- Periféricos: `expo-image-picker` y `expo-location`
- Pruebas: Jest con preset `jest-expo` + React Native Testing Library

**Sobre Ionic:** el enunciado de la Unidad 2 menciona Ionic con Capacitor. El
proyecto usa Expo, y esa decisión está **confirmada con el profesor**. No
migrar ni proponer migración.

**Instalación de dependencias:** siempre `npx expo install <paquete>`, nunca
`npm install`, para que Expo resuelva la versión compatible con el SDK. La
única excepción es cuando `expo install` falla por un conflicto de pares, en
cuyo caso se fija la versión a mano y se documenta por qué.

## 2. Estructura de carpetas

```
src/
  types/        Modelo de datos. Sin dependencias.
  domain/       Reglas de negocio y validación. Funciones puras.
  storage/      Persistencia local en el dispositivo.
  api/          Comunicación con servicios web externos.
  services/     Acceso a los periféricos del dispositivo.
  context/      Estado compartido.
  hooks/        Lógica de pantalla reutilizable.
  components/   Componentes reutilizables.
  screens/      Pantallas.
  navigation/   Configuración del stack.
  theme/        colors.ts y spacing.ts. ÚNICA fuente de estilo.
  utils/        Formateo y avisos.
App.tsx         Punto de entrada. Monta el proveedor y el navegador.
docs/           Fuente del informe de la evaluación.
```

**Dependencia estrictamente descendente:** las pantallas conocen los servicios,
los servicios conocen el dominio, el dominio no conoce a nadie. Nunca al revés.

## 3. Reglas innegociables

1. NINGÚN color hexadecimal escrito directamente en un componente o pantalla.
   Todo color sale de `src/theme/colors.ts`.
2. Todo espaciado, radio y tamaño de fuente sale de `src/theme/spacing.ts`.
   Nada de números mágicos sueltos en los estilos.
3. Estilos SIEMPRE con `StyleSheet.create(...)`. Prohibido el estilo inline
   disperso.
4. Solo componentes funcionales con hooks. Prohibidas las clases.
5. Todo input es controlado: su valor vive en un `useState` y se actualiza con
   `onChangeText`.
6. Toda prop de componente se tipa con una `interface` explícita.
7. Ningún botón muerto: toda acción da respuesta visual (validación, mensaje,
   alerta, navegación o indicador de carga).
8. Componentes reutilizables van en `components/`; nunca se duplica un botón o
   un campo de texto copiando y pegando.

## 4. Reglas de periféricos

9. Ninguna pantalla importa `expo-image-picker` ni `expo-location`
    directamente. Se usa siempre `services/`, que devuelve un
    `ResultadoPeriferico`.
10. Toda llamada a un periférico va envuelta en `conTimeout`. Un GPS sin señal
    no falla: nunca resuelve. Sin timeout la pantalla queda colgada.
11. La **decisión** va separada de la **ejecución**. Lo que interpreta una
    respuesta (¿canceló?, ¿las coordenadas son creíbles?) vive en
    `services/interpretes.ts`, que solo usa `import type` y por eso se prueba
    sin dispositivo. Si agregás un periférico, seguí ese patrón.
12. Los permisos se piden en tiempo de ejecución, cuando el usuario intenta
    usar la funcionalidad. Nunca al arrancar la app.
13. Se declara el permiso MÍNIMO necesario. No agregar
    `ACCESS_BACKGROUND_LOCATION` ni permisos "por si acaso".
14. Un permiso denegado con `canAskAgain: false` debe ofrecer abrir los
    ajustes. Es la única salida que le queda al usuario.
15. La app debe seguir siendo usable sin ningún permiso concedido. Los datos de
    periféricos son siempre campos opcionales.

## 5. Reglas de red

16. Ninguna pantalla ni servicio llama a `fetch` directamente. Todo pasa por
    `api/cliente.ts`.
17. Solo HTTPS. El cliente rechaza HTTP plano antes de intentar la conexión.
18. Los errores se devuelven como valor (`Resultado<T>`), no se lanzan. En un
    móvil quedarse sin red es flujo normal, no una excepción.
19. Se conserva el código de estado HTTP. De detectar un 404 depende que un
    respaldo borrado se vuelva a crear.
20. TODO dato que llega de la red se valida antes de entrar a la app. Una API
    puede cambiar su contrato sin avisar.
21. **Prohibido introducir APIs con clave de acceso.** El repositorio es
    público. Si una funcionalidad nueva la exige, hay que discutirlo con el
    equipo antes de escribir código.

## 6. Reglas de pruebas

22. Toda lógica nueva en `domain/`, `api/`, `services/`, `storage/`, `hooks/` o
    `context/` viene con sus pruebas. Esas capas se mantienen sobre el 95 % de
    cobertura.
23. Las pantallas y los componentes puramente visuales NO se prueban con
    renderizado, salvo que concentren interacción real. Son caras de mantener y
    frágiles ante cambios de diseño.
24. Las pruebas cubren los caminos de fallo, no solo el feliz: permiso negado,
    cancelación, timeout, 404, red caída, datos corruptos.
25. `npm test` y `npm run typecheck` deben pasar antes de cada commit.

## 7. Identidad visual

La app NO puede parecerse al template por defecto.

- Nombre: Áureo
- Concepto: compañero para aprender a operar oro (XAUUSD) sin dinero real.
- Usuario objetivo: alguien que empieza en trading y quiere practicar seguro.
- Paleta: oro sobre fondo casi negro (estética de terminal de trading).
  Verde/rojo reservados EXCLUSIVAMENTE para vela alcista/bajista, jamás como
  decoración.
- Logo: vela japonesa construida con Views, sin assets externos.
- Eslogan: "Aprende a operar oro, sin arriesgar."

## 8. Convenciones

- Archivos de componentes y pantallas: PascalCase (`LoginScreen.tsx`).
- Archivos de utilidades, dominio y servicios: camelCase (`colors.ts`).
- Pruebas: `__tests__/<modulo>.test.ts` junto a la capa que prueban.
- Funciones y variables: camelCase, en español.
- Textos de interfaz y comentarios: en español.
- Los comentarios explican POR QUÉ, no QUÉ. Si el comentario repite lo que dice
  el código, sobra.
- Commits: Conventional Commits en español (`feat:`, `fix:`, `docs:`, `test:`,
  `refactor:`, `chore:`).

## 9. Flujo de trabajo con el agente

1. Una funcionalidad por sesión. Prohibido generar toda la app en un solo
   prompt.
2. Antes de usar una librería, consultar su documentación actual. Las APIs de
   Expo cambian entre versiones mayores y la memoria del modelo se desactualiza.
3. Después de cada funcionalidad, el agente explica en español qué generó,
   archivo por archivo, antes del commit.
4. Verificación obligatoria antes de commitear: `npm run typecheck`,
   `npm test` y `npx expo export --platform android` (este último detecta
   errores de importación que el typecheck no ve).
5. El equipo prueba en Expo Go en un teléfono real. El agente NO puede validar
   cámara ni GPS; debe decirlo explícitamente en vez de darlo por hecho.
6. Si el agente propone una librería nueva, debe justificarla y esperar
   aprobación.

## 10. Qué NO versionar

- `node_modules/`, `coverage/`, `.expo/`
- `docs-evaluacion/` y cualquier `*.pdf` — enunciado, rúbrica y entregables.
- `docs/*.docx` — se generan desde `docs/informe-evu2.fodt`.
