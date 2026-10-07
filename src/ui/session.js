// The role chosen on this device (F7). Kept in IndexedDB settings and cached here so every
// screen can ask synchronously. No login: the welcome screen lets anyone pick any role.
import { getSetting, setSetting } from '../db/catalog.js';
import { can, isRole } from '../domain/roles.js';

let role = null;

export async function loadRole() {
  const saved = await getSetting('role', null);
  role = isRole(saved) ? saved : null;
  return role;
}

export function currentRole() {
  return role;
}

export async function chooseRole(next) {
  if (!isRole(next)) return;
  await setSetting('role', next);
  role = next;
}

export function allowed(action) {
  return can(role, action);
}
