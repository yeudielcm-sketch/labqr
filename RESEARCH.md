# RESEARCH.md — Competencia y antecedentes

> Investigación de septiembre de 2026. Sirve para dos cosas: decidir el alcance del MVP y alimentar la sección de antecedentes / estado del arte del informe del concurso. Las cifras de precios vienen de sitios del proveedor o de agregadores (Capterra, GetApp) y pueden cambiar.

## 1. Soluciones comerciales

| Producto | Enfoque | Lo relevante para nosotros | Limitante para un CBTIS |
|---|---|---|---|
| Sortly (sortly.com) | Inventario general con versión para escuelas | Escaneo QR/código de barras desde el celular para préstamo y devolución; genera e imprime etiquetas; mínimos de stock; importación de inventario existente | De pago, inglés, pensado para inventario genérico, no para prácticas de laboratorio |
| GoCodes (gocodes.com) | Rastreo de activos en escuelas | Etiquetas QR incluidas; no requiere instalar app: se escanea la etiqueta y se hace el préstamo | De pago; orientado a activos (equipo de TI, herramienta), no a consumibles |
| Quartzy (quartzy.com) | Laboratorios de investigación | Ubicaciones y sububicaciones; campos personalizables (cantidad, ubicación, estado físico, caducidad); búsqueda y filtros | Centrado en compras a proveedores de EE. UU.; planes de pago desde ~USD 159/mes según Capterra |
| Labsistant (labsistant.com) | Inventario de laboratorio | Caducidades, almacenamiento jerárquico; plan gratis limitado a 2 usuarios y 50 artículos | 50 artículos no alcanzan para un laboratorio escolar |
| LabArchives Inventory | Laboratorios universitarios | Búsqueda por palabra o por QR; alertas por caducidad y por cantidad mínima | Parte de una suite institucional de pago |
| QR Inventory | Laboratorios, mobile-first | Escaneo continuo para registrar varios artículos en una sola operación | De pago; funciones avanzadas (voz, NFC, BLE) fuera de alcance |
| Hector (hectorassetmanager.com) | Activos en escuelas | Módulo de préstamos; genera, imprime y escanea QR | De pago; enfoque en equipo de TI |
| Snipe-IT (snipeitapp.com) | Activos de TI, open source | Gratis si se aloja uno mismo; préstamo y devolución con historial de cada acción; consumibles con límites | Requiere servidor y conocimientos técnicos para instalarlo; pensado para TI, no para laboratorio |

> Nota de transcripción: algunas celdas de la columna "Limitante" venían cortadas en el PDF original; se completaron con el sentido evidente de la fila. Revisar contra el original antes de citarlas en el informe.

## 2. Antecedente académico

Universidad de La Salle (Colombia): sistema de información para el préstamo de equipos y material de laboratorio con lectura de código de barras. El laboratorista hace inventario y préstamos desde un dispositivo móvil, en el lugar donde están los equipos. Confirma que el problema existe en laboratorios educativos y que la solución móvil es la dirección correcta. Es universitario, con servidor propio y código de barras (no QR).

## 3. Patrón común (lo que todos hacen)

1. Un código por artículo (QR o de barras) con etiquetas imprimibles.
2. Préstamo y devolución escaneando.
3. Historial de cada movimiento (quién, qué, cuándo).
4. Alertas por mínimo de stock y por caducidad.
5. Ubicaciones (laboratorio → anaquel → gaveta).
6. Campos personalizables por tipo de artículo.
7. Importar desde Excel/CSV.

## 4. Hueco que ninguno cubre (nuestro diferenciador)

- **Costo cero y sin instalación:** una PWA que se abre desde un enlace y se usa en el celular del laboratorista, sin licencias por usuario ni en dólares.
- **Flujo de práctica de bachillerato:** el préstamo es a un equipo de alumnos por práctica, no a una persona por días. Lo que se rompe queda ligado a quien lo tenía (merma con responsable).
- **Tres tipos de artículo en un mismo sistema:** equipo (pieza única con número de serie), material (vidrio y piezas contables que se rompen) y reactivos (consumibles con unidad y caducidad). Las herramientas de TI no manejan reactivos, y las de laboratorio de investigación no manejan préstamos a alumnos.
- **Lenguaje de almacén en español:** recepción, vale de préstamo, devolución, merma, ajuste por conteo. Viene del módulo de logística "Controla el flujo de mercancías en almacén", lo que da pertinencia académica.
- **El QR abre la ficha con la cámara normal del celular:** cualquier maestro puede ver qué es, dónde va y si está prestado, sin app ni cuenta.

## 5. Qué adoptamos y qué descartamos para el MVP

**Adoptado:** QR por artículo con hoja de etiquetas (Sortly, GoCodes); el QR como enlace que funciona sin app (GoCodes); escaneo continuo en el vale (QR Inventory); ubicaciones (Quartzy); mínimos y caducidades (Sortly, LabArchives); campos personalizables (Quartzy, Snipe-IT); historial inmutable de movimientos (Snipe-IT); importación CSV (Sortly).

**Descartado por ahora:** compras a proveedores, NFC/BLE/GPS, voz e IA, hojas de seguridad (SDS), correos automáticos, multiusuario con roles. Se reconsideran después de entrevistar a los laboratoristas.

## Fuentes

- Sortly — https://www.sortly.com/industries/education-inventory-management-software/
- GoCodes — https://gocodes.com/solution/school-inventory-management/
- Quartzy (Capterra) — https://www.capterra.com/p/189585/Quartzy/
- Quartzy — https://www.quartzy.com/tour/inventory
- Labsistant — https://labsistant.com/compare/quartzy
- LabArchives Inventory (guía rápida) — https://research.uky.edu/sites/default/files/2025-01/inventory_labmember_qsg_1.1.pdf
- QR Inventory — https://small-business-inventory-management.com/inventory-asset-tracking-for-industries/inventory-management-for-laboratories.htm
- Hector — https://hectorassetmanager.com/applications-by-industries/education/
- Snipe-IT — https://snipeitapp.com/product
- Universidad de La Salle — https://ciencia.lasalle.edu.co/items/79afbc00-b0ec-4e77-ac8c-76ede47a4ca6
