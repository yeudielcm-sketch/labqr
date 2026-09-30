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
- Pendiente: probarlo en el Android del autor y mostrarlo a un laboratorista.
