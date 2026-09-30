# Manual de usuario — LabQR

> Se escribe a la par de cada fase. Versión 0.6.0 (fases 1 a 5). Faltan capturas del celular.

## Pantallas

La barra inferior tiene cuatro pestañas: **Inicio**, **Escanear**, **Artículos** y **Vales**. El botón ☰ de arriba abre **Ajustes**, **Etiquetas**, **Respaldo** y el **Tablero de exposición**.

## Primeros pasos

1. Abre **☰ → Ajustes**.
2. Para probar, toca **Cargar datos de demostración**. Para usarla de verdad, agrega tus laboratorios con su prefijo de 2 a 5 letras (por ejemplo, Química = QUI) y sus ubicaciones (anaqueles, gavetas, gabinetes).
3. Ve a **Artículos → + Agregar artículo**.

## Agregar un artículo

1. Escribe el nombre y elige el tipo:
   - **Equipo:** pieza única, con número de serie (microscopio, balanza).
   - **Material:** piezas que se prestan y pueden romperse (vasos, pinzas).
   - **Reactivo:** se gasta; lleva unidad (ml, g, l, kg) y fecha de caducidad.
2. Elige laboratorio y ubicación.
3. Escribe la cantidad que hay hoy y el mínimo. Si la existencia baja del mínimo, el artículo se marca en rojo.
4. Toca **Guardar**. La app asigna el código (QUI-0001, QUI-0002…), que no cambia porque va impreso en la etiqueta.

## Buscar

En **Artículos** escribe parte del nombre, el código, el número de serie o cualquier especificación (por ejemplo, "96 %"). No importan mayúsculas ni acentos. Los botones de abajo filtran por tipo, **Bajo mínimo** y **Por caducar**.

## Ficha del artículo

- **La probeta** muestra cuánto hay en el laboratorio. La parte punteada es lo prestado y la línea roja es el mínimo.
- **Especificaciones:** agrega los datos que pida cada maestro (marca, modelo, concentración, voltaje…) con **Agregar dato**.
- **Historial:** cada recepción, préstamo, devolución, consumo, merma y ajuste, con fecha y responsable. No se puede borrar ni editar; los errores se corrigen con un movimiento nuevo.
- **Archivar:** quita de la lista un artículo que ya no se usa, sin perder su historial.

## Borrar todo

En **Ajustes → Borrar todo**, escribe BORRAR y confirma. Elimina todos los datos del dispositivo. Haz un respaldo antes (☰ → Respaldo).

## Etiquetas QR

1. **☰ → Etiquetas.** Filtra por laboratorio o ubicación, marca los artículos o toca **Todos los de esta vista**.
2. Elige el tamaño: **Grande** (10 por hoja) o **Chica** (24 por hoja).
3. Toca **Imprimir**. En la ventana de impresión elige hoja carta y escala 100 %.
4. Recorta y pega cada etiqueta en su artículo o en su lugar del anaquel.

Desde la ficha de un artículo, **Imprimir etiqueta** abre la hoja con ese artículo ya marcado.

**Cualquier celular** que escanee la etiqueta con su cámara normal abre la ficha del artículo, sin instalar nada.

## Escanear

Pestaña **Escanear**: apunta a la etiqueta. Al leerla, el celular vibra y abre la ficha. Si la cámara no funciona, escribe el código en el campo de abajo (sirve "qui 7" para QUI-0007).

## Prestar material (vale)

1. Toca **+ Nuevo vale** (en Inicio o en Vales).
2. Elige el **solicitante** o agrégalo ahí mismo (nombre, tipo, grupo). Escribe la **práctica** si quieres.
3. Toca **Escanear artículos** y escanea cada etiqueta: cada lectura suma 1 y se oye un bip. También puedes buscarlos por nombre.
4. Ajusta cantidades con **−** y **+** (en reactivos escribe la cantidad, por ejemplo 25.5).
5. Toca **Confirmar préstamo**. Las probetas bajan y la app muestra cuántos segundos tomó.

La app no deja prestar más de lo que hay en el laboratorio.

## Recibir la devolución

1. Abre el vale en **Vales** (los vencidos aparecen primero, en rojo).
2. En cada renglón toca:
   - **Devuelto:** puedes cambiar la cantidad si regresó solo una parte.
   - **Roto o perdido:** queda como merma a cargo del solicitante.
   - **Consumido:** solo en reactivos.
3. Si todo regresó bien, toca **Todo regresó completo**.

El vale se cierra solo cuando no queda nada pendiente.

## Recepción, merma y ajuste

En la ficha del artículo, en **Registrar movimiento**:
- **Recepción:** llegó material nuevo (compra o donación).
- **Merma:** algo se rompió, se perdió o caducó fuera de un préstamo.
- **Ajuste por conteo:** escribe lo que contaste físicamente; la app registra la diferencia. Pide una nota que explique por qué.

## Respaldo

Los datos viven **solo en este celular**. Haz un respaldo al menos cada semana; Inicio te avisa cuando toca.

- **☰ → Respaldo → Descargar respaldo** (o **Compartir respaldo** para mandarlo por WhatsApp o Drive).
- **Restaurar desde archivo:** reemplaza todo por lo que trae el respaldo. Antes de hacerlo, la app dice qué trae y pide confirmación.
- **Exportar a Excel (CSV):** inventario actual, movimientos y vales. El de vales incluye cuántos segundos tomó cada entrega.
- **Importar inventario inicial:**
  1. Descarga la plantilla, llénala en Excel y guárdala como CSV.
  2. Elígela en la app. Te muestra qué renglones tienen errores antes de importar.

## Tablero de exposición

**☰ → Tablero de exposición**, en una laptop o TV. Muestra las probetas por ubicación, los vales abiertos y los últimos movimientos. Se actualiza solo con lo que se haga en **otra ventana del mismo equipo**.
