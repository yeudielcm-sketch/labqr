# Decisiones de C-Lab

> Una línea por decisión, con fecha. **Solo se agrega**: si una decisión cambia, se escribe otra línea que la reemplaza.
> Antes de proponer algo, revisar "Descartado": lo que está ahí ya se pensó y se decidió no hacer.

## Tomadas

| Fecha | Decisión | Quién | Por qué |
|---|---|---|---|
| 29 sep 2026 | Stack: Vite + JS sin framework, Dexie, vite-plugin-pwa, uqr, barcode-detector | SPEC / CLAUDE.md | Cambiar rápido, costo $0, funciona sin internet |
| 29 sep 2026 | Vite 6 y Vitest 4 en vez de los más nuevos | Claude | Node 20.11 en la computadora de desarrollo |
| 30 sep 2026 | Repositorio público `yeudielcm-sketch/labqr` + GitHub Pages | Autor | Pages gratis exige repositorio público |
| 30 sep 2026 | Merma o consumo **con vale** resta de lo prestado, no de lo que hay en el laboratorio | Claude (aclaración al SPEC §4) | Si no, una pieza rota en préstamo se descontaba dos veces |
| 30 sep 2026 | Los laboratorios llevan prefijo (QUI, BIO) | Claude (aclaración al SPEC) | El SPEC lo usaba en Ajustes pero no estaba en el modelo |
| 30 sep 2026 | El `.wasm` del lector QR de respaldo va dentro de la app | Claude | Sin él no habría escáner sin internet en celulares sin lector nativo |
| 30 sep 2026 | Trabajo nuevo en la rama `dev`; `main` = lo publicado | Claude | No romper la app mientras el autor la enseña |
| 30 sep 2026 | Auditoría independiente antes de publicar cada cambio grande | Claude (lección de Xcellence) | La primera encontró 12 fallas, la segunda 6 |
| 30 sep 2026 | Tablero en vivo = demo en otra ventana de la misma laptop; la sincronización queda para v1 | Autor | $0 y ya funciona |
| 30 sep 2026 | Acciones de GitHub actualizadas y servidor fijo `ubuntu-24.04` | Claude | Que el cambio del 19 oct no afecte cerca del concurso |
| 6 oct 2026 | Nombre definitivo: **C-Lab**. La dirección web `…/labqr/` no cambia | Autores | Los QR ya impresos llevan esa dirección |
| 6 oct 2026 | El identificador interno de los respaldos sigue siendo "LabQR" | Claude | Que los respaldos anteriores se puedan restaurar |
| 6 oct 2026 | F6: Prácticas, reactivo en un paso, nota en merma, número de control para alumnos, fotos | Autores ("hazlo") | Lista del equipo, `CAMBIOS-PROPUESTOS.md` |
| 7 oct 2026 | F7: **3 roles sin cuentas** (Químico, Laboratorista, Alumno). Al entrar se elige cualquiera, sin contraseña. No reemplaza lo descartado del 6 oct: siguen sin existir cuentas, servidor ni login | Autor ("va") | Cada quien ve solo lo suyo y se puede enseñar ya; el rol solo ordena la pantalla, no protege datos |
| 7 oct 2026 | El químico deja **tareas** (práctica + grupo + fecha); el alumno pide el material desde la tarea y su pedido queda como **solicitud** hasta que el laboratorista la aprueba | Autor | "De ahí sale lo que tiene que pedir en el vale"; la solicitud no mueve existencias |
| 7 oct 2026 | Aprobar una solicitud abre el vale ya lleno; confirmar el préstamo la marca como entregada en la misma operación | Claude | Un solo toque para confirmar (CLAUDE.md) y nunca un vale sin su solicitud |
| 7 oct 2026 | El estado de una solicitud (por aprobar → entregada/rechazada) sí se actualiza en su renglón | Claude | No es un movimiento de existencias; el registro de movimientos sigue sin editarse |
| 7 oct 2026 | El rol y los datos del alumno del dispositivo **no viajan en el respaldo** y se conservan al restaurar | Claude | Restaurar el respaldo del maestro no debe volver "Químico" el celular del laboratorista |
| 7 oct 2026 | Las solicitudes solo llegan si se hacen en el mismo dispositivo del laboratorista (p. ej. una tablet en la ventanilla) | Claude, informado al autor | Sin servidor no hay otra forma a $0; propuesta pendiente: pasar tareas y solicitudes por QR |
| 7 oct 2026 | Tareas y solicitudes pasan de un celular a otro **por QR** (o por enlace de WhatsApp), con todo el contenido dentro: sin servidor y sin internet | Autor ("agrega lo del QR") | La app ya está en varios dispositivos; sigue costando $0 |
| 7 oct 2026 | En el QR los artículos van por su código impreso; si un código no existe en el celular del laboratorista, se avisa y no se adivina | Claude | El código es lo único igual en todos los dispositivos con el mismo catálogo |
| 7 oct 2026 | F8: "bajo mínimo" **sigue en rojo**. En vez de cambiar colores, el Inicio ordena de más a menos urgente y deja tenue lo que está en cero | Claude | DESIGN.md define el rojo para vencido, merma y bajo mínimo, y DESIGN.md manda |
| 7 oct 2026 | F8: el rol va en la barra de arriba (con nombre en Inicio, solo ícono en las demás pantallas) y sustituye a la línea "Entraste como…" | Claude | Siempre visible sin quitarle espacio a los títulos largos |
| 7 oct 2026 | Ilustraciones propias para los artículos (no fotos de internet), se irán agregando | Autor | Derechos de autor; el concurso pide desarrollo original |

## En espera (necesitan respuesta de los autores)

- Tamaño de etiqueta: grande (10 por hoja) o chica (24 por hoja).
- Vales de microscopio distintos (idea 4), reglamento (5), campos del vale de papel (6), "1 día antes" (7), sustitución de reactivos (9), caducidades (10).
- Línea de investigación: se propone "Desarrollo tecnológico" (confirmar con el asesor).

## Descartado — no volver a proponer sin releer esto

| Fecha | Qué | Por qué |
|---|---|---|
| 29 sep 2026 | Login, backend, analytics y tracking en v0 | CLAUDE.md "No hacer"; costo $0 y un solo dispositivo |
| 29 sep 2026 | Guardar datos del dominio en `localStorage` | CLAUDE.md: solo IndexedDB |
| 30 sep 2026 | `fake-indexeddb` para pruebas | Paquete nuevo sin aprobación; la demo se probó como función pura |
| 6 oct 2026 | Cuentas por rol (Químicos, Encargados, Alumnos) **para diciembre** | Exige servidor, sincronización y aviso de privacidad; ~8 semanas no alcanzan junto con informe y cartel. Va como **v1** en el informe |
| 6 oct 2026 | Foto de la credencial del alumno | Dato personal sensible, va contra el "mínimo de datos" del SPEC y exige aviso de privacidad. Basta el número de control |
