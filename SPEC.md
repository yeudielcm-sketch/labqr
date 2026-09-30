# SPEC.md — LabQR (nombre provisional)

## 1. Qué es

PWA gratuita para llevar el inventario y los préstamos de los laboratorios del CBTIS 108 usando códigos QR. Es un prototipo para descubrir requisitos: se le muestra a laboratoristas y maestros, ellos dicen qué falta y se corrige sobre la marcha. Por eso todo debe ser fácil de cambiar, en especial los campos de cada artículo.

Concurso: CNPyPE 2027, modalidad Prototipo de Desarrollo de Software. Fase local: 4 de diciembre de 2026.

## 2. Supuestos de v0 (se revisan tras la entrevista con laboratoristas)

1. Un solo dispositivo: el celular o la PC del laboratorista. Sin servidor, sin cuentas, sin login.
2. Los datos viven en IndexedDB. El respaldo se hace exportando e importando un JSON.
3. Hosting gratis como sitio estático en GitHub Pages (HTTPS, que la cámara necesita).
4. El dispositivo principal es Android con Chrome. iPhone debe funcionar, pero es secundario.
5. En el laboratorio puede no haber internet: después de la primera carga, todo funciona offline.
6. Mínimo de datos personales: del alumno solo nombre, grupo y matrícula opcional.

Si la entrevista revela que capturan varias personas desde varios dispositivos, v1 agrega sincronización con Neon (PostgreSQL, plan gratuito) detrás de una API mínima. El celular sigue siendo local-first: guarda en IndexedDB y sincroniza cuando hay señal. No se diseña para eso ahora, pero los IDs son UUID y los movimientos son append-only, así que migrar es subir filas, no reescribir.

## 3. Glosario (UI en español → código en inglés)

| UI | Código | Significado |
|---|---|---|
| Laboratorio | `lab` | Química, Biología, etc. |
| Ubicación | `location` | Anaquel, gaveta o mueble dentro de un laboratorio |
| Artículo | `item` | Cualquier cosa inventariada |
| Equipo | `kind: 'equipment'` | Pieza única, con número de serie opcional. Cantidad siempre 1 |
| Material | `kind: 'material'` | Piezas contables que se prestan y pueden romperse (vidrio, pinzas) |
| Reactivo | `kind: 'reagent'` | Consumible con unidad (ml, g) y caducidad opcional |
| Solicitante | `borrower` | Alumno, equipo de práctica o docente |
| Vale de préstamo | `loan` | Documento que agrupa lo que sale para una práctica |
| Recepción | `RECEIVE` | Entrada de material nuevo |
| Préstamo | `LEND` | Salida ligada a un vale |
| Devolución | `RETURN` | Regreso ligado a un vale |
| Consumo | `CONSUME` | Reactivo gastado en práctica (no regresa) |
| Merma | `LOSS` | Rotura, pérdida o caducidad. Puede tener responsable |
| Ajuste por conteo | `ADJUST` | Corrección tras conteo físico, con nota obligatoria |

## 4. Modelo de datos (Dexie)

**Principio central: ledger append-only.** El stock nunca se guarda como campo mutable; se calcula sumando movimientos. Un movimiento no se edita ni se borra: si hay un error, se registra otro movimiento que lo corrige.

**Cantidades:** enteros en centésimas de la unidad (`qty = 250` significa 2.50). Así se evita el error de los decimales, igual que con los centavos.

```
labs       { id, name, createdAt }
locations  { id, labId, name, createdAt }
items      { id, code, name, kind, unit, labId, locationId,
             minStock, expiresAt?, serial?, notes?,
             extra: { [key: string]: string },  // campos libres que pidan los maestros
             archived: boolean, createdAt, updatedAt }
borrowers  { id, name, type: 'student'|'team'|'teacher', group?, studentId?, createdAt }
loans      { id, borrowerId, labId, practice?, createdAt, confirmedAt?, dueAt, closedAt?, notes? }
movements  { id, itemId, type, qty, loanId?, borrowerId?, reason?, note?, createdAt }
settings   { key, value }  // lastBackupAt, labelLayout, etc.
```

