// Every user-visible text lives here (es-MX, SPEC glossary vocabulary).
export const t = {
  appName: 'LabQR',

  tabs: {
    home: 'Inicio',
    scan: 'Escanear',
    items: 'Artículos',
    loans: 'Vales',
  },

  menu: {
    open: 'Abrir menú',
    title: 'Menú',
    settings: 'Ajustes',
    labels: 'Etiquetas',
    backup: 'Respaldo',
  },

  home: {
    title: 'Inicio',
    empty: 'Aún no hay artículos. Carga la demo o agrega el primero.',
    loadDemo: 'Cargar demo',
    addItem: 'Agregar artículo',
  },

  scan: {
    title: 'Escanear',
    pending: 'El escáner llega en la fase 2. Por ahora, busca el artículo en Artículos.',
  },

  items: {
    title: 'Artículos',
    empty: 'Aún no hay artículos. Carga la demo o agrega el primero.',
  },

  loans: {
    title: 'Vales',
    empty: 'Aún no hay vales. Cuando prestes material, aquí verás cada vale.',
  },

  itemCard: {
    title: 'Ficha del artículo',
    notFound: (code) => `No existe un artículo con el código ${code}. Revisa la etiqueta o escríbelo a mano.`,
  },

  settings: {
    title: 'Ajustes',
    storage: 'Datos en este dispositivo',
    storageReady: 'Base de datos lista',
    storageError: 'No se pudo abrir la base de datos. Cierra otras pestañas de LabQR y vuelve a abrirla.',
    offlineReady: 'Lista para usarse sin internet',
    offlinePending: 'Preparando uso sin internet…',
  },

  pending: {
    title: 'En construcción',
    body: 'Esta pantalla llega en una fase siguiente.',
  },

  notFound: {
    title: 'Página no encontrada',
    body: 'Esa dirección no existe en LabQR.',
    back: 'Ir a Inicio',
  },

  version: (v, built) => `Versión ${v} · ${built}`,
};
