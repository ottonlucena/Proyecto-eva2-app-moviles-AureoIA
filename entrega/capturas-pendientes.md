# Capturas

## Estado actual

**6 de 16 ya están insertadas en el informe.** Se incrustaron directamente en
`informe-evu2.fodt`, así que se regeneran solas al reconstruir el `.docx` y el `.pdf`.

| Figura | Estado | Origen |
|---|---|---|
| 1 · pruebas en verde | ⬜ falta | — |
| 2 · bienvenida | ⬜ falta | — |
| 3 · login con validación | ✅ insertada | IMG_0003 |
| 4 · diario vacío | ⬜ falta | — |
| 5 · diario con operaciones | ⚠️ insertada, **conviene rehacerla** | IMG_0010 |
| 6 · formulario | ✅ insertada | IMG_0005 |
| 7 · permiso de cámara | ⬜ falta | — |
| 8 · cámara abierta | ⬜ falta | — |
| 9 · foto adjunta | ⬜ falta | — |
| 10 · permiso de ubicación | ⬜ falta | — |
| 11 · coordenadas capturadas | ⬜ falta | — |
| 12 · permiso denegado | ⬜ falta | — |
| 13 · usuario uno | ✅ insertada | IMG_0012 |
| 14 · usuario dos | ✅ insertada | IMG_0013 |
| 15 · usuario uno vuelve | ⬜ falta | — |
| 16 · sin conexión | ⚠️ insertada, **conviene rehacerla** | IMG_0011 |

> **Por qué rehacer la 5 y la 16.** Se tomaron con la versión anterior de la app: en el
> encabezado se ve el botón **«Nube»** y el título «Mi diario», que ya no existen. La figura
> 13 muestra el encabezado actual, con el correo y el botón «Salir». Un corrector atento
> puede notar la diferencia entre una figura y otra. Rehacerlas toma dos minutos.

> **IMG_0009 no se usó**: es la pantalla de respaldo en la nube, que se retiró del proyecto.
> **IMG_0004, IMG_0006 e IMG_0008** quedaron fuera por ser versiones anteriores o parciales
> de tomas que ya están cubiertas.

## Cómo agregar las que faltan

Guardá cada imagen como `entrega/capturas/figNN.jpg` (por ejemplo `fig07.jpg`) y avisame:
el script las incrusta y regenera los documentos. O pegalas a mano sobre el recuadro azul
correspondiente en el `.docx`.

---

## Guía de cada toma

## Antes de empezar

Dejá la app con datos realistas:

```bash
npm start
```

Abrí Expo Go en el teléfono y creá **cuatro o cinco operaciones** con nombres y notas de
verdad —nada de «test» ni «aaa»—. Que haya:

- Al menos una **compra cerrada con ganancia** (verde) y una **venta cerrada con pérdida**
  (roja), para que se vea que el cálculo distingue el sentido.
- Al menos dos **abiertas**, para que el contador del resumen no diga 1.
- Al menos dos **con foto y coordenadas**, y una sin nada, para que se note que son opcionales.

También vas a necesitar un **segundo correo** para las figuras 13 a 15. Cualquiera sirve
—no se verifica contra nada—, pero que sea creíble: `valeria@aureo.app`, por ejemplo.

> **En emulador:** el GPS no entrega coordenadas hasta que lo habilites. Controles extendidos
> → *Location* → activar la señal, fijar un punto en el mapa y **Save Point**. Si el perfil
> del dispositivo virtual no tiene cámara, usá el botón *Galería*.

Para las capturas de pantalla del teléfono conviene el modo oscuro del sistema, que es como
está pensada la app.

---

## Pruebas

### Figura 1 — `01-tests.png`
- **Dónde:** la terminal, en la raíz del proyecto.
- **Cómo llegar:** `npm test`
- **Qué debe verse:** las **13 suites** y las **186 pruebas** en verde, con el tiempo total.
  Que entre el bloque completo `Test Suites / Tests / Snapshots / Time`.

---

## Acceso y diario

### Figura 2 — `02-bienvenida.png`
- **Dónde:** pantalla inicial de la app.
- **Qué debe verse:** el logo de la vela japonesa, el nombre Áureo, el eslogan y el botón.

### Figura 3 — `03-login-validacion.png`
- **Cómo llegar:** entrá al login, dejá **la contraseña vacía**, escribí el correo y pulsá
  «Ingresar».
- **Qué debe verse:** el error rojo bajo el campo vacío **y el correo que escribiste todavía
  ahí**. Eso es lo importante de la toma: que no se perdió lo tipeado y que el campo sigue
  editable.

### Figura 4 — `04-diario-vacio.png`
- **Cómo llegar:** primera vez que entrás, con el diario sin operaciones.
- **Qué debe verse:** el mensaje «Tu diario está en blanco» y, arriba, **el banner con el
  precio real del oro ya cargado**. Que se lea la cifra: eso demuestra que la API respondió.
- **Si ya tenés operaciones:** desinstalá y reinstalá Expo Go, o borrá los datos de la app.

