# Bitácora de desarrollo — LabQR

Registro verídico de cada fase, para el concurso CNPyPE (fase local: 4 de diciembre de 2026). Cada entrada dice qué se hizo, qué se decidió y por qué, qué problemas hubo y cómo se probó.

---

## F0 — Esqueleto · 29 de septiembre de 2026

### Qué se hizo
- Proyecto con Vite y JavaScript sin framework, instalable como PWA (manifest + service worker) y con base de datos local IndexedDB por medio de Dexie.
- Esquema de datos completo de `SPEC.md` §4 declarado desde el inicio (laboratorios, ubicaciones, artículos, solicitantes, vales, movimientos, ajustes). La existencia no se guarda: se calculará a partir de los movimientos.
- Navegación con rutas `#/...` (router por hash) y barra inferior de 4 pestañas: Inicio, Escanear, Artículos y Vales. El menú lleva a Ajustes, Etiquetas y Respaldo.
- Ruta `#/i/<código>`, que es a donde apuntarán los QR impresos. Acepta el código escrito a mano ("qui 7" → `QUI-0007`).
- Tokens visuales de `DESIGN.md` como variables CSS: colores azulejo, grafito, cobalto, vidrio, ámbar y peligro, más la tipografía Barlow / Barlow Condensed incluida en la app (no se descarga de Google).
- Primer dibujo de la probeta graduada en SVG, que se usa como ilustración de la pantalla vacía.
- Ícono de la app (probeta sobre cobalto) generado con un script propio, sin librerías.
- Versión visible (número y fecha de compilación) en Inicio y Ajustes.
- Despliegue automático a GitHub Pages con GitHub Actions: cada cambio en `main` corre las pruebas, compila y publica.
- Los cuatro documentos de diseño (CLAUDE, SPEC, DESIGN, RESEARCH) se pasaron de PDF a Markdown dentro del repositorio.

### Decisiones y por qué
- **Vite 6.4.3 y Vitest 4.1.11 en lugar de las versiones más nuevas (Vite 8, Vitest 5).** La computadora de desarrollo tiene Node 20.11 y las versiones nuevas piden Node 20.19 o 22.12. Vitest 3 tenía una vulnerabilidad moderada (GHSA-82fw-gwwq-j7x9), así que se subió a 4.1.11, que ya la corrige. GitHub Actions compila con Node 22.
- **Paquetes elegidos** (verificados en npm el 29 sep 2026):
  - `dexie` 4.4.6: IndexedDB.
  - `uqr` 0.1.3: genera QR en SVG, sin dependencias, 79 KB.
  - `barcode-detector` 3.2.2: lectura de QR cuando el celular no tiene `BarcodeDetector`; usa zxing-wasm.
  - `@fontsource/barlow` y `@fontsource/barlow-condensed` 5.3.0: letra autoalojada.
  - `vite-plugin-pwa` 1.3.0: service worker y manifest.
- **Solo se incluyen los pesos de letra que se usan** (400, 500 y 600, más 600 condensada) y solo el alfabeto latino, para que la app pese poco.
- **Versión visible desde el día uno**, porque en proyectos anteriores costó horas descubrir que un celular seguía corriendo una versión vieja guardada en caché.

### Problemas encontrados
- npm 10.2.4 falló al instalar Vitest 4 con el error `Cannot read properties of null (reading 'edgesOut')`. Se resolvió instalando con npm 10.9.4 (`npx npm@10.9.4 install`).
- Al compilar desde Git Bash en Windows, la ruta base `/labqr/` se convertía en `/Program Files/Git/labqr/`. Solo pasa en esa terminal; se evita con `MSYS_NO_PATHCONV=1`. En GitHub Actions no ocurre.
- Error propio: la pantalla principal mostraba "Página no encontrada" porque el código leía `match.screen` en vez de `match.route.screen`. Se corrigió.
- La flecha de regresar aparecía en Inicio porque el estilo del botón anulaba el atributo `hidden`. Se agregó una regla global para `[hidden]`.
- Después de cada compilación nueva, la primera recarga mostraba la versión anterior (la del caché del service worker) y la segunda ya mostraba la nueva. Es el comportamiento esperado de una PWA con actualización automática y conviene tenerlo presente al probar en el celular.

### Cómo se probó
- 6 pruebas automáticas (códigos de artículo y router) con Vitest: todas pasan.
- En el navegador con vista de celular (375×812): se recorrieron Inicio, Menú, Ajustes y `#/i/qui-7` (muestra "No existe un artículo con el código QUI-0007…").
- Prueba offline: se apagó el servidor, se recargó la página y la app abrió completa desde el caché.
- Publicación (30 sep 2026): repositorio público `yeudielcm-sketch/labqr` y sitio en https://yeudielcm-sketch.github.io/labqr/. El primer despliegue automático pasó pruebas, compilación y publicación. En la página en vivo se verificó que el manifest, los 3 íconos y el service worker cargan correctamente.
- QR de la app (`docs/concurso/qr/labqr-app.png`): se decodificó con zxing-wasm y devuelve la URL correcta.
- Avisos de GitHub Actions que no bloquean: algunas acciones todavía usan Node 20 (GitHub las corre en Node 24) y `ubuntu-latest` pasa a Ubuntu 26 desde el 19 de octubre de 2026.
- 30 sep 2026: el autor instaló la app en su Android desde la URL pública y reportó que funciona. F0 se da por cerrada.

