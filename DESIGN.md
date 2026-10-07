# DESIGN.md — Dirección visual de LabQR

Los jueces no leen código: califican lo que ven en 5 minutos. El diseño es la mitad del proyecto. Se define en F0 con tokens y se respeta en cada fase; no es un "pulido final".

## Concepto: la etiqueta de frasco

Todo sale del mundo físico del laboratorio: etiquetas de frasco de reactivo, azulejo blanco, vidrio borosilicato, frascos ámbar y los pictogramas de peligro con rombo rojo. La app debe parecer material de laboratorio, no un dashboard genérico.

## Lo único memorable: la probeta

La existencia de cada artículo no se muestra como número suelto. Se dibuja como una probeta graduada en SVG:

- El nivel del líquido representa la existencia en laboratorio respecto al total.
- Una marca horizontal indica el mínimo (`minStock`). Si el nivel queda por debajo, el líquido cambia a rojo.
- Lo prestado se muestra como la parte vacía de la probeta, con un contorno punteado.
- En reactivos, la probeta lleva la unidad real (ml, g) en las graduaciones.
- En equipo (pieza única), en vez de probeta se usa un indicador de dos estados: "en su lugar" o "prestado a...".

Toda la audacia visual se gasta aquí. El resto de la interfaz es sobria y disciplinada.

## Ilustraciones de artículos (F8)

Cada artículo se ve con su **foto real** si la tiene; si no, con una **ilustración propia** (`src/ui/components/illustrations.js`), nunca con fotos de internet.

- Mismo lenguaje que la probeta: contorno grafito, líquido `glass`, frascos de reactivo en ámbar con su etiqueta de franja ámbar.
- Se eligen por el nombre del artículo (vaso, matraz, bureta, microscopio…, sin importar acentos). Si ninguna coincide, se usa una genérica por tipo: equipo, material, reactivo líquido (frasco) o reactivo sólido (bote).
- Aparecen en la lista de artículos, la ficha, los vales, las prácticas, las tareas y las solicitudes.
- Se irán agregando más: basta dibujarla en el mismo archivo y agregar su palabra clave.

## Tokens

### Color

| Nombre | Hex | Uso |
|---|---|---|
| tile | `#F3F6F8` | Fondo (azulejo frío) |
| graphite | `#22272E` | Texto principal |
| cobalt | `#1B3A8C` | Acción primaria, navegación, marca |
| glass | `#BFE3EA` | Líquido de la probeta, estado normal |
| amber | `#C77A12` | Por caducar, avisos (como un frasco ámbar) |
| hazard | `#D32F2F` | Merma, vencido, bajo mínimo (el rojo de los pictogramas) |

Color por tipo de artículo, en la franja lateral de la etiqueta: equipo = `cobalt`, material = `glass`, reactivo = `amber`.

Modo oscuro opcional; no es prioridad en v0.

### Tipografía

- Una sola familia: **Barlow** para UI y texto, **Barlow Condensed** en semibold para códigos (`QUI-0001`), números grandes y títulos de pantalla. Da un tono de señalética industrial y de etiqueta impresa.
- Autoalojada en el bundle (sin Google Fonts en tiempo de ejecución), porque la app debe funcionar offline.
- Escala: 14 / 16 / 20 / 28 / 40. Nada de etiquetas en mayúsculas sostenidas.

### Forma

- Las fichas de artículo son etiquetas: esquinas de 4 px, franja de color a la izquierda según tipo y código grande arriba a la derecha, como una etiqueta de frasco.
- Nada de "tarjeta genérica con sombra gris" para todo. La jerarquía se marca con tamaño y peso, no con sombras.
- Los estados de peligro (vencido, merma) usan un rombo rojo con borde, en alusión a los pictogramas GHS, sin copiar pictogramas oficiales.

## Movimiento

Un solo momento orquestado: al confirmar un vale, las probetas de los artículos prestados bajan de nivel (unos 400 ms). Al escanear con éxito, un pulso breve en el marco de la cámara más vibración. Nada más se anima por decoración. Respetar `prefers-reduced-motion`.

## Pantallas clave

```
Inicio (celular)             Ficha de artículo
┌──────────────────────┐     ┌──────────────────────┐
│ Laboratorio Química ▾│     │▌Vaso de precipitado  │
│                      │     │▌250 ml      QUI-0007 │
│ 3 vales abiertos     │     │ ┌──┐                 │
│ 1 vencido ◆          │     │ │  │ 18 en lab       │
│ 4 bajo mínimo        │     │ │▒▒│ 6 prestados     │
│ 2 por caducar        │     │ │▒▒│─ mín 10         │
│                      │     │ └──┘                 │
│ [ Nuevo vale ]       │     │ Anaquel B · Gaveta 2 │
├──────────────────────┤     │ Historial ...        │
│ Inicio Escanear Art. Vales │                      │
└──────────────────────┘     └──────────────────────┘
```

**Tablero de exposición** (`#/tablero`, pensado para laptop o TV en el stand): una fila de probetas por ubicación, con los vales abiertos a un lado y los últimos movimientos apareciendo en vivo. Es lo que los jueces ven de lejos mientras se hace la demo en el celular.

## Texto

Voz de almacén, frases cortas y en voz activa. El botón dice "Confirmar préstamo" y el aviso dice "Préstamo confirmado". Los errores dicen qué pasó y cómo arreglarlo ("No se leyó el código. Acerca la etiqueta o escríbelo a mano."). Las pantallas vacías invitan a actuar ("Aún no hay artículos. Carga la demo o agrega el primero.").

## Revisión antes de cerrar cada fase

Tomar captura en el celular y preguntarse: ¿esto parece de laboratorio o parece cualquier app? Si parece cualquier app, se corrige antes de avanzar.
