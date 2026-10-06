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