---

## F1 — Catálogo y datos de demostración · 30 de septiembre de 2026

### Qué se hizo
- **Artículos:** lista con búsqueda por nombre, código, número de serie, notas y especificaciones, y filtros por laboratorio, ubicación, tipo, "bajo mínimo" y "por caducar". La búsqueda ignora mayúsculas y acentos ("etilico" encuentra "etílico"). Los filtros quedan en la dirección (`#/articulos?bajo=1`), así que Inicio enlaza directo a la lista filtrada.
- **Ficha del artículo** como etiqueta de frasco:
  - Código grande arriba a la derecha y franja de color por tipo (equipo cobalto, material vidrio, reactivo ámbar).
  - Probeta con existencia en laboratorio, lo prestado con contorno punteado, el total y la línea del mínimo en rojo.
  - En equipo, en vez de probeta, se muestra "En su lugar" o "Prestado a…".
  - Especificaciones libres que se agregan y quitan, e historial de movimientos con responsable, vale y motivo.
- **Alta y edición de artículos:**
  - El formulario cambia según el tipo: el equipo no pide cantidad y sí pide número de serie; el reactivo pide caducidad.
  - La cantidad inicial se registra como movimiento de recepción. El código se genera solo y no se puede cambiar.
- **Archivar y eliminar:** un artículo con historial se archiva (regla 6 de CLAUDE.md); uno sin movimientos se puede eliminar, previa confirmación.
- **Ajustes:**
  - Laboratorios con prefijo. El prefijo se bloquea en cuanto hay artículos, porque ya hay etiquetas impresas.
  - Ubicaciones por laboratorio. Solo se pueden eliminar si están vacías.
  - Días de préstamo por defecto.
  - "Cargar datos de demostración" y "Borrar todo" (hay que escribir BORRAR y después confirmar).
- **Inicio:** selector de laboratorio, probeta general, total de artículos y tarjetas de "bajo mínimo", "por caducar" y "caducados" que llevan a la lista filtrada.
- **Datos de demostración (inventario de prueba para enseñar a los laboratoristas):**
  - Química (21 artículos) y Biología (12 artículos): 7 ubicaciones en total.
  - Equipo: balanza analítica, parrilla, potenciómetro, 4 microscopios con número de serie y un estereoscópico.
  - Vidriería y material: vasos de precipitado, matraces, probetas, pipetas, buretas, tubos de ensayo, pinzas, mecheros, portaobjetos, cajas de Petri, estuches de disección.
  - Reactivos: NaCl, alcohol etílico, HCl, NaOH, fenolftaleína, sulfato de cobre, agua destilada, azul de metileno, lugol, glicerina.
  - Casos especiales: 1 reactivo bajo mínimo (alcohol), 2 por caducar (HCl y azul de metileno) y 1 caducado (fenolftaleína).
  - 5 solicitantes y 3 vales: uno cerrado (titulación), uno abierto (células de cebolla) y uno vencido con una probeta rota a cargo del Equipo 2.

### Decisiones y por qué
- **Aclaración al SPEC §4:** una merma o un consumo ligados a un vale restan de lo prestado, no de lo que hay en el laboratorio. La fórmula original descontaba dos veces una pieza rota en préstamo. Quedó escrito en `SPEC.md` y probado.
- **`labs` lleva `prefix`:** el SPEC pedía "nombre + prefijo" en Ajustes pero el modelo no tenía el campo. Se agregó al SPEC.
- **La demo es una función pura (`buildDemo`)** separada de la escritura en la base. Así se prueba sin navegador y sin agregar dependencias (se descartó `fake-indexeddb` para no sumar un paquete sin aprobación).
- **La demo solo se carga con la app vacía**, para no mezclar datos de prueba con datos reales.
- **Laboratorios y ubicaciones existentes se guardan al salir del campo**, sin botón "Guardar" en cada renglón. La primera versión tenía un botón por renglón y la pantalla se veía saturada.
- Versión de la app: 0.2.0.

### Problemas encontrados
- Al reescribir `strings.js` se perdió el bloque de textos de Vales; se detectó al revisar y se restauró.
- En Ajustes, los eventos se colgaban del contenedor general y se habrían duplicado en cada recarga de la pantalla. Se cambiaron al contenedor propio de la pantalla.
- `form.name` en un formulario devuelve el nombre del formulario, no el campo; el campo se renombró a `itemName`.

