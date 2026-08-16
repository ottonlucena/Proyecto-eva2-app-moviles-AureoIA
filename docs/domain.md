# Modelo de dominio — Áureo

> Qué es una operación, en qué estados vive y qué reglas la gobiernan.
> Todo lo de este documento está implementado en `src/types/operacion.ts`,
> `src/domain/diario.ts` y `src/domain/validacion.ts`.

## 1. La entidad: Operación

Una operación es un registro de compra o venta simulada de oro. Es la única entidad del
sistema; el «diario» es simplemente la colección de operaciones de un usuario.

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `string` | Sí | Identificador único. Se genera en el dispositivo. |
| `tipo` | `'compra' \| 'venta'` | Sí | Sentido de la operación. |
| `precioEntrada` | `number` | Sí | Precio del oro al entrar, en dólares por onza. |
| `precioSalida` | `number` | No | Precio al cerrar. Ausente mientras siga abierta. |
| `lotes` | `number` | Sí | Tamaño de la posición. Admite fracciones. |
| `notas` | `string` | Sí | Puede estar vacío, pero el campo siempre existe. |
| `estado` | `'abierta' \| 'cerrada'` | Sí | Lo administra la app, no el usuario. |
| `fechaCreacion` | `string` | Sí | ISO 8601. Se fija al crear y nunca cambia. |
| `fotoUri` | `string` | No | Ruta local de la foto tomada con la cámara. |
| `ubicacion` | `{ latitud, longitud }` | No | Coordenadas obtenidas del GPS. |

### Por qué `fotoUri` y `ubicacion` son opcionales

No es una concesión: es una decisión de diseño. El usuario puede negar el permiso de cámara
o de ubicación, y la app **debe seguir siendo utilizable**. Una operación sin foto y sin
coordenadas es perfectamente válida.

Además, ambos campos se declararon en el modelo **antes** de implementar los periféricos.
Eso evitó tener que migrar las operaciones ya guardadas en el dispositivo cuando llegaron
la cámara y el GPS.

## 2. Reglas de negocio

| # | Regla | Dónde vive |
|---|---|---|
| **R1** | Una operación nace siempre **abierta**. El usuario no elige el estado inicial. | `crearOperacion` |
| **R2** | El precio de entrada y los lotes deben ser **mayores que cero**. | Validación del formulario |
| **R3** | La fecha de creación se fija al crear y **no cambia nunca**, ni al editar. | `actualizarOperacion` |
| **R4** | Al **cerrar** sin indicar precio de salida, se usa el de entrada: resultado neutro. | `alternarEstado` |
| **R5** | Al **reabrir**, el precio de salida se **descarta**. Conservarlo daría un resultado calculado sobre un cierre que ya no existe. | `alternarEstado` |
| **R6** | Una operación abierta **no tiene resultado**, ni siquiera cero. Devuelve `undefined`. | `calcularResultado` |
| **R7** | En una **compra** se gana si el precio sube; en una **venta**, si baja. | `calcularResultado` |
| **R8** | Un lote equivale a **100 onzas troy**. | `ONZAS_POR_LOTE` |
| **R9** | El resultado acumulado **ignora las operaciones abiertas**. Solo suma las cerradas. | `calcularResultadoTotal` |

## 3. Cómo se calcula el resultado

```
resultado = diferencia × lotes × 100

donde diferencia = precioSalida − precioEntrada   (si es compra)
                 = precioEntrada − precioSalida   (si es venta)
```

El signo invertido en la venta es la parte que más se presta a error, y por eso las pruebas
cubren las **cuatro** combinaciones posibles:

| Tipo | Entrada | Salida | Lotes | Resultado |
|---|---|---|---|---|
| Compra | 2.000 | 2.050 | 1 | **+US$ 5.000** |
| Compra | 2.000 | 1.950 | 1 | **−US$ 5.000** |
| Venta | 2.000 | 1.950 | 1 | **+US$ 5.000** |
| Venta | 2.000 | 2.050 | 1 | **−US$ 5.000** |

## 4. Ciclo de vida

```
                 crear
                   │
                   ▼
             ┌───────────┐   alternar (+ precio salida)   ┌───────────┐
             │  ABIERTA  │ ──────────────────────────────▶│  CERRADA  │
             │           │◀────────────────────────────── │           │
             └───────────┘   alternar (descarta salida)   └───────────┘
                   │                                            │
                   └──────────────── eliminar ──────────────────┘
```

Editar es posible en cualquier estado y no lo altera.

## 5. La frontera de confianza

El sistema tiene **dos fronteras por las que entran datos que no controlamos**:

1. Lo que se lee del **almacenamiento del dispositivo**, que pudo escribirlo una versión
   anterior de la app o pudo corromperse.
2. Lo que llega de una **API externa**, que puede cambiar su contrato sin avisar.

Ambas usan el mismo guardián, `esOperacionValida` en `src/domain/validacion.ts`,
y por eso vive en el dominio y no en la capa de almacenamiento.

La regla que aplica es: **descartar lo inválido, conservar lo válido**. Perder un registro
dañado es preferible a dejar al usuario sin su diario entero.

```ts
filtrarOperacionesValidas([operacionBuena, { hackeado: true }, null, 'texto'])
// → [operacionBuena]
```

## 6. Convención de nombres

- El dominio habla **en español**: `crearOperacion`, `alternarEstado`, `calcularResultado`.
- Los campos del modelo también: `precioEntrada`, no `entryPrice`.
- La traducción de los nombres de las APIs externas ocurre en la capa `api/`: la respuesta
  trae `price` y `latitude`, y sale de ahí como `precio` y `latitud`. El dominio nunca ve
  vocabulario ajeno.

---

Siguiente documento: [`stack.md`](./stack.md) — con qué está construido y por qué.
