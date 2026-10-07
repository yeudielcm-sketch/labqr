// Line icons drawn for LabQR (24px grid, stroke = currentColor).
const svg = (body) =>
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icons = {
  home: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
  scan: svg('<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><path d="M4 12h16"/>'),
  items: svg('<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>'),
  loans: svg('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
  menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  tasks: svg('<rect x="5" y="4" width="14" height="17" rx="1"/><path d="M9 4V3h6v1M9 10l1.5 1.5L13 9M9 16h6"/>'),
  requests: svg('<path d="M4 13l3-8h10l3 8v6H4z"/><path d="M4 13h5l1 2h4l1-2h5"/>'),
  // Menu (F8)
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
  practices: svg('<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4M9 12h6M9 16h4"/>'),
  labels: svg('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>'),
  backup: svg('<path d="M12 4v11M7 10l5 5 5-5"/><path d="M4 17v3h16v-3"/>'),
  board: svg('<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4"/>'),
  // Roles (F7)
  teacher: svg('<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/><path d="M21 9v6"/>'),
  labTech: svg('<path d="M4 20h16M6 20V9h12v11M6 9l2-5h8l2 5"/><path d="M10 13h4"/>'),
  student: svg('<circle cx="12" cy="7" r="3.5"/><path d="M5 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/>'),
};