### Cómo se probó
- 25 pruebas automáticas (existencia derivada, alertas, búsqueda y filtros, cantidades con decimales, códigos, router y la demo completa): todas pasan.
- En el navegador con vista de celular (375×812):
  - Se cargó la demo: Inicio mostró 33 artículos, 1 bajo mínimo, 2 por caducar y 1 caducado.
  - Se abrió la ficha de la probeta (QUI-0007): 10 en lab, 1 prestada, 11 en total, con la merma y su responsable en el historial.
  - Se abrió el microscopio 2 (BIO-0002): muestra "Prestado a Equipo 3".
  - Se dio de alta "Ácido acético" y recibió el código QUI-0022. Se le agregó la especificación "Glacial 99.7 %" y la búsqueda "glacial" lo encontró.
  - El filtro "Equipo" devolvió los 8 equipos.
  - "Borrar todo" con BORRAR y confirmación dejó las 7 tablas vacías.
- 30 sep 2026: el autor cargó la demo en su Android y confirmó que se ve bien. F1 se da por cerrada. Pendiente: mostrarlo a un laboratorista.

---

## F2 — Códigos QR, etiquetas y escáner · 30 de septiembre de 2026

### Qué se hizo
- **Generación de QR** en el celular, en SVG, con `uqr`. Cada QR guarda la dirección completa de la ficha (`https://yeudielcm-sketch.github.io/labqr/#/i/QUI-0007`), así que la cámara normal de cualquier celular abre la ficha sin instalar nada.
- **Pantalla Etiquetas** (☰ → Etiquetas):
  - Filtros por laboratorio y ubicación, y botón "Todos los de esta vista" para imprimir una ubicación completa.
  - Dos tamaños en hoja carta: grande (10 por hoja, 4 × 2 in) o chica (24 por hoja, 2.5 × 1.25 in).
  - Cada etiqueta lleva QR, código grande, nombre, laboratorio y ubicación, con la franja de color del tipo, igual que una etiqueta de frasco.
  - La vista previa se ve dentro de la app; al imprimir solo salen las hojas.
- **Botón "Imprimir etiqueta"** en la ficha: abre la hoja con ese artículo ya marcado.
- **Pantalla Escanear:**
  - Cámara trasera con marco de apuntado. Al leer un QR válido: pulso en el marco, vibración y abre la ficha.
  - Si el QR no es de LabQR o el código no existe, lo dice y explica qué hacer.
  - Campo para escribir el código a mano (acepta "bio 2" → BIO-0002).
  - Si no hay permiso o no hay cámara, lo explica y ofrece "Reintentar".
  - La cámara se apaga al salir de la pantalla.
- **Lectura de QR:** usa el lector nativo `BarcodeDetector` de Chrome Android. Si no existe (iPhone, computadoras con Windows), carga `barcode-detector`, basado en zxing-wasm, solo en ese momento.

### Decisiones y por qué
- **El `.wasm` del lector de respaldo va dentro de la app** (1.09 MB, se guarda para uso sin internet) en vez de descargarse de un CDN, que es lo que hace el paquete por omisión. Si no, en un laboratorio sin internet el escáner no funcionaría en celulares sin lector nativo.
- **QR en negro sobre blanco y corrección de errores nivel M:** es lo más confiable al imprimir y con cámaras viejas. El color queda en la franja de la etiqueta, no en el QR.
- **Hoja carta de papel normal** (se recorta), porque no sabemos qué hojas de etiquetas hay en el plantel. El tamaño grande coincide casi con las hojas de etiquetas de 4 × 2 pulgadas.
- Versión 0.3.0. Se trabajó en la rama `dev` para no cambiar la app publicada mientras el autor la enseñaba en las demostraciones.

### Problemas encontrados
- El navegador de pruebas bloquea la cámara, así que el escáner en vivo no se pudo probar aquí. Se probó el lector con una imagen del QR (abajo).

### Cómo se probó
- 27 pruebas automáticas: 2 nuevas para el contenido del QR, que genera la dirección correcta y de vuelta se extrae el código.
- **Lector de respaldo:** en un navegador sin lector nativo se generó el QR de QUI-0007, se dibujó en un canvas y el lector devolvió la dirección correcta. El `.wasm` se cargó desde la propia app, no de internet.
- **Etiquetas:** con la demo, abrir `#/etiquetas?codigos=QUI-0007,BIO-0002,QUI-0016` marcó los 3 y mostró 1 hoja con las 3 etiquetas.
- **Escaner:** sin permiso de cámara mostró el mensaje y la captura manual. "bio 2" abrió la ficha BIO-0002.
- **Pendiente (criterio de "listo" de F2):**
  - Imprimir una hoja real.
  - Escanear la etiqueta con la cámara normal del Android (debe abrir la ficha).
  - Escanearla con la cámara de la app.

---

## F3 — Movimientos y vales · 30 de septiembre de 2026

### Qué se hizo
- **Nuevo vale** (Inicio → "+ Nuevo vale", o la pestaña Vales). Todo ocurre en una sola pantalla, sin ventanas encadenadas:
  1. Solicitante: se elige de la lista o se agrega ahí mismo (nombre, tipo, grupo y matrícula opcional).
  2. Práctica (opcional).
  3. Artículos, de dos formas:
     - "Escanear artículos": escaneo continuo; cada lectura suma 1 con vibración, sonido corto y pulso en el marco.
     - Búsqueda por nombre o código.
  4. Cantidades: el material se ajusta con − / +, los reactivos con decimales y en su unidad, y el equipo siempre es 1.
  5. "Confirmar préstamo" es un solo toque. Si se pide más de lo que hay en el laboratorio, lo marca en rojo y no deja confirmar.
