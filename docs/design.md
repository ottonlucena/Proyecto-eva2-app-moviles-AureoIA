# Identidad visual — Áureo

## 1. Posicionamiento

**Terminal de trading, no juego.**

La app la usa alguien que está aprendiendo algo que en la vida real cuesta dinero. Si se ve
como un juego, el usuario la trata como un juego y no aprende nada. La estética tiene que
transmitir que esto es una herramienta profesional, aunque las operaciones sean simuladas.

Eso descarta de entrada: colores pastel, ilustraciones amables, emojis en la interfaz,
animaciones celebratorias, medallas o puntajes.

## 2. Referencias

Terminales de trading reales —Bloomberg, TradingView en tema oscuro, MetaTrader—: fondo casi
negro, datos densos, color usado como información y no como decoración.

De ahí sale la regla más importante de la paleta.

## 3. Paleta

Definida en `src/theme/colors.ts`. **Ningún color hexadecimal puede escribirse fuera de ese
archivo** (regla 1 de `AGENTS.md`).

| Token | Valor | Uso |
|---|---|---|
| `primario` | `#E8B04B` | Oro. Acción principal, marca, precios destacados |
| `primarioTenue` | `#B8863B` | Oro apagado. Bordes y estado presionado |
| `secundario` | `#3B82F6` | Azul. Información secundaria, coordenadas |
| `fondo` | `#0B0E11` | Casi negro. Fondo de la app |
| `superficie` | `#151A21` | Tarjetas y campos |
| `superficieAlta` | `#1E252E` | Elementos elevados |
| `borde` | `#2A323C` | Bordes sutiles |
| `texto` | `#F5F3EE` | Crema. Texto principal |
| `textoTenue` | `#9AA4B2` | Gris azulado. Texto secundario |
| `alcista` | `#16C784` | Verde vela |
| `bajista` | `#EA3943` | Rojo vela |

### La regla del verde y el rojo

**Verde y rojo se usan exclusivamente para representar dirección de mercado o resultado.
Nunca como decoración.**

Es la regla que más define la identidad. En la app significan:

- Verde: operación de **compra**, resultado **positivo**.
- Rojo: operación de **venta**, resultado **negativo**, y acciones destructivas
  (eliminar, quitar foto).

Un botón «Guardar» **no** es verde. Un mensaje de éxito genérico **no** es verde. Si el color
significa siempre lo mismo, el usuario aprende a leer la pantalla de un vistazo; si se usa
para adornar, deja de significar nada.

El oro es el color de la marca y de la acción principal. El azul se reserva para información
que no es ni alcista ni bajista, como las coordenadas de una operación.

## 4. Tipografía

Fuente del sistema. No se cargan fuentes externas: agregan peso al bundle y tiempo de carga
para un beneficio que en una interfaz de datos es marginal.

La jerarquía sale de la escala `fontSize` en `src/theme/spacing.ts`:

| Token | Tamaño | Uso |
|---|---|---|
| `xs` | 12 | Metadatos, fechas, coordenadas, epígrafes |
| `sm` | 14 | Texto secundario, etiquetas de campo |
| `md` | 16 | Texto principal, botones |
| `lg` | 22 | Títulos de pantalla, cifras del resumen |
| `xl` | 30 | Destacados |
| `xxl` | 40 | Marca en la bienvenida |

Los números que representan dinero van siempre en **peso 600 o 700**: son el dato que el
usuario busca al abrir la pantalla.

## 5. Espaciado y forma

Todo sale de `src/theme/spacing.ts`. **Ningún número mágico en los estilos** (regla 2).

- **Espaciado:** escala de 4 → `xs 4`, `sm 8`, `md 16`, `lg 24`, `xl 32`, `xxl 48`.
- **Radios:** `sm 8` en campos, `md 12` en tarjetas, `lg 20` en contenedores,
  `full 999` en píldoras de estado.
- **Bordes:** `thin 1` para separaciones, `thick 2` para foco y selección.
- **Opacidad:** `disabled 0.5`, `pressed 0.8`.

Cuando un valor no existía en la escala —`opacity`, `borderWidth`, `letterSpacing`— se agregó
al theme en lugar de escribirlo suelto. Fue una corrección concreta que salió de una
auditoría contra `AGENTS.md` en la Unidad 1.

## 6. Formato de los datos

Definido en `src/utils/formato.ts`, implementado a mano en lugar de usar `Intl` porque el
soporte de internacionalización varía entre el motor de JavaScript del dispositivo y el del
entorno de pruebas, y el diario debe mostrar siempre lo mismo.

| Dato | Formato | Ejemplo |
|---|---|---|
| Precio | Punto de miles, coma decimal, dos decimales | `US$ 4.377,60` |
| Resultado | Con signo explícito | `+US$ 5.000,00` |
| Lotes | Singular y plural correctos | `1 lote` / `0,50 lotes` |
| Fecha | Día, mes abreviado, año, hora | `16 ago 2026 · 22:30` |
| Coordenadas | Grados con hemisferio | `33.4489° S, 70.6693° O` |

El **signo `+` explícito** en las ganancias es deliberado: permite distinguir de un vistazo
una operación ganadora de una perdedora sin leer el número ni depender solo del color, lo
que además ayuda a quien no distingue bien verde de rojo.

## 7. Cómo se ve cada pantalla

**Bienvenida** — marca centrada sobre fondo negro, el logo de vela japonesa y una única
llamada a la acción. Nada más.

**Login** — dos campos y un botón. Los errores aparecen bajo el campo, en rojo, y el borde
del campo se engrosa. El campo **sigue siendo editable** con el error visible, para que el
usuario pueda corregirlo.

**Diario** — tres bloques verticales:
1. Resumen: operaciones abiertas y resultado acumulado, separados por una línea.
2. Cotización en vivo, con botón de actualizar.
3. Lista de tarjetas. Cada una lleva la insignia COMPRA/VENTA con su color, el precio, la
   miniatura de la foto si existe, las notas, las coordenadas en azul, la píldora de estado
   y el resultado en verde o rojo.

Con el diario vacío se muestra un mensaje que invita a registrar la primera operación, no una
pantalla en blanco.

**Formulario** — de arriba abajo: cotización con botón «Usar», selector compra/venta en
verde y rojo, campos numéricos con teclado decimal, notas multilínea, foto y ubicación.

**Respaldo en la nube** — tarjeta de estado, dos botones para las dos direcciones, y la
advertencia de que el servicio es público.

## 8. Tono de los textos

Español rioplatense-chileno neutro, tuteo con voseo suave (`registrá`, `dejalo vacío`).
Directo, sin tecnicismos y sin infantilizar.

| En vez de | Escribimos |
|---|---|
| «Error 404» | «El respaldo ya no existe en el servidor.» |
| «Network request failed» | «No hay conexión a internet.» |
| «Timeout exceeded» | «No pudimos fijar tu posición. Probá al aire libre.» |
| «Permission denied» | «Necesitamos la cámara para adjuntar una foto a la operación.» |

Cada mensaje de error dice **qué pasó** y, cuando existe, **qué puede hacer** el usuario.
Ninguno expone jerga técnica ni códigos de estado.

## 9. Imágenes

La app **no usa assets de imagen propios** más allá del ícono y el splash. El logo es una
vela japonesa construida enteramente con `View`, sin archivos externos: refuerza la temática,
escala sin perder nitidez y no pesa en el bundle.

Las únicas imágenes que se muestran son las que toma el usuario, y siempre con
`resizeMode="cover"` sobre proporción cuadrada, para que la lista se vea pareja.

---

Siguiente documento: [`testing.md`](./testing.md) — cómo se verifica todo esto.