- `code`: código corto y legible, autogenerado a partir del prefijo del laboratorio más un consecutivo (`QUI-0001`, `BIO-0012`). Es lo que va impreso y codificado en el QR. Es único e inmutable.
- `unit`: `pz | ml | g | l | kg`. El equipo siempre usa `pz`.
- `extra`: pares clave-valor libres, editables desde la ficha del artículo. Aquí caen las "especificaciones adicionales" de cada maestro (marca, modelo, concentración, voltaje...) sin tocar el esquema.

### Derivados (funciones puras en `src/domain/`)

- `onHand(item) = RECEIVE - LEND + RETURN - CONSUME - LOSS ± ADJUST`
- `lentOut(item) = LEND - RETURN - LOSS con loanId`, por vale abierto
- `total(item) = onHand + lentOut`
- `lowStock(item) = onHand < minStock`
- `expiringSoon(item) = expiresAt dentro de 30 días`
- Estado de un vale: `open` si tiene saldo pendiente; `overdue` si está abierto y pasó `dueAt`; `closed` si todo regresó o se registró como merma o consumo.

## 5. Pantallas del MVP

Navegación inferior con 4 pestañas: Inicio · Escanear · Artículos · Vales. Ajustes, Etiquetas y Respaldo van en un menú.

1. **Inicio:** tarjetas con vales abiertos, vales vencidos, artículos bajo mínimo y reactivos por caducar. Cada tarjeta lleva a su lista filtrada. Si el último respaldo tiene más de 7 días, aparece un aviso.
2. **Escanear:** cámara a pantalla completa.
   - Fuera de un vale: al leer un QR abre la ficha del artículo.
   - Dentro de un vale: escaneo continuo. Cada lectura suma el artículo al vale con vibración y sonido corto; volver a leer el mismo suma 1. Botón "Terminar".
   - Botón para capturar el código a mano si la cámara falla.
3. **Artículos:** lista con búsqueda (nombre, código, campos extra) y filtros por laboratorio, ubicación, tipo, "bajo mínimo" y "por caducar". Alta y edición.
4. **Ficha del artículo:** datos, stock (en laboratorio / prestado / total), campos extra editables, historial de movimientos y acciones rápidas (Recepción, Merma, Ajuste, Imprimir etiqueta).
5. **Vales:**
   - Nuevo vale: elegir o crear solicitante → práctica (texto opcional) → escanear o buscar artículos → ajustar cantidades → Confirmar (genera los `LEND`).
   - Devolución: abrir el vale → por renglón, "Devuelto" (todo o parcial), "Roto/perdido" (`LOSS` con el responsable = solicitante) o "Consumido" (solo reactivos) → cerrar.
6. **Etiquetas:** elegir artículos (o "todos los de esta ubicación") → vista de impresión en hoja carta con QR + código + nombre, usando CSS `@media print`.
7. **Respaldo:** exportar e importar JSON completo; exportar CSV (inventario actual, movimientos y vales). Importar CSV de inventario inicial con una plantilla descargable.
8. **Ajustes:** laboratorios (nombre + prefijo), ubicaciones, días de préstamo por defecto (0 = mismo día), botones "Cargar datos de demostración" y "Borrar todo" (doble confirmación).

## 6. QR

- Contenido del QR: URL absoluta `https://<host>/<base>/#/i/<code>`. Escaneado con la cámara normal del celular, abre la ficha; escaneado dentro de la app, se extrae el `code`.
- Generación: en el cliente, en SVG.
- Lectura: usar el `BarcodeDetector` nativo si existe (Chrome Android). Si no, un polyfill basado en zxing-wasm. Siempre con detección de capacidades.

## 7. Datos de demostración (crítico)

Nadie sabe todavía qué se puede hacer, así que la demo es la herramienta para la entrevista. "Cargar demo" crea:

