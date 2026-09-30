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
- Pendiente en esta entrada: instalar en un Android real desde la URL pública y abrir sin internet (criterio de "listo" de F0).