- **Momento orquestado de DESIGN.md:** al confirmar, las probetas de los artículos prestados bajan de nivel (400 ms; sin animación si el celular pide reducir movimiento). Muestra también el tiempo de captura en segundos.
- **Vales:** lista con filtros (abiertos, vencidos, cerrados, todos); los vencidos van primero y en rojo, con "Venció hace N días".
- **Detalle del vale:**
  - Por renglón: "Devuelto" (todo o parcial), "Roto o perdido" (merma a cargo del solicitante, con confirmación) y "Consumido" (solo reactivos).
  - "Todo regresó completo" salda lo pendiente de un toque, con confirmación.
  - El vale se cierra solo cuando no queda nada pendiente.
- **Acciones en la ficha del artículo:**
  - Recepción: cantidad y nota.
  - Merma: cantidad, motivo y nota.
  - Ajuste por conteo: se escribe lo que se contó y la app registra la diferencia. La nota es obligatoria.
  - El equipo solo permite merma (dar de baja).
- **Inicio:** tarjetas de vales abiertos y vencidos, y el botón grande "+ Nuevo vale".

### Decisiones y por qué
- **La fecha de devolución** es el fin del día más los días de préstamo de Ajustes (0 = mismo día, 11:59 p. m.).
- **`createdAt` del vale es el momento en que se abrió la captura y `confirmedAt` el de la entrega** (SPEC §8). La diferencia es la métrica de "tiempo de entrega" para el informe.
- **El borrador del vale sobrevive** si el laboratorista sale a revisar una ficha y regresa; se borra al confirmar o al tocar "Descartar".
- **La validación de existencia se repite dentro de la transacción al confirmar**, no solo en pantalla, para que dos toques rápidos no presten de más.
- **El ajuste guarda la diferencia con signo, no la cantidad contada**, para respetar el ledger: la existencia sigue saliendo de sumar movimientos.
- **Sonido sintetizado con WebAudio** en vez de archivos de audio: pesa 0 KB y funciona sin internet.
- Versión 0.4.0.

### Problemas encontrados
- Los renglones del vale cambiaban de orden entre recargas (los movimientos se leen por su ID al azar). Se ordenaron por código.
- En la confirmación, el equipo aparecía como probeta vacía; DESIGN.md pide para el equipo el indicador de dos estados. Se corrigió.
- "Todo regresó completo" se podía tocar dos veces mientras guardaba. Ahora se desactiva al primer toque.

### Cómo se probó
- 33 pruebas automáticas; 6 nuevas de la lógica del vale: pendientes por renglón, abierto, vencido y cerrado, fecha de devolución, validación de existencia, ajuste con signo y tiempo de entrega.
- **Recorrido completo en el navegador con vista de celular, con la demo:**
  - Nuevo vale para "Equipo 5 · 2° C" con 5 artículos: 3 vasos de 250 ml, 1 matraz, 1 g de NaCl, la balanza y 1 mechero.
  - Confirmado en **29 s** (criterio de F3: menos de 1 minuto con 5 artículos).
  - En el detalle se devolvieron 2 vasos, 1 vaso se registró como roto (el aviso dijo "¿Registrar 1 pz de Vaso de precipitado 250 ml como merma a cargo de Equipo 5 · 2° C?") y el NaCl se marcó como consumido.
  - "Todo regresó completo" saldó el resto y el vale se cerró solo.
  - Existencias finales: vasos 22 (23 − 1 roto), balanza 1 en lab, NaCl 379 g.
- **Ficha del alcohol etílico:** recepción de 1,000 ml (350 → 1,350) y ajuste por conteo a 1,320 ml, que registró −30 ml con la nota "Conteo semestral". Sin nota, el formulario no se envía.
- **Pendiente:** el escaneo continuo con cámara real, en el Android del autor.

---

## F4 — Respaldo · 30 de septiembre de 2026

### Qué se hizo
- **Pantalla Respaldo** (☰ → Respaldo):
  - **Respaldo completo:** descarga un archivo `.json` con todas las tablas. En celulares que lo permiten, "Compartir respaldo" lo manda directo a WhatsApp, correo o Drive. Se muestra la fecha del último respaldo.
  - **Restaurar desde archivo:** revisa que el archivo sea un respaldo de LabQR y que esté completo, dice qué trae (artículos, vales, movimientos) y pide confirmación antes de reemplazar todo. El reemplazo va en una sola transacción: si algo falla, no se pierde nada.
  - **Exportar CSV** (para Excel):
    - Inventario actual, con existencia en laboratorio, prestado, total, mínimo y especificaciones.
    - Movimientos.
    - Vales, con la **duración de la entrega en segundos** (SPEC §8).
  - **Importar inventario inicial:**
    - Plantilla CSV descargable. La importación acepta coma o punto y coma, para archivos guardados desde Excel en español.
    - Vista previa con los renglones que tienen errores, indicados por número de renglón de la hoja.
    - Crea los laboratorios y ubicaciones que falten y da de alta los artículos con su recepción inicial.
