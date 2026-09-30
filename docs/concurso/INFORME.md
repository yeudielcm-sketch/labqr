# Informe del prototipo — LabQR (BORRADOR)

> **Borrador armado con lo que ya está en el repositorio.** El formato oficial (secciones, extensión, tipografía) lo da la *Guía de Operación, Exhibición, Seguridad y Evaluación*, que todavía no tenemos. Cuando llegue, se reacomoda aquí.
> Todo lo marcado con **[FALTA]** es un dato que solo se obtiene en el plantel. **No se debe inventar.**

**Modalidad:** Prototipo de Desarrollo de Software · Categoría Alumno
**Línea de investigación (PROIDET):** Desarrollo tecnológico **[confirmar con el asesor]**
**Plantel:** CBTIS 108, Comitán de Domínguez, Chiapas
**Autores:** **[FALTA: nombres]** · **Asesor(es):** **[FALTA]**

## 1. Planteamiento del problema

Los laboratorios del plantel prestan equipo, material de vidrio y reactivos a equipos de alumnos para cada práctica. **[FALTA: cómo se registra hoy, según la entrevista con laboratoristas; cuánto tarda entregar el material; qué se pierde o se rompe y cómo se sabe quién fue responsable.]**

## 2. Justificación

- Saber qué hay, dónde está y quién lo tiene, sin depender de la memoria del laboratorista.
- Ligar cada rotura o pérdida a quien tenía el material (merma con responsable).
- Detectar a tiempo reactivos por caducar y material bajo mínimo.
- Costo cero para el plantel: no requiere licencias, servidor ni internet en el laboratorio.

## 3. Objetivos

**General:** desarrollar una aplicación web progresiva que registre el inventario y los préstamos de los laboratorios del CBTIS 108 mediante códigos QR, a costo cero y sin conexión permanente a internet.

**Específicos:**
1. Etiquetar cada artículo con un QR que abra su ficha con cualquier celular.
2. Registrar préstamos por práctica en menos de 1 minuto para 5 artículos.
3. Calcular la existencia a partir de un historial de movimientos que no se puede editar ni borrar.
4. Avisar de material bajo mínimo, reactivos por caducar y vales vencidos.
5. Permitir respaldo, restauración y exportación a Excel.

## 4. Antecedentes / estado del arte

Resumen de `RESEARCH.md`:
- **Soluciones comerciales:** Sortly, GoCodes, Quartzy, Labsistant, LabArchives, QR Inventory, Hector y Snipe-IT. Todas cobran en dólares, están en inglés o necesitan un servidor, y ninguna combina préstamos a equipos de alumnos con reactivos que caducan.
- **Antecedente académico:** Universidad de La Salle (Colombia), un sistema de préstamo de laboratorio con código de barras y servidor propio.
- **Hueco que cubre LabQR:**
  - Costo cero y sin instalación.
  - Flujo de práctica de bachillerato.
  - Tres tipos de artículo (equipo, material y reactivo).
  - Lenguaje de almacén en español, del módulo "Controla el flujo de mercancías en almacén".
  - El QR funciona con la cámara normal del celular.

## 5. Metodología

- **Desarrollo por fases con criterio de "listo" medible** (SPEC §9), documentado en la bitácora (`docs/BITACORA-DEV.md`).
- **Prototipo para descubrir requisitos:** se muestra a laboratoristas con datos de demostración y se corrige (`GUION-DEMO-LABORATORISTAS.md`). **[FALTA: fecha y resultados de la entrevista.]**
- **Pruebas automáticas** de la lógica (41 al cierre de F5) y pruebas manuales en celular.
- **Métrica:** tiempo de entrega de material antes (medición manual) y después (columna `duracion_segundos` del CSV de vales). **[FALTA: medición "antes" y promedio "después" con usuarios reales.]**

## 6. Desarrollo técnico

- Aplicación web progresiva: se instala desde el navegador y funciona sin internet después de la primera carga.
- HTML, CSS y JavaScript (Vite), base de datos local IndexedDB (Dexie) y generación y lectura de QR en el propio celular.
- **Reglas de diseño de datos:**
  - Historial append-only: los movimientos no se editan.
  - Existencia derivada.
  - Cantidades en centésimas, para no tener errores de redondeo.
  - Códigos inmutables.
- **Diseño visual:** concepto "etiqueta de frasco". La existencia se dibuja como una probeta graduada.

## 7. Factibilidad económica

| Concepto | Costo |
|---|---|
| Hospedaje (GitHub Pages) | $0 |
| Base de datos (en el dispositivo) | $0 |
| Licencias | $0 |
| Etiquetas | Papel carta y tinta del plantel **[FALTA: costo por hoja]** |
| Ampliación a varios dispositivos (Neon, plan gratuito) | $0; ver límites en SPEC §10 |

## 8. Factibilidad técnica

- **Funciona en Android con Chrome** (dispositivo principal) **[FALTA: modelo del celular de prueba]**.
- **iPhone:** también funciona; si el celular no tiene lector QR propio, la app usa uno integrado que sirve sin internet.
- **Límites conocidos de v0:**
  - Un solo dispositivo.
  - El respaldo es manual.
  - El tablero solo se actualiza en vivo con lo que pasa en el mismo equipo.

## 9. Resultados

**[FALTA: resultados de las pruebas en el laboratorio, número de artículos etiquetados, tiempos medidos y opinión de los laboratoristas.]**

## 10. Conclusiones y trabajo futuro

**[FALTA tras la entrevista.]** Trabajo futuro ya previsto: sincronización entre varios dispositivos (v1), escala a varios planteles.

## Referencias

Ver las fuentes de `RESEARCH.md`.