- Laboratorio Química (`QUI`) y Biología (`BIO`), con 3 ubicaciones cada uno.
- Unos 30 artículos realistas: microscopios con número de serie, balanza, vasos de precipitado de 250 ml, probetas, matraces, pinzas y reactivos (NaCl en g, alcohol etílico en ml, uno por caducar, uno bajo mínimo). Incluye campos extra de ejemplo (marca, modelo, concentración).
- 5 solicitantes (equipos de práctica y un docente).
- 3 vales: uno cerrado, uno abierto y uno vencido con una merma.

Así, al abrir la app ya se ven todas las pantallas con sentido.

## 8. Métricas para el informe

Cada vale guarda `createdAt` (inicio de captura) y `confirmedAt` (entrega). El CSV de vales exporta la duración en segundos. Con eso se calcula el tiempo promedio de entrega de material antes y después, sin pantallas extra en v0.

## 9. Fases

No se avanza a la siguiente fase hasta que la anterior funcione en el celular.

| Fase | Entregable | Criterio de "listo" |
|---|---|---|
| F0 | Esqueleto: Vite + PWA + Dexie + router por hash + despliegue automático a GitHub Pages | Se instala en Android, abre offline y tiene una URL pública |
| F1 | Catálogo: laboratorios, ubicaciones, artículos (CRUD), ficha, búsqueda y filtros, campos extra, demo | Con la demo cargada se navega todo el catálogo |
| F2 | QR: generación, hoja de etiquetas, escáner, enlace directo `#/i/<code>` | Etiqueta impresa → la cámara normal abre la ficha; la cámara de la app también |
| F3 | Movimientos y vales: recepción, merma, ajuste, vale con escaneo continuo, devolución parcial, stock derivado, Inicio | Un préstamo completo de principio a fin en menos de 1 minuto con 5 artículos |
| F4 | Respaldo: JSON export/import, CSV export, importación CSV con plantilla, aviso de respaldo, `navigator.storage.persist()` | Borrar datos → importar respaldo → todo regresa idéntico |
| F5 | Tablero de exposición (`#/tablero`) según `DESIGN.md` | Se ve bien en laptop o TV a 3 metros de distancia |

MVP = F0 a F4. F5 va antes del 4 de diciembre. Los tokens visuales de `DESIGN.md` se montan desde F0, no al final. Después de F4 se hace la entrevista con laboratoristas y se escribe `SPEC-v1.md`.

## 10. Infraestructura y costos (para el informe: factibilidad económica)

| Etapa | Frontend | Datos | Costo |
|---|---|---|---|
| v0 (MVP, concurso local) | GitHub Pages | IndexedDB en el dispositivo + respaldo JSON | $0 |
| v1 (varios dispositivos) | GitHub Pages | Neon Free + API mínima (hosting gratuito por definir) | $0 |
| Escala (varios planteles / uso institucional) | Igual | Neon Launch (pago por uso) | Ver informe |

Límites de Neon Free (verificados en la FAQ oficial de Neon, septiembre de 2026): 0.5 GB por proyecto; 100 CU-horas de cómputo por proyecto al mes; 5 GB de transferencia al mes; la base se suspende tras 5 minutos sin uso; restauración a un punto anterior de solo 6 horas. Al agotar el cómputo, la base se pausa hasta el mes siguiente, pero no se borran datos.

Mitigaciones que se implementan en v1:

- Local-first: la suspensión y el arranque en frío (unos segundos) no bloquean al laboratorista, porque escribe en el dispositivo y sincroniza en segundo plano.
- Respaldo propio: respaldo automático semanal (`pg_dump` desde GitHub Actions o JSON), porque la restauración de 6 horas no alcanza.

## 11. Fuera de alcance en v0

Login y roles, sincronización multidispositivo, notificaciones push, credenciales QR para alumnos, compras a proveedores, reportes gráficos, multi-plantel.
