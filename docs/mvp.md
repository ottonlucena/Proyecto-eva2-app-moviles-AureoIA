# MVP — Áureo

> Qué construimos en esta entrega, qué dejamos fuera y cuál fue la decisión que simplificó
> todo lo demás.

## 1. Alcance del MVP

### Historias de usuario

| # | Como usuario quiero… | Para… |
|---|---|---|
| H1 | Registrar una operación de compra o venta con su precio y tamaño | Dejar constancia de lo que decidí |
| H2 | Escribir notas sobre por qué entré | Poder releer mi razonamiento después |
| H3 | Adjuntar una foto del gráfico con la cámara | Recuperar el contexto visual de la decisión |
| H4 | Que quede registrado dónde estaba | Reconocer patrones de dónde tomo mis peores decisiones |
| H5 | Ver el precio real del oro al registrar | Anotar la operación al valor de mercado sin buscarlo aparte |
| H6 | Cerrar una operación con su precio de salida | Saber cuánto gané o perdí |
| H7 | Ver mi resultado acumulado y cuántas tengo abiertas | Entender cómo voy en conjunto |
| H8 | Editar o eliminar una operación | Corregir un error de tipeo sin rehacer todo |
| H9 | Usar la app sin conexión | Registrar una operación en el metro o en un avión |
| H10 | Que mi diario sea solo mío en un teléfono compartido | Prestar el teléfono sin que otro vea ni edite mis operaciones |

### Pantallas

1. **Bienvenida** — presentación de marca (heredada de la Unidad 1).
2. **Login** — formulario con validación (heredado de la Unidad 1).
3. **Diario** — lista de operaciones, resumen y cotización en vivo.
4. **Formulario de operación** — alta y edición, con cámara y GPS.

## 2. Fuera del MVP (y por qué)

| Se dejó fuera | Por qué |
|---|---|
| Micro-lecciones de trading | Es contenido educativo, no ejercita ninguna competencia de la unidad. Costaría mucho tiempo y no suma a la evaluación. |
| Saldo ficticio y gestión de capital | Obliga a modelar depósitos, retiros y margen. El resultado por operación ya demuestra el cálculo sin esa complejidad. |
| Gráfico de velas dentro de la app | Requiere datos históricos y una librería de gráficos pesada. La foto del gráfico real cubre la necesidad y además justifica el uso de la cámara. |
| Autenticación real contra un servidor | La rúbrica de esta unidad no la evalúa. El esfuerzo se dirigió a periféricos, APIs y pruebas. |
| Respaldo del diario en la nube | Se implementó y se retiró: ningún servicio de almacenamiento JSON anónimo resultó viable. Ver [`architecture.md`](./architecture.md). |

## 3. La decisión que simplifica todo: el diario es la lista

El enunciado de la evaluación plantea una lista de tareas pendientes. En vez de agregar una
lista de tareas ajena al concepto de la app, **reinterpretamos el diario de operaciones como
esa lista**. La estructura de datos es idéntica —una colección de registros que se crean,
editan, eliminan y cambian de estado— pero el dominio es el que la app ya tenía.

Esta decisión resolvió tres problemas de golpe:

1. **Los periféricos dejan de ser un agregado artificial.** Una tarea pendiente con foto y
   coordenadas es un ejercicio escolar; una operación con la captura del gráfico y el lugar
   donde se decidió es información con sentido.
2. **La API se vuelve obvia.** El precio del oro es el dato externo que la app necesita de
   verdad. No hubo que inventar una excusa para consumir un servicio web.
3. **Hay continuidad con la Unidad 1.** El enunciado pide ampliar el proyecto anterior, no
   empezar otro.

La equivalencia con lo pedido:

| Enunciado | Áureo |
|---|---|
| Tarea | Operación |
| Tarea completada / pendiente | Operación cerrada / abierta |
| Imagen adjunta a la tarea | Foto del gráfico |
| Ubicación donde se crea la tarea | Coordenadas al registrar |
| Obtener datos de una API externa | Cotización real del oro |

## 4. Definición de "terminado"

Una funcionalidad está terminada cuando:

- Compila con `npm run typecheck` sin errores y sin ningún `any`.
- Tiene pruebas en `__tests__/` que cubren el camino feliz **y los de fallo**.
- `npm test` pasa completo.
- `npx expo export --platform android` genera el bundle sin errores.
- Respeta las reglas de [`../AGENTS.md`](../AGENTS.md): sin colores sueltos, sin números
  mágicos, props tipadas, sin botones muertos.
- Está commiteada con un mensaje en español que explica **por qué**, no solo qué.

---

Siguiente documento: [`domain.md`](./domain.md) — cómo se modela una operación.
