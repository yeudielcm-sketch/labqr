# Informe del prototipo — C-Lab (BORRADOR)

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
- Conectar a las tres personas que intervienen en una práctica: el **maestro** que la planea, el **alumno** que pide el material y el **laboratorista** que lo entrega.
- Costo cero para el plantel: no requiere licencias, servidor ni internet en el laboratorio.

## 3. Objetivos

**General:** desarrollar una aplicación web progresiva que registre el inventario y los préstamos de los laboratorios del CBTIS 108 mediante códigos QR, a costo cero y sin conexión permanente a internet.

**Específicos:**
1. Etiquetar cada artículo con un QR que abra su ficha con cualquier celular.
2. Registrar préstamos por práctica en menos de 1 minuto para 5 artículos.
3. Calcular la existencia a partir de un historial de movimientos que no se puede editar ni borrar.
4. Avisar de material bajo mínimo, reactivos por caducar y vales vencidos.
5. Permitir respaldo, restauración y exportación a Excel.
6. Ofrecer una vista para cada rol (químico, laboratorista y alumno): el maestro deja tareas a cada grupo, el alumno pide el material y el laboratorista aprueba la solicitud.
7. Pasar tareas y solicitudes de un celular a otro con un código QR, sin servidor ni internet.

## 4. Antecedentes / estado del arte

Resumen de `RESEARCH.md`:
- **Soluciones comerciales:** Sortly, GoCodes, Quartzy, Labsistant, LabArchives, QR Inventory, Hector y Snipe-IT. Todas cobran en dólares, están en inglés o necesitan un servidor, y ninguna combina préstamos a equipos de alumnos con reactivos que caducan.
- **Antecedente académico:** Universidad de La Salle (Colombia), un sistema de préstamo de laboratorio con código de barras y servidor propio.
- **Hueco que cubre C-Lab:**
  - Costo cero y sin instalación.
  - Flujo de práctica de bachillerato.
  - Tres tipos de artículo (equipo, material y reactivo).
  - Lenguaje de almacén en español, del módulo "Controla el flujo de mercancías en almacén".
  - El QR funciona con la cámara normal del celular.
  - El maestro, el alumno y el laboratorista se conectan sin cuentas ni servidor: la tarea y la solicitud viajan dentro de un QR.

## 5. Metodología

- **Desarrollo por fases con criterio de "listo" medible** (SPEC §9), documentado en la bitácora (`docs/BITACORA-DEV.md`). Nueve fases al 7 de octubre de 2026:
  - F0: esqueleto.
  - F1: catálogo.
  - F2: QR.
  - F3: préstamos.
  - F4: respaldo.
  - F5: tablero.
  - F6: prácticas, reactivos y fotos.
  - F7: roles, tareas, solicitudes y QR entre celulares.
  - F8: actualización visual.

  Cada fase se probó en un celular Android real antes de pasar a la siguiente.
- **Prototipo para descubrir requisitos:** se muestra a laboratoristas y maestros con datos de demostración y se corrige (`GUION-DEMO-LABORATORISTAS.md`). El guion incluye que el laboratorista haga **solo y sin ayuda** un vale de 5 artículos, para medir si la app se entiende sin manual. **[FALTA: fecha y resultados de la entrevista.]**
- **Pruebas automáticas** de la lógica (82 al cierre de F8) y pruebas manuales en celular.
- **Auditorías de código independientes** antes de publicar los cambios grandes, hechas por un revisor que no conocía el proyecto: 12, 6 y 9 fallas encontradas y corregidas (F2 a F5, F6 y F7).
- **Métrica:** tiempo de entrega de material antes (medición manual) y después (columna `duracion_segundos` del CSV de vales). **[FALTA: medición "antes" y promedio "después" con usuarios reales.]**

## 6. Desarrollo técnico

- Aplicación web progresiva: se instala desde el navegador y funciona sin internet después de la primera carga.
- HTML, CSS y JavaScript (Vite), base de datos local IndexedDB (Dexie) y generación y lectura de QR en el propio celular.
- **Reglas de diseño de datos:**
  - Historial append-only: los movimientos no se editan.
  - Existencia derivada.
  - Cantidades en centésimas, para no tener errores de redondeo.
  - Códigos inmutables.
- **Diseño visual:** concepto "etiqueta de frasco". La existencia se dibuja como una probeta graduada, y cada artículo se ilustra con un dibujo propio del material (22 ilustraciones originales) o con su foto.
- **Roles sin cuentas:** al abrir la app se elige químico, laboratorista o alumno. Cada rol ve solo sus pantallas y acciones; el alumno, por ejemplo, no puede borrar datos ni registrar movimientos. No hay contraseñas, así que tampoco hay datos de acceso que proteger.
- **Tareas y solicitudes:** una tarea es una práctica asignada a un grupo para una fecha. El alumno pide el material desde la tarea y su solicitud queda **por aprobar**. Al aprobarla, el laboratorista confirma el préstamo y la solicitud queda entregada **en la misma operación**: nunca queda un préstamo sin su solicitud ni al revés. La solicitud por sí sola no mueve existencias.
- **QR entre celulares:** la tarea y la solicitud se codifican completas dentro de un QR (JSON compacto en base64url, menos de 700 caracteres).
  - El celular que lo lee no necesita datos ni internet.
  - Los artículos se identifican por su código impreso (QUI-0007), igual en todos los dispositivos con el mismo catálogo.
  - Escanear dos veces la misma solicitud no la duplica.
  - Se comprobó leyendo el QR dibujado con el mismo lector de la app y en dos celulares reales.

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
  - Cada dispositivo guarda sus propios datos. Las tareas y solicitudes pasan de uno a otro por QR o por enlace, pero el inventario no se sincroniza solo: se comparte con un respaldo.
  - Los roles no son cuentas: cualquiera puede elegir cualquier rol. Ordenan la pantalla, pero no protegen datos.
  - El respaldo es manual.
  - El tablero solo se actualiza en vivo con lo que pasa en el mismo equipo.

## 9. Resultados

**[FALTA: resultados de las pruebas en el laboratorio, número de artículos etiquetados, tiempos medidos y opinión de los laboratoristas.]**

## 10. Conclusiones y trabajo futuro

**[FALTA tras la entrevista.]** Trabajo futuro ya previsto:
- **v1, varios dispositivos:** sincronización del inventario (Neon, plan gratuito; SPEC §10).
- **Cuentas por rol con inicio de sesión**, para que solo el laboratorista pueda aprobar. Requiere servidor y aviso de privacidad (LFPDPPP).
- Escala a varios planteles.

## Referencias

Ver las fuentes de `RESEARCH.md`.