- **Aviso de respaldo en Inicio:** aparece si hay datos y nunca se ha respaldado, o si el último respaldo tiene más de 7 días.
- **`navigator.storage.persist()`:** se pide al abrir la app para que el navegador no borre los datos por falta de espacio. Respaldo muestra si quedó protegido.

### Decisiones y por qué
- **La fecha del último respaldo se guarda antes de generar el archivo**, así el archivo la incluye y restaurar deja exactamente los mismos datos. En la primera versión se guardaba después, y al restaurar la app decía que nunca se había respaldado. La prueba de ida y vuelta lo detectó.
- **Los números del CSV van sin separador de miles** (1320, no 1,320), porque la coma rompería las columnas en Excel. Se agrega BOM para que Excel abra bien los acentos.
- **Al importar, el laboratorio se reconoce por nombre o por prefijo**, para no duplicar "Química" si alguien escribe "quimica".
- Versión 0.5.0.

### Problemas encontrados
- **La ventana de confirmación dependía del evento `close` del `<dialog>`**. En el navegador de pruebas quedó una ventana cerrada sin quitarse, y un segundo toque llegó a esa ventana vieja. Se cambió para que responda directamente al toque del botón y se quite de inmediato. Afecta a todas las confirmaciones de la app; se volvió a probar con el respaldo.

### Cómo se probó
- 41 pruebas automáticas; 8 nuevas:
  - El respaldo pasa por texto JSON y regresa igual.
  - Se rechazan archivos ajenos, de otra versión, incompletos o con IDs repetidos.
  - La regla de los 7 días.
  - El CSV maneja comillas, comas y saltos de línea.
  - Se aceptan archivos separados con punto y coma.
  - Los números del inventario salen sin separador.
  - La duración de los vales sale en segundos (48, 42 y 72 s en la demo).
  - La plantilla se lee bien y los renglones malos se reportan con su número.
- **Criterio de F4 en el navegador:**
  1. Con la demo cargada, "Descargar respaldo" (se capturó el archivo).
  2. Se borraron todos los datos: 0 artículos y 0 movimientos.
  3. "Restaurar desde archivo" mostró "Trae 33 artículos, 3 vales y 53 movimientos" y, tras confirmar, **las 7 tablas (106 renglones) quedaron idénticas a antes**.
- **Importación:** la plantilla más un multímetro de Física y un renglón con tipo "herramienta". La vista previa dijo "4 artículos listos · 1 renglón con error. Renglón 6: tipo debe ser equipo, material o reactivo". Se importaron 4: se creó el laboratorio Física (FIS-0001) y los códigos siguieron la numeración existente (QUI-0023, BIO-0013).
- **Pendiente:** probar descargar y compartir en el Android real (WhatsApp o Drive) y restaurar allí.

---

## F5 — Tablero de exposición · 30 de septiembre de 2026

### Qué se hizo
- **`#/tablero`** (☰ → Tablero de exposición), pantalla completa sin barras, pensada para una laptop o una TV en el stand:
  - Encabezado con "LabQR", el laboratorio, botones para cambiar de laboratorio y reloj.
  - **Una fila de probetas por ubicación.** Debajo de cada probeta van el código, el nombre y la existencia; en rojo si está bajo mínimo. El equipo aparece como tarjeta: "En su lugar" o el nombre de quien lo tiene, con contorno punteado.
  - A un lado, los **vales abiertos** (los vencidos primero, en rojo, con "Venció hace N días") y los **últimos 8 movimientos**. Los nuevos entran resaltados y las probetas bajan con la misma animación del vale.
  - El tamaño de todo se calcula con el ancho de la pantalla (entre 14 y 28 px de base), para que se lea a 3 metros en una TV de 1920 × 1080.

### Decisiones y por qué
- **"En vivo" con `liveQuery` de Dexie** (ya incluido, sin paquetes nuevos). El tablero se actualiza solo cuando cambia la base de datos, incluso si el cambio se hizo en otra ventana del mismo navegador.
- **Contradicción encontrada entre DESIGN.md y SPEC.md:** DESIGN dice que el tablero muestra en vivo lo que se hace en el celular, pero SPEC §2 fija un solo dispositivo sin sincronización en v0. Por eso el tablero solo ve lo que pasa **en el mismo dispositivo**. Para la exposición se proponen dos opciones:
  1. La laptop muestra el tablero en la TV y la demo se hace en otra ventana de esa laptop.
  2. Adelantar la sincronización de v1 (Neon), que es una decisión del autor.
- Versión 0.6.0.

