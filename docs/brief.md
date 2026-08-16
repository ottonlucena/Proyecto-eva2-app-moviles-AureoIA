# Brief — Áureo

> Nuestra lectura del problema, escrita con nuestras palabras: a quién le sirve esta app,
> qué vamos a construir y por qué.

## 1. El usuario

Alguien que acaba de descubrir el trading de oro y quiere aprender a operarlo. No tiene
experiencia, no quiere perder dinero mientras aprende, y las plataformas reales le resultan
intimidantes: están llenas de gráficos, indicadores y botones que no entiende, y cualquier
error cuesta plata de verdad.

## 2. El problema real

Aprender a operar tiene un problema de fondo que no es la falta de información —hay tutoriales
de sobra— sino la **falta de un registro honesto de las propias decisiones**:

1. **Se opera sin dejar rastro.** El principiante entra y sale de operaciones sin anotar por
   qué lo hizo. Al mes no puede distinguir si le fue bien por criterio o por suerte.
2. **La memoria miente.** Sin registro, uno recuerda los aciertos y olvida los errores. Eso
   refuerza hábitos malos en lugar de corregirlos.
3. **El contexto se pierde.** Dos semanas después, "compré oro a 4.300" no dice nada. Lo que
   importaba era qué se veía en el gráfico y qué estaba pensando en ese momento.
4. **Practicar con dinero real es caro.** Y practicar sin ningún registro no enseña nada,
   aunque sea gratis.

El costo de fondo no es "no tener una app de trading". Es **repetir los mismos errores sin
darse cuenta**, porque no queda evidencia de las decisiones tomadas.

## 3. Qué construimos

Una aplicación móvil que funciona como diario de operaciones simuladas. El usuario:

- Registra una operación de compra o venta de oro con el precio de entrada, el tamaño de la
  posición y sus notas.
- **Adjunta una foto del gráfico** que motivó la decisión, tomada con la cámara del teléfono.
- **Queda registrado dónde estaba** cuando la anotó, mediante el GPS del dispositivo.
- Consulta el **precio real del oro** en el momento de registrar, traído de una API externa.
- Cierra la operación con su precio de salida y ve el resultado en dólares.
- Revisa su resultado acumulado y cuántas operaciones tiene abiertas.

La foto y las coordenadas no son un adorno técnico: son precisamente el contexto que se
pierde. Una operación con la captura del gráfico y el lugar donde se tomó la decisión es
información que un principiante realmente querría releer un mes después.

## 4. Qué NO estamos resolviendo

Delimitar esto es parte del trabajo. Quedan fuera:

- Operar con dinero real o conectarse a un bróker.
- Ejecución automática de órdenes, stop loss o take profit.
- Gráficos de velas dentro de la app: para eso está la foto del gráfico real.
- Micro-lecciones de trading, que estaban en la visión original de la Unidad 1.
- Cuentas de usuario reales con verificación en un servidor.
- Respaldo del diario en la nube. Ver `architecture.md`, deuda técnica.
- Notificaciones de precio o alertas.

## 5. Restricciones que vienen dadas

- La app debe **usar periféricos del dispositivo**: cámara y GPS como mínimo.
- Debe **integrarse con servicios web y APIs** para obtener y gestionar datos externos.
- Debe **permitir múltiples usuarios** en el mismo dispositivo.
- Debe **funcionar sin conexión**, con almacenamiento local.
- Debe incluir **pruebas automatizadas** que verifiquen los periféricos y la integración.
- El código y su documentación pesan tanto como la funcionalidad: otra persona debe poder
  tomar este proyecto, entenderlo y continuarlo.

## 6. Criterio de éxito

El proyecto está bien hecho si el usuario puede registrar una operación completa —con su
foto, sus coordenadas y el precio real de mercado— en menos de un minuto desde el teléfono,
si puede consultarla después aunque esté sin señal, y si otra persona puede usar el mismo
teléfono sin ver ni tocar sus operaciones.

---

Siguiente documento: [`mvp.md`](./mvp.md) — qué recorte de esto construimos realmente.
