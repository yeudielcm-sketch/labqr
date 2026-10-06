# Cambios propuestos por el equipo · 6 de octubre de 2026

> Lista que trajeron los autores a la sesión de trabajo, tal cual, clasificada por tamaño y riesgo.
> Nada de esto está programado todavía. Regla del proyecto: plan corto y "va" antes de escribir código.
> **Pendiente de saber:** ¿cada idea salió de un laboratorista o maestro, o de los autores? Lo que venga de usuarios reales pesa más en el informe (requisitos validados).

## A. Cambios chicos que caben en v0 (antes del 4 de diciembre)

| # | Idea | Lo que ya existe | Propuesta | Tamaño |
|---|---|---|---|---|
| 1 | **Cambiar nombre a C-Lab** | La app se llama "LabQR" (nombre provisional en el SPEC) | Cambiar el nombre visible: app, ícono, manual y documentos. **No** cambiar la dirección web, porque va dentro de los QR ya impresos. | Chico |
| 3 | **Regresar un reactivo que no se acabó** | Ya se puede: en el vale, "Devuelto" con la cantidad que sobró y "Consumido" con el resto (dos toques) | Un solo paso: "¿Cuánto regresó?" y lo demás se marca como consumido | Chico |
| 8 | **Notas en el vale por rotura** | La merma en préstamo se guarda con motivo fijo y sin nota | Al tocar "Roto o perdido", campo para escribir qué pasó | Chico |
| 11a | **Vales de alumnos con nombre y número de control** | El solicitante ya tiene nombre, grupo y matrícula opcional | Hacer obligatorio el número de control cuando el solicitante es un alumno | Chico |
| 10 | **Caducidades** | Ya hay fecha, aviso de 30 días y filtro "Por caducar" | **Falta aclarar qué más quieren** (ver preguntas) | ? |

## B. Medianos: caben en v0 si se confirman

| # | Idea | Propuesta | Tamaño | Cuidado |
|---|---|---|---|---|
| 2 | **Fotos de productos** | Tomar foto desde la ficha; se guarda reducida en el celular | Mediano | El respaldo pesa más (aprox. 50–100 KB por foto) |
| 6 | **Especificación de los vales** | Que el vale de la app tenga los mismos campos que el vale de papel que usan hoy | Mediano | Necesitamos una **foto del vale de papel actual** |
| 5 | **Reglamento** | Mostrar el reglamento del laboratorio y que el solicitante lo acepte al hacer el vale | Chico–mediano | Necesitamos el **texto del reglamento** |
| 7 | **"1 día antes de acabar existencias"** | Depende de qué significa (ver preguntas) | Mediano | Calcular "se acaba mañana" requiere historial de consumo |
| 9 | **Sustitución de reactivos** (si no hay uno, usar otro y recordar la elección) | Que cada reactivo tenga "sustitutos" y, si falta, la app sugiera el sustituto que se eligió la vez pasada | Mediano | Va muy ligado a las prácticas (idea 12) |
| 4 | **Vales de microscopio distintos a los regulares** | Depende de qué tienen de distinto (ver preguntas) | ? | Marcado como "checar" en su lista |

## C. Grande: cambia la arquitectura (v1)

| # | Idea | Por qué es grande |
|---|---|---|
| 12 | **Cuentas por rol:** Químicos (maestros), Encargados y Alumnos | Hoy la app vive en **un solo celular, sin login ni servidor** (SPEC §2, CLAUDE.md "No agregar login, backend"). Que un alumno haga un vale desde **su** celular y el encargado lo vea en **el suyo** exige un servidor, cuentas, contraseñas, sincronización y aviso de privacidad. Es la v1 del SPEC (Neon). |
| 11b | **Foto de la credencial del alumno** | Es un dato personal sensible. El SPEC pide mínimo de datos (§2.6) y la ley de protección de datos (LFPDPPP) exige aviso de privacidad. Además pesa mucho en el respaldo. |

### Lo que sí se puede rescatar de la idea 12 sin cuentas
**"Prácticas" del maestro:** el maestro (o el encargado) define una práctica con su lista de material, por ejemplo "Titulación ácido-base: 2 buretas, 4 vasos, HCl 50 ml". Al hacer el vale se elige la práctica y la lista se llena sola. Eso:
- funciona en v0, en el celular del encargado, sin cuentas;
- acelera el vale (medible para el informe);
- es la base de la sustitución de reactivos (idea 9);
- deja listo el camino para que en v1 los alumnos vean las prácticas en su celular.

## Recomendación

1. **Para el 4 de diciembre:** A completo, más "Prácticas", fotos y notas en rotura, solo lo que confirme el laboratorista.
2. **Cuentas y roles (12):** presentarlo en el informe y el cartel como **trabajo futuro (v1)**, con el diseño de los 3 roles ya pensado. Los jueces valoran ver hacia dónde crece el proyecto. Prometerlo funcionando para diciembre es arriesgado: faltan ~8 semanas y también hay que hacer entrevista, informe y cartel.
3. **Credencial con foto (11b):** no hacerlo; basta el número de control.