### Cómo se probó
- A 1920 × 1080 con la demo: se ven las 3 ubicaciones de Biología, los 6 equipos (el microscopio 2 "Equipo 3" con contorno punteado), 1 vale abierto y los últimos movimientos.
- **Prueba en vivo:** con el tablero abierto en una pestaña, se registró desde otra pestaña una merma de 5 portaobjetos. En menos de 2 segundos, y sin recargar, el tablero pasó de 90 a 85 pz y la merma apareció arriba de la lista, resaltada.
- 41 pruebas automáticas siguen pasando.
- **Pendiente:** verlo en una TV o proyector real a 3 m (criterio de "listo" de F5).

---

## Auditoría independiente · 30 de septiembre de 2026

### Qué se hizo
Antes de publicar F2 a F5, un auditor con contexto limpio revisó el código:
- No leyó CLAUDE.md, la bitácora ni los commits, para no heredar las suposiciones del desarrollo.
- Solo reportó fallas con reproducción.
- Solo leyó el código; no corrigió nada.

Encontró **12 fallas**: 1 alta, 5 medias y 6 bajas. Para las que se pueden probar sin navegador primero se escribió una **prueba que fallaba** (`src/audit.test.js`, 6 pruebas) y después el arreglo.

| # | Severidad | Falla | Arreglo |
|---|---|---|---|
| 1 | Alta | El nombre de un artículo entraba sin escapar en la probeta SVG (ficha, confirmación del vale y tablero): un nombre malicioso podía ejecutar código | Se escapa el texto |
| 2 | Media | Las cantidades de 1,000 o más se mostraban como "1,000" en los campos y no se podían volver a leer (fallaba devolver 1,000 ml) | Los campos usan números sin separador y la lectura acepta separador de miles |
| 3 | Media | Un doble toque en Recepción, Merma, Devuelto o Consumido guardaba dos movimientos | Un solo envío a la vez; el botón se desactiva |
| 4 | Media | Un doble toque en "Escanear artículos" abría dos cámaras: cada QR contaba doble y la cámara no se apagaba | Se ignoran toques mientras abre; un número de turno apaga la cámara que llegue tarde |
| 5 | Media | El borrador del vale conservaba artículos o solicitantes borrados ("Borrar todo" o restaurar un respaldo) | El borrador se limpia al abrir la pantalla; confirmar valida que el solicitante exista |
| 6 | Media/baja | Cambiar la unidad de un artículo con historial cambiaba el sentido de todos sus movimientos | La unidad se bloquea en cuanto hay movimientos |
| 7 | Baja | Un texto que empieza con =, +, - o @ se volvía fórmula al abrir el CSV en Excel | Se antepone un apóstrofo; los números negativos se respetan |
| 8 | Baja | Escribir "50%" en Escanear rompía la lectura del código sin mensaje | La lectura nunca truena: responde "código no válido" |
| 9 | Baja | Importación CSV: números de renglón corridos con renglones vacíos, fechas imposibles (2027-13-45) aceptadas y equipo con cantidad 3 convertido en 1 sin avisar | Número de renglón real, fecha validada y aviso de "pieza única" |
| 10 | Baja | La fecha de devolución se calculaba al abrir la pantalla y no al confirmar | Se calcula al confirmar |
| 11 | Baja | "Todo regresó completo" usaba datos viejos y avisaba "cerrado" aunque algo fallara | Relee el vale al momento y avisa el resultado real |
| 12 | Baja | Un doble Enter podía crear dos laboratorios con el mismo prefijo o dos solicitantes iguales | El prefijo se valida dentro de la transacción; botones desactivados al enviar |

Áreas que el auditor revisó y encontró sin fallas:
- Aritmética de existencias y pendientes.
- Límites de préstamo y devolución dentro de las transacciones.
- Código inmutable y borrado solo sin movimientos.
- Respaldo de ida y vuelta.
- Escape en las demás pantallas y eventos que no se duplican.

### Cómo se probó
- 47 pruebas automáticas (6 nuevas de la auditoría): todas pasan.
- **En el navegador, con las reproducciones del auditor:**
  - Se prestaron 1,000 ml de alcohol: el campo de devolución mostró "1000".
  - Un doble clic en "Devuelto" guardó **un solo** movimiento de devolución y el vale se cerró.
  - Confirmar con un solicitante inexistente fue rechazado.
  - Se creó un artículo con un nombre que intenta inyectar código: en el tablero y en la ficha no se generó ninguna imagen ni se ejecutó nada. Después se archivó.
- Versión 0.6.1.

### Lección
Sin esta auditoría, las 12 fallas se habrían publicado. Queda como regla: **auditar antes de decir "listo"**, no después.

---

## Publicación de F2 a F5 · 30 de septiembre de 2026