### Figura 5 — `05-diario-con-operaciones.png`
- **Qué debe verse:** el resumen arriba con **operaciones abiertas** y **resultado acumulado**
  (que se note el color según sea positivo o negativo), y abajo la lista con al menos tres
  tarjetas: sus insignias COMPRA/VENTA en verde y rojo, las miniaturas de las fotos, las
  coordenadas en azul y los resultados.
- **Es la captura más importante del informe.** Que entren varias tarjetas completas.

---

## Registro con periféricos

### Figura 6 — `06-formulario.png`
- **Cómo llegar:** «Registrar operación», sin llenar nada.
- **Qué debe verse:** el banner de cotización con el botón «Usar», el selector compra/venta y
  los campos vacíos. Desplazá lo justo para que entre desde el banner hasta el campo de lotes.

### Figura 7 — `07-permiso-camara.png`
- **Cómo llegar:** pulsá «Tomar foto» **la primera vez** (si ya diste el permiso, borrá los
  datos de la app o revocalo en los ajustes del sistema).
- **Qué debe verse:** el diálogo del sistema **con el texto que escribimos**: «Áureo usa la
  cámara para que adjuntes una foto del gráfico…». Que se lea el mensaje, no solo el diálogo.

### Figura 8 — `08-camara.png`
- **Qué debe verse:** el visor de la cámara abierto, a punto de disparar.

### Figura 9 — `09-foto-adjunta.png`
- **Cómo llegar:** tomá la foto y confirmá.
- **Qué debe verse:** la vista previa cuadrada dentro del formulario, con «Quitar» y «Volver
  a tomar».

### Figura 10 — `10-permiso-ubicacion.png`
- **Cómo llegar:** pulsá «Capturar» en la sección de ubicación, la primera vez.
- **Qué debe verse:** el diálogo del sistema. **Importante:** que se vean las opciones de
  «mientras usás la app» / «solo esta vez» y que **no aparezca** ninguna opción de permitir
  siempre en segundo plano —eso demuestra que pedimos el permiso mínimo—.

### Figura 11 — `11-coordenadas.png`
- **Qué debe verse:** las coordenadas ya capturadas, en formato `33.4489° S, 70.6693° O`,
  con el botón «Actualizar» al lado.

---

## Permisos denegados

### Figura 12 — `12-permiso-denegado.png`
- **Cómo llegar:** andá a los ajustes del sistema, revocá el permiso de cámara de Expo Go y
  marcá «no volver a preguntar» (en Android, denegarlo dos veces). Volvé a la app y pulsá
  «Tomar foto».
- **Qué debe verse:** **nuestra** alerta con los botones **«Ahora no»** y **«Abrir ajustes»**.
- **Por qué importa:** es la evidencia de que la app no deja al usuario bloqueado cuando el
  sistema ya no vuelve a preguntar. Vale puntos en el indicador de permisos.

---

## Múltiples usuarios

> Estas tres son **consecutivas**: mostrá el mismo teléfono con dos cuentas distintas.
> Es la evidencia del «permitir múltiples usuarios» del enunciado.

### Figura 13 — `13-usuario-uno.png`
- **Cómo llegar:** estás dentro con tu correo habitual, con operaciones cargadas.
- **Qué debe verse:** el diario con sus operaciones **y el correo en el encabezado**. Que se
  lea con qué cuenta se ingresó, porque es lo que da sentido a las dos capturas siguientes.

### Figura 14 — `14-usuario-dos.png`
- **Cómo llegar:** botón **«Salir»** arriba a la derecha → confirmar → entrá con un correo
  distinto, por ejemplo `valeria@aureo.app`, con cualquier contraseña.
- **Qué debe verse:** el diario **en blanco**, con el segundo correo en el encabezado. Que se
  note que no aparece ninguna operación de la primera cuenta.

### Figura 15 — `15-usuario-uno-vuelve.png`
- **Cómo llegar:** «Salir» otra vez y volvé a entrar con el **primer** correo.
- **Qué debe verse:** las operaciones originales, intactas. Demuestra que no se borraron: cada
  diario queda guardado por separado.

---

## Sin conexión

### Figura 16 — `16-sin-conexion.png`
- **Cómo llegar:** activá el **modo avión** y abrí el diario.
- **Qué debe verse:** la lista de operaciones **intacta y usable**, y en el banner de
  cotización el mensaje «No hay conexión a internet».
- **Por qué importa:** demuestra que el almacenamiento local funciona y que la app degrada sin
  romperse. Es la evidencia del requisito de trabajar sin conexión.

---

## Al terminar

1. Abrí `EVU2_LUCENA-OTTON-VALERIA-GOMEZ.docx`.
2. Pegá cada imagen **sobre su recuadro azul** y borrá el texto del marcador.
3. Reemplazá los otros dos marcadores de la portada: **el logo institucional** y **el enlace
   al video de YouTube**.
4. Exportá a PDF desde el mismo Word, para que la tipografía salga en Arial.
5. Revisá que la numeración de páginas siga corriendo después de insertar las imágenes.
