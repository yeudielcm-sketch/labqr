# Lo mejorable de C-Lab, según Claude Notes · 6 de octubre de 2026

> Comparación honesta entre las lecciones de los proyectos anteriores (Macharnudas, MaicYlovers, Xcellence Personal; carpeta `Claude NOTES`) y cómo vamos en C-Lab.
> Ordenado por riesgo para el concurso del 4 de diciembre (faltan **~8 semanas**).

## Lo que ya hacemos bien (no tocar)

- Reglas escritas antes que código (SPEC, CLAUDE.md, DESIGN).
- Una fase a la vez con criterio de "listo" medible, y validada en el Android real.
- Auditoría independiente **antes** de publicar: dos veces, 18 fallas atrapadas.
- Versión visible y botón "Buscar actualización" desde el inicio.
- Nada se borra si tiene historia: los artículos y las prácticas se archivan.
- Rama `dev` para no romper la app publicada mientras se enseña.
- $0 sostenido.
- CLAUDE.md corto (76 líneas).

## Lo mejorable

### 1. 🔴 Construimos más rápido de lo que alguien de fuera usa la app
**La lección más cara de Macharnudas (§8):** app publicada, cadena verificada… y **cero clientes reales**. Lo descubrió hasta que se midió.

**C-Lab va por el mismo camino:**
- 6 fases y 7 versiones publicadas.
- La han usado **solo los autores**: ningún laboratorista ha hecho un vale real.
- F6 se construyó con ideas del equipo, todavía sin validar con un laboratorista.

**El costo de postergar, con número:**
- Cada semana sin entrevista es una semana menos para corregir lo que pidan.
- Los resultados "antes vs. después" del informe y del cartel **no existen** hasta que se mida.
- Faltan unas 8 semanas, así que si la entrevista llega en noviembre, quedan unas 3 para ajustar.

**Qué hacer:**
- **Antes de programar algo más**, poner C-Lab en manos de un laboratorista **esta semana**.
- Medir dos cosas: cuántos vales hace **él** y cuánto tarda hoy sin la app.
- Congelar funciones nuevas hasta tener esa medición.

### 2. 🔴 Los datos de prueba se mezclan con los reales
Lección de Macharnudas (§9.4): *separar los pedidos de prueba de los reales cuando se hacen, no al analizarlos*.

En C-Lab, los vales de la demo y los de tus pruebas (40 s, Ana Torres) quedan en el mismo CSV de vales que va a dar la métrica del informe.

**Qué hacer:**
- El día que empiece el uso real, **Borrar todo** (antes, respaldo) y anotarlo en la bitácora con fecha.
- Opción técnica barata: marcar los vales de la demo como "demostración" para que el CSV los separe.

### 3. 🟠 Un documento ya se quedó atrás
Lección de Xcellence: *"documentos que se quedaron atrás"*.

El **manual de usuario en PDF todavía dice "LabQR" y no explica Prácticas, el regreso de reactivos, las notas ni las fotos.** Es un entregable del concurso.

**Qué hacer:** regenerar el manual con capturas nuevas (los scripts ya existen en `scripts/manual/`). Desde ahora, la regla es que **ninguna fase se cierra sin actualizar el manual**.

### 4. 🟠 Una sola persona es el canal de todo
Lección de Macharnudas (§3.2): *"nada está duplicado ni delegado"*.

En C-Lab, todo pasa por ti:
- La cuenta de GitHub.
- El celular con los datos.
- Los respaldos.
- Las conversaciones con Claude.

Si tu celular falla la semana del concurso, no hay plan B.

**Qué hacer:**
- Que tu compañero tenga la app instalada y sepa hacer un vale y un respaldo.
- Que los respaldos se compartan a un lugar que vean los dos, como un chat del equipo o un Drive.
- Llevar una laptop con un respaldo restaurado como plan B el día del concurso.

### 5. 🟡 Las decisiones están repartidas en 5 documentos
Lección de Macharnudas (§1.3): un `DECISIONES.md` con una línea fechada por decisión, y una lista de **lo descartado que no se vuelve a proponer**.

Hoy las decisiones de C-Lab viven sueltas en la bitácora, el SPEC, PENDIENTES y CAMBIOS-PROPUESTOS.

**Hecho hoy:** `docs/DECISIONES.md`.

### 6. 🟡 Verificar lo publicado contra el servicio real, no contra el comando
Lección de Macharnudas (§1.1 y §2.5): *"la existencia del artefacto no prueba que esté vivo"*.

Ya nos pasó: GitHub decía "deploy ✓" y el navegador seguía mostrando 0.2.0 por la caché.

**Qué hacer:** un guion pequeño que, después de publicar, pregunte al sitio real qué versión sirve y lo compare con `package.json`. Es barato y evita decir "ya está" en falso.

### 7. 🟡 Un criterio de "listo" que no dependa de preguntarte
Lección de Macharnudas (§3.1): los **9 filtros** (Kairos, Wings, Nokia, Operación, Raichu, Dopamina, Logistic, Branding, Arete) convirtieron el gusto del dueño en algo que Claude puede revisar solo.

C-Lab solo tiene la pregunta de DESIGN.md: *"¿parece de laboratorio o cualquier app?"*.

**Qué hacer:** si nos pasas la definición de los 9 filtros, los adaptamos a C-Lab y quedan como checklist de cierre de cada fase. Las notas solo traen cuatro: Wings = ¿entendí el alma?, Raichu = ¿obvio sin manual?, Operación = un documento en vez de diez, Logistic = ¿está en operación real?

### 8. 🟢 Menos ingenio contra herramientas, más clic humano
Lección de Macharnudas (§9.7): *"preferir el clic humano de diez segundos a la hora de ingenio"*.

En C-Lab nos costó tiempo:
- Tres intentos de inicio de sesión en GitHub.
- La ruta `/labqr/` alterada por Git Bash dos veces.
- Comandos con comillas que se rompieron.

Ninguno fue grave, pero la regla aplica: si algo requiere tu clic, pedirlo antes de insistir.

### 9. 🟢 El estilo "aprendizaje" sigue activo
Ya estaba anotado en las notas de MaicYlovers: ese estilo pide que escribas código, y tú decides producto, no programas.

**Qué hacer:** apagarlo para este proyecto desde la configuración de estilo de salida de Claude Code.

## Siguiente paso concreto (en orden)
1. Entrevista y medición con un laboratorista **esta semana** (1 y 2).
2. Regenerar el manual con C-Lab y Prácticas (3).
3. Tu compañero con la app instalada y los respaldos compartidos (4).
4. Lo técnico barato: marcar la demo en el CSV y el guion de verificación de publicación (2 y 6).
