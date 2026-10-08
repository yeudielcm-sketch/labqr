# Regenerar el manual de usuario con capturas

Scripts usados para `docs/concurso/MANUAL-USUARIO.pdf`. No forman parte de la app.

Requisitos (fuera del proyecto, para no agregar dependencias a LabQR):
- Google Chrome instalado en `C:/Program Files/Google/Chrome/Application/chrome.exe`.
- `puppeteer-core` instalado en una carpeta aparte: `npm install puppeteer-core@25.12.0`. Copia ahí estos 3 scripts y ejecútalos desde esa carpeta.

Pasos:
1. Compila la app y sírvela en el puerto 4174 desde PowerShell (en Git Bash la ruta `/labqr/` se altera):
   `npm run build` con `BASE_PATH=/labqr/`, y luego `npx vite preview --port 4174 --strictPort --base /labqr/`. Para otro puerto, define `CLAB_URL` (por ejemplo `http://localhost:4173/labqr/`).
2. `node make-fake-camera.mjs`: genera una cámara simulada que apunta a la etiqueta real de QUI-0007.
3. `node capture.mjs`: escribe las 37 capturas en `docs/concurso/capturas/`, con la demo cargada y en tamaño de celular. Elige el rol en "¿Quién eres?" y recorre el químico, el alumno y el laboratorista (tarea y solicitud por QR).
   - Los botones que pueden quedar bajo la barra inferior se tocan con un clic del DOM, no por coordenadas.
4. `node make-pdf.mjs`: convierte `docs/concurso/manual/MANUAL-USUARIO.html` en `docs/concurso/MANUAL-USUARIO.pdf`.

Las rutas dentro de los scripts son absolutas a esta computadora; ajústalas si cambias de equipo.