- `dev` se unió a `main` después de la auditoría y GitHub Pages publicó la versión 0.6.1.
- **Lo que se observó:** el navegador que tenía la 0.2.0 siguió mostrándola en las dos primeras aperturas y cambió a la nueva en la tercera. GitHub Pages guarda los archivos hasta 10 minutos (`max-age=600`), y la PWA actualiza su caché en la apertura siguiente a detectar la versión nueva.
- **Qué se hizo:** en Ajustes hay un botón "Buscar actualización" y, con la app abierta, se revisa sola cada hora. La versión se ve al pie de Inicio y de Ajustes. Versión 0.6.2.
- 30 sep 2026: el autor abrió la app en su Android y confirmó que muestra "Versión 0.6.2". La actualización llegó al celular.
- 30 sep 2026: el autor imprimió una hoja de etiquetas y, al escanear un QR impreso con la cámara normal del Android, se abrió la ficha del artículo. Criterio de F2 cumplido en la parte de etiqueta impresa y cámara normal; falta confirmar la lectura con la cámara de la app.
- 30 sep 2026: con la pestaña Escanear, la cámara de la app leyó la etiqueta impresa y abrió la ficha en el Android del autor. **F2 cerrada:** se cumple su criterio completo (etiqueta impresa → la cámara normal abre la ficha; la cámara de la app también).
- 30 sep 2026: en el Android del autor, un vale con 5 artículos escaneando etiquetas impresas con la cámara de la app se confirmó en **40 s**. Cumple el criterio de F3 (menos de 1 minuto con 5 artículos). Falta probar la devolución en el celular.
- 30 sep 2026: el autor registró la devolución de ese vale en su Android (parcial, un artículo roto y "Todo regresó completo") y el vale se cerró solo. **F3 cerrada** en el celular.
- 30 sep 2026: en su Android, el autor compartió el respaldo por WhatsApp, borró todos los datos y los restauró desde ese archivo; todo regresó, incluido el vale de la prueba de F3. **F4 cerrada** en el celular. Con esto el MVP (F0 a F4) queda validado en el dispositivo real.
- 30 sep 2026: el autor abrió el tablero en una TV y reportó que se lee bien. **F5 cerrada.** Las 6 fases (F0 a F5) quedan validadas en dispositivos reales.

---

## Mantenimiento y materiales del concurso · 30 de septiembre de 2026

- **Publicación:** las acciones de GitHub se actualizaron a sus versiones actuales, que corren en Node 24 (checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5), y el servidor se fijó en `ubuntu-24.04`. Antes de actualizar se revisaron las notas de cada versión mayor; ninguna rompe este flujo. El despliegue pasó sin los avisos de Node 20. La app no cambió.
- **Documentos del concurso:**
  - `ENTREVISTAS.md`: hoja para medir el tiempo de entrega "antes" y anotar respuestas textuales.
  - `EXPOSICION.md`: guion de 5 minutos, preguntas probables de los jueces y lista para el 4 de diciembre.
  - `CARTEL.md`: contenido y jerarquía, en espera de las medidas de la guía.
- No se agregaron funciones nuevas a propósito: primero se valida con laboratoristas (lección de proyectos anteriores).
- 30 sep 2026 · **Decisión del autor sobre el tablero:** en la exposición el tablero se ve en vivo con la demo en otra ventana de la misma laptop ($0, ya funciona). La sincronización con el celular queda para v1. Se actualizaron SPEC, PENDIENTES y el guion de exposición.

---

## Manual de usuario con capturas · 1 de octubre de 2026

- `docs/concurso/MANUAL-USUARIO.pdf`: 18 páginas tamaño carta, 13 pasos y 24 capturas reales de la app (versión 0.6.2) con la demo cargada. Está escrito para alguien que nunca ha usado la app: glosario, pasos numerados, avisos y una tabla de problemas comunes.
- **Cómo se hicieron las capturas:**
  - Chrome automatizado (`puppeteer-core`, instalado fuera del proyecto para no agregar dependencias) recorrió la app como una persona en un celular de 390 × 844.
  - Para la pantalla Escanear se simuló una cámara que apunta a la etiqueta real de QUI-0007. La cámara de prueba de Chrome muestra un patrón verde que confundiría al lector.
  - Los scripts quedaron en `scripts/manual/` para regenerar el manual si cambian las pantallas.
- **Problemas:**
  - Git Bash volvió a alterar la ruta `/labqr/` del servidor (mismo problema de F0); se resolvió sirviendo desde PowerShell.
  - En la primera versión del PDF, las viñetas dentro del paso 3 de "Recibir la devolución" tomaron números y la portada tenía un fondo recortado. Ambas cosas se corrigieron tras revisar las 18 páginas.

---

## F6 — Cambios de la sesión con el equipo · 6 de octubre de 2026

### De dónde salió
Los dos autores trajeron una lista de 13 ideas. Se clasificaron por tamaño en `docs/CAMBIOS-PROPUESTOS.md` y el equipo dio el "va" a esta recomendación:
- Hacer ahora lo chico, más "Prácticas" y fotos.
- Dejar para v1 las cuentas por rol y la foto de credencial.
- Esperar respuestas para el resto.

**Pendiente:** confirmar con laboratoristas cuáles de estas ideas vienen de una necesidad real.

### Qué se hizo
- **Nombre C-Lab** en la app, el ícono instalado y el tablero. La dirección web (`…/labqr/`) no cambió, porque va dentro de los QR ya impresos. El identificador interno de los respaldos sigue siendo "LabQR" para que los archivos anteriores se puedan restaurar.
- **Prácticas** (☰ → Prácticas):
  - El maestro o el encargado guarda la lista de material de cada práctica.
  - En "Nuevo vale" se elige la práctica y la lista se llena sola. También se puede hacer desde la práctica con "Hacer vale con esta práctica".
  - Si no alcanza la existencia, el renglón queda en rojo.
  - La demo trae 3 prácticas.
