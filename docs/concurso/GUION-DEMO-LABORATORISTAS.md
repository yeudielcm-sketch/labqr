# Guion para mostrar C-Lab a laboratoristas y maestros

Objetivo: descubrir qué les falta (SPEC §1) y **medir**. Se enseña con la demo y se anotan sus respuestas tal cual en `ENTREVISTAS.md`; después van a `SPEC-v1.md`.

> Versión de la app: 0.9.1 (roles, tareas, solicitudes por QR e ilustraciones). Si en su celular dice otra, en Ajustes toca "Buscar actualización".

## Antes (5 min)
- **Celular 1 (el tuyo):** abre C-Lab, elige **Laboratorista** y luego **☰ → Ajustes → Cargar datos de demostración**.
- **Celular 2 (opcional, de tu compañero):** C-Lab abierto en "¿Quién eres?". Sirve para enseñar el QR entre dos celulares.
- Lleva una libreta o graba audio (pide permiso).
- **Mide primero el "antes"**, si se puede: cronometra una entrega real de material como la hacen hoy (hoja de medición en `ENTREVISTAS.md`).

## Que lo usen ellos (5 min) ← lo más importante
Dale el celular al laboratorista y **no le ayudes** salvo que se trabe más de 30 segundos. Anota dónde dudó.
1. "Préstale al Equipo 1 dos vasos de precipitado, una bureta, una pipeta y 20 ml de alcohol." (Un vale de 5 artículos.)
2. Al confirmar, la app muestra cuántos segundos tardó. Anótalo: es la **medición "después" con un usuario real**.
3. "Ahora registra que regresó todo, menos un vaso que se rompió."

Lo que no encuentre solo es lo que hay que arreglar (filtro *Raichu*: ¿es obvio sin manual?).

## Qué mostrar (8 min, en este orden; si falta tiempo, corta desde abajo)
1. **Inicio:** "+ Nuevo vale" hasta arriba y los avisos de lo más urgente a lo menos urgente: solicitud por aprobar, vencidos, caducado, bajo mínimo. Toca "bajo mínimo" y aparece el alcohol etílico.
2. **Artículos:** cada uno con su dibujo. Busca "micro" y luego filtra por Reactivo.
3. **Ficha de la probeta QUI-0007:** hay 10 en el laboratorio y 1 prestada. En el historial se ve la probeta rota a cargo del Equipo 2.
4. **Roles, tarea y solicitud** (si hay maestro presente, que él haga la parte del químico):
   - Toca el rol arriba a la derecha → **Químico** → abre la tarea "Titulación ácido-base · 4° A" → **Mostrar QR para el grupo**.
   - **Con dos celulares:** en el celular 2, elige **Alumno** → **Escanear** el QR → **Pedir el material** → nombre y número de control → **Generar QR de solicitud**. En el celular 1 (Laboratorista) → **Escanear** ese QR → **Atender y entregar** → **Confirmar préstamo**.
   - **Con un solo celular:** cambia a **Alumno** → escribe el grupo **4° A** → abre la tarea → **Pedir el material** → **Enviar solicitud**. Cambia a **Laboratorista**: en Inicio aparece "solicitud por aprobar" → **Atender y entregar** → **Confirmar préstamo**.
5. **Prácticas:** ☰ → Prácticas → Titulación ácido-base → "Hacer vale con esta práctica". El vale se llena solo.
6. **Devolución de un reactivo:** abrir el vale, escribir cuánto regresó y "Registrar regreso".
7. **Agregar un artículo** que ellos elijan de su laboratorio real, con sus especificaciones y una foto.

## Qué preguntar
1. ¿Hoy cómo registran los préstamos? ¿En papel, en Excel, o no los registran?
2. ¿A quién le prestan: a un alumno, a un equipo o al maestro? ¿Piden credencial?
3. ¿Cuánto tarda hoy entregar el material de una práctica? (Es el "antes" para las métricas de SPEC §8.)
4. ¿Qué datos necesitan de cada artículo que no vieron en la ficha?
5. ¿Cuántas personas capturan y en cuántos dispositivos? (Decide si hace falta la v1 con sincronización.)
6. ¿Qué pasa hoy cuando se rompe algo? ¿Quién paga o repone?
7. ¿Hay internet en el laboratorio?
8. ¿Qué laboratorios, anaqueles y gavetas hay de verdad? ¿Cuántos artículos, más o menos?
9. ¿Qué es lo que más les quita tiempo?

### Para validar las ideas del equipo (F6 y pendientes)
10. ¿Les serviría guardar el material de cada práctica, como en la demo? ¿Quién lo armaría: el maestro o ustedes?
11. ¿Los microscopios se prestan distinto que el resto (otro formato, firma, revisar el estado al regresar)?
12. ¿Tienen un reglamento del laboratorio y un vale de papel? Pide **tomarles foto**.
13. ¿Les sirve que avise cuando algo está por acabarse? ¿Con cuánta anticipación?
14. Si falta un reactivo, ¿lo sustituyen por otro? ¿Siempre por el mismo?
15. ¿Qué necesitan saber de las caducidades que hoy no ven?
16. ¿Les sirve una foto o un dibujo de cada artículo?

### Para validar los roles, las tareas y las solicitudes (F7)
17. **(Maestro)** ¿Dejaría las prácticas como tareas en la app? ¿Con cuánta anticipación sabe qué práctica toca?
18. ¿Los alumnos pueden usar el celular dentro del laboratorio? ¿Todos tienen uno?
19. ¿Qué prefieren: que el alumno pida desde su celular con el QR, o en una tablet o celular fijo en la ventanilla?
20. **(Laboratorista)** ¿Aprobar cada solicitud le ahorra tiempo o se lo quita? ¿Qué revisa antes de entregar?
21. ¿Quién más debería poder usar la app (jefe de laboratorio, otro turno)? ¿Alguien no debería ver algo?

## Después
- Pasa las respuestas a `docs/concurso/ENTREVISTAS.md` con fecha y cargo (sin nombres si no dan permiso), junto con los **segundos** del vale que hicieron solos.
- **Borrar todo** en el celular si van a empezar a capturar datos reales (antes, un respaldo de la demo no hace falta).
- Lo que pidan entra primero a `CAMBIOS-PROPUESTOS.md`, y se programa solo si cabe antes del 4 de diciembre.
