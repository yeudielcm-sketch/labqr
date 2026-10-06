# CLAUDE.md — Reglas para trabajar en C-Lab (antes LabQR)

Lee `SPEC.md` antes de cualquier tarea y `DESIGN.md` antes de tocar cualquier UI. Si tienes disponible el skill `frontend-design`, úsalo junto con `DESIGN.md`, pero `DESIGN.md` manda. `RESEARCH.md` es contexto: no lo implementes, solo explica por qué existen ciertas funciones.

## Contexto en 3 líneas

- Prototipo para el concurso CNPyPE (fase local: 4 de diciembre de 2026). Autores: dos alumnos del CBTIS 108.
- Se construye a ciegas y se corrige al mostrarlo a laboratoristas, así que optimiza para cambiar rápido, no para escalar.
- Costo cero: sitio estático, sin servidor en v0.

## Idioma

- Código, nombres, commits y comentarios: inglés.
- Todo texto visible en la UI: español de México, con el vocabulario del glosario de `SPEC.md` (vale, recepción, merma...). Nada de "item", "checkout" ni "stock" en la interfaz: usa "artículo", "préstamo" y "existencia".
- Todos los textos de UI viven en `src/ui/strings.js`, para poder corregir la redacción sin buscar en todo el código.

## Stack (cerrado)

- Vite + JavaScript vanilla (ES modules). Sin framework.
- `vite-plugin-pwa` para service worker y manifest.
- `dexie` para IndexedDB.
- Una librería para generar QR en SVG y una para leer QR como respaldo del `BarcodeDetector` nativo (polyfill basado en zxing-wasm).
- CSS propio. Sin Tailwind ni librerías de componentes.

Antes de instalar cualquier paquete: confirma en npm el nombre exacto, que se mantenga activamente y su tamaño. Dilo en una línea. No agregues nada fuera de esta lista sin justificarlo y esperar aprobación. Si no estás seguro de cómo se comporta una API o una versión, dilo en vez de suponerlo.

## Estructura

```
src/
  db/       schema.js, seed.js (demo)
  domain/   stock.js, loans.js, codes.js   funciones puras, sin DOM ni Dexie
  ui/       strings.js, router.js, components/, screens/
  qr/       generate.js, scan.js
  io/       backup.js (JSON), csv.js
public/     icons, manifest assets
docs/       BITACORA-DEV.md
```

## Reglas de dominio (no negociables)

1. Ledger append-only: los movimientos no se editan ni se borran. Las correcciones se hacen con movimientos nuevos.
2. Stock derivado: nunca guardes existencias en `items`; se calculan en `src/domain/stock.js`.
3. Cantidades en enteros (centésimas de la unidad). Convierte solo al mostrar.
4. `item.code` es inmutable una vez creado, porque está impreso en etiquetas.
5. IDs: `crypto.randomUUID()`.
6. Un artículo con movimientos no se borra: se archiva.

## UX

- Mobile-first, a una mano, con botones grandes (mínimo 48 px de alto).
- El flujo de vale es el camino crítico: nada de modales encadenados, y confirmar es un solo toque.
- Toda acción destructiva o masiva pide confirmación. "Borrar todo" pide escribir "BORRAR".
- Debe funcionar offline después de la primera carga.
- Router por hash (`#/...`) para que GitHub Pages no dé 404 al recargar.

## Forma de trabajo

1. Al iniciar cada fase: plan corto (archivos que tocarás, decisiones, dudas). Espera un "va" antes de escribir código.
2. Trabaja una fase a la vez y cumple su criterio de "listo" de `SPEC.md`.
3. Edita lo que existe. No reescribas un archivo completo sin explicar por qué.
4. Sin abstracciones "por si acaso" ni comentarios obvios.
5. Las funciones de `src/domain/` llevan pruebas mínimas con el runner de Vite (`vitest`, que sí se permite como dependencia de desarrollo).
6. Al cerrar cada fase: agrega una entrada a `docs/BITACORA-DEV.md` con fecha, qué se hizo, decisiones y por qué, problemas encontrados y cómo se probó. Es evidencia oficial para el concurso: debe ser verídica, sin adornos.
7. Reporte final de fase: máximo 10 líneas (qué quedó, cómo probarlo en el celular y qué sigue).

## No hacer

- No agregar login, backend, analytics ni tracking.
- No usar `localStorage` para datos del dominio (solo IndexedDB).
- No mencionar marcas comerciales ni "XCELLENCE" en la app: es un desarrollo original de los autores.

## Notas técnicas vigentes

- Node local del equipo de desarrollo: 20.11. Por eso se usan Vite 6 y Vitest 3 (Vite 8 y Vitest 5 piden Node 20.19+/22.12+). GitHub Actions compila con Node 22.
- La versión visible de la app (pie de Ajustes/Inicio) sale de `package.json` + fecha de compilación: pedirla primero ante cualquier "no me aparece".
