// Roles (F7): who is using this device. There is no login: anyone may pick any role.
// The role only decides what each person sees, so a student is not one tap away from
// "Borrar todo". Pure: no DOM, no Dexie.

export const ROLES = ['teacher', 'labTech', 'student'];

export function isRole(value) {
  return ROLES.includes(value);
}

// Bottom tabs per role (paths of the hash router).
export const ROLE_TABS = {
  teacher: ['/', '/tareas', '/articulos', '/vales'],
  labTech: ['/', '/escanear', '/articulos', '/vales'],
  student: ['/', '/escanear', '/articulos', '/solicitudes'],
};

const PERMISSIONS = {
  labTech: ['lend', 'moveStock', 'editItem', 'labels', 'admin', 'practices', 'tasks', 'decideRequest'],
  teacher: ['lend', 'practices', 'tasks'],
  student: ['request'],
};

export function can(role, action) {
  return Boolean(PERMISSIONS[role]?.includes(action));
}