- **Reactivo en un paso:** al recibirlo se escribe cuánto regresó; lo demás se registra como consumo, con ambos movimientos en una sola transacción.
- **Nota en "Roto o perdido":** se escribe qué pasó y queda en el historial. En reactivos además se indica cuánto se perdió.
- **Alumno = número de control obligatorio**, tanto en la pantalla como en la base de datos.
- **Fotos de artículos:** desde la ficha, con la cámara o la galería. Se reducen a 640 px en JPEG antes de guardarse, se ven en la ficha y en la lista, y viajan en el respaldo.
- **Base de datos:** versión 2, con la tabla `practices`. La actualización en el celular es automática y conserva los datos.
- **Versión de la app:** 0.7.0.

### Auditoría independiente (segunda)
El auditor, con contexto limpio, revisó solo los cambios de F6 y encontró **6 fallas**, todas corregidas:

| # | Severidad | Falla | Arreglo |
|---|---|---|---|
| 1 | Media | En un reactivo, "Roto o perdido" registraba siempre todo lo pendiente; ya no se podía registrar una pérdida parcial | La ventana pregunta cuánto se perdió (sugiere lo pendiente) |
| 2 | Media | Tocar "Registrar regreso" con el campo vacío registraba todo como consumido y cerraba el vale | Pide escribir la cantidad (0 si no regresó nada) |
| 3 | Media | Un respaldo manipulado podía inyectar código en la página a través del id de una práctica | Al restaurar, los ids deben tener forma de identificador; además se escapan en pantalla |
| 4 | Baja | Una práctica mal formada en un respaldo dejaba sin funcionar "Nuevo vale" | El respaldo valida las prácticas; la lista tolera nombres faltantes |
| 5 | Baja | Elegir dos veces la misma práctica duplicaba las cantidades | Una práctica se aplica una sola vez por vale, con aviso |
| 6 | Baja | "Hacer vale con esta práctica" no hacía nada si había un vale a medias | Se agrega al vale en curso |

### Cómo se probó
- **56 pruebas automáticas:** 9 nuevas de prácticas, reactivo y número de control, y 3 de la auditoría (ids inseguros y prácticas mal formadas en respaldos).
- **En el navegador, con vista de celular:**
  - La base de datos anterior, con 38 artículos, se actualizó a la versión 2 sin perder nada.
  - "Hacer vale con esta práctica" (Titulación) llenó 5 renglones. Al elegirla otra vez, no los duplicó.
  - Una alumna sin número de control no se pudo agregar; con número de control, sí.
  - El vale se confirmó con la práctica ligada.
  - Ácido clorhídrico: se escribió "regresaron 12 ml de 50" y se registraron 12 ml devueltos y 38 ml consumidos. Con el campo vacío, la app pidió la cantidad y no registró nada.
  - Una pérdida parcial de 10 ml con la nota "Se derramó" dejó 40 ml pendientes.
  - Un vaso roto quedó con la nota "Se cayó al lavarlo" en el historial.
  - Una foto de 3000 × 2000 se guardó reducida a 640 px en JPEG.
  - Un respaldo anterior sin prácticas se restauró sin errores, y uno nuevo regresó idéntico, con prácticas y fotos.
- **Pendiente:** probarlo en el Android, en especial la cámara para fotos.

---

## Manual actualizado a C-Lab 0.7.0 · 6 de octubre de 2026

- `MANUAL-USUARIO.pdf` regenerado: 20 páginas y 29 capturas, con el nombre C-Lab.
  - Paso nuevo: "Guardar prácticas".
  - "Prestar" ahora explica la práctica guardada y el número de control del alumno.
  - "Recibir la devolución" ahora explica el regreso de reactivos y la nota en "Roto o perdido".
  - Se agregó la foto del artículo.
- **Lección aplicada** (Xcellence: "documentos que se quedaron atrás"): el manual decía "LabQR" y no tenía F6. Se pasaron a C-Lab también el informe, el cartel, el guion de exposición, el manual de instalación, la hoja de entrevistas y el guion para laboratoristas. Este último incluye ahora 7 preguntas para validar las ideas del equipo antes de seguir programando.
- **Problema encontrado:** el campo "Cantidad que regresó" usaba el atributo `data-back`, el mismo que el botón de regresar de la barra superior. La app no fallaba, porque busca con el id del artículo, pero el script de capturas tomó el botón equivocado. Se renombró a `data-returned` para quitar la trampa.
- 6 oct 2026: el autor abrió la app en su Android y confirmó la versión 0.7.0 (F6 llegó al celular).
- 6 oct 2026: el autor probó en su Android un vale hecho desde una práctica, el regreso de un reactivo y una foto real de un artículo. **F6 cerrada** en el celular. Sigue pendiente validar con laboratoristas si estas funciones les sirven.
