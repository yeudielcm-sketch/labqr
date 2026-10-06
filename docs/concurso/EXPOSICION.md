# Exposición ante los jueces — C-Lab

> DESIGN.md: "Los jueces no leen código: califican lo que ven en 5 minutos."
> La convocatoria califica tres cosas: el **informe**, la **modalidad** (el prototipo funcionando) y la **exposición oral con documentos y materiales**.
> **Pendiente:** ajustar tiempos y criterios a la rúbrica real de la *Guía de Operación, Exhibición, Seguridad y Evaluación* cuando llegue.

## Guion de 5 minutos

| Min | Qué se dice | Qué se enseña |
|---|---|---|
| 0:00–0:40 | **El problema.** "En el laboratorio del CBTIS 108 se prestan equipo, vidrio y reactivos a equipos de alumnos en cada práctica. **[dato de la entrevista: cómo se registra hoy y cuánto tarda]**." | Foto del laboratorio o de la libreta actual |
| 0:40–1:10 | **La solución.** "C-Lab: cada artículo lleva una etiqueta QR, y el celular del laboratorista es el inventario." | Tablero en la TV |
| 1:10–2:40 | **Demo en vivo:**<br>1. Con el celular, escanear una etiqueta con la cámara normal: abre la ficha sin instalar nada.<br>2. En la laptop (segunda ventana): Nuevo vale → buscar o escanear 5 artículos → Confirmar. "En el celular lo hicimos en 40 segundos."<br>3. Las probetas bajan en el tablero de la TV al momento. | Celular + etiquetas en material real + laptop con dos ventanas + TV |
| 2:40–3:20 | **Lo que la hace distinta:**<br>- Costo $0.<br>- Funciona sin internet.<br>- Préstamo a equipos de práctica.<br>- Lo roto queda a cargo de quien lo tenía.<br>- Maneja equipo, material y reactivos con caducidad. | Ficha de la probeta rota (historial con responsable) |
| 3:20–4:10 | **Resultados:** "antes **[X] s**, después **[Y] s**", más lo que dijeron los laboratoristas. | Cartel: gráfica antes/después |
| 4:10–4:40 | **Factibilidad.** "$0: GitHub Pages y base de datos en el celular. Para varios dispositivos, Neon en plan gratuito." | Cartel: tabla de costos |
| 4:40–5:00 | **Cierre.** Qué sigue (v1 con sincronización) y agradecimiento. | — |

**Reparto:** si son dos autores, uno habla y el otro opera el celular. Ensayar con cronómetro al menos 3 veces.

## Preguntas probables de los jueces (y respuesta corta)

- **¿Qué pasa si se pierde el celular?** Hay respaldo en un archivo que se comparte por WhatsApp o Drive; la app avisa si pasan 7 días sin respaldar.
- **¿Y si no hay internet?** Después de la primera carga funciona sin señal; el QR y el escáner también.
- **¿Por qué no una app de la tienda?** Porque se instala desde un enlace, no cuesta y funciona igual en Android y iPhone.
- **¿Se puede editar o borrar un préstamo?** No: cada movimiento queda en un historial que no se modifica. Los errores se corrigen con un movimiento nuevo, como en un almacén real.
- **¿Qué aprendieron?** **[Lo responden los autores con sus palabras.]**
- **¿Es original?** Hicimos una investigación de 8 productos comerciales y un antecedente académico (`RESEARCH.md`). Ninguno combina los tres tipos de artículo con préstamo a equipos de práctica y costo cero.

---

## Lista para el día del concurso (4 de diciembre de 2026)

**Una semana antes**
- [ ] Respaldo reciente del celular (☰ → Respaldo), copiado también a la laptop.
- [ ] Ensayo completo con cronómetro.
- [ ] Informe, manuales, bitácora y cartel impresos, en el formato de la guía.

**Un día antes**
- [ ] Abrir la app en el celular y en la laptop **con internet**, para que queden actualizadas y listas sin conexión. La versión debe coincidir en los dos (pie de Inicio).
- [ ] En la laptop: cargar la demo, o restaurar el respaldo con datos reales del laboratorio.
- [ ] Cargar el celular y la laptop.

**En el stand**
- [ ] TV o monitor con el tablero: laptop en `#/tablero`, pantalla completa (F11).
- [ ] **Demo en vivo en la laptop (decidido):** una ventana con el tablero en la TV y otra ventana de la misma laptop para capturar el vale; el tablero cambia solo. El celular se usa para enseñar que la cámara normal abre la ficha.
- [ ] Material real con etiquetas pegadas: un vaso, una probeta, un reactivo y un equipo.
- [ ] Hoja de etiquetas de repuesto.
- [ ] QR grande del enlace a la app (`docs/concurso/qr/labqr-app.png`) para que los jueces la abran en su propio celular.
- [ ] Plan B sin internet: la app ya abre sin señal. Si la cámara falla, escribir el código a mano (por ejemplo, "qui 7").
