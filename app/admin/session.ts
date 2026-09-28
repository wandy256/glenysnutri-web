// Sesión del panel: el token firmado por glenys-api se guarda en este navegador (12 horas).
const KEY = "glenys-admin-token";
let listeners: (() => void)[] = [];

export function getToken(): string | null {
  try { return window.localStorage.getItem(KEY); } catch { return null; }
}
export function setToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(KEY, token);
    else window.localStorage.removeItem(KEY);
  } catch { /* navegador sin almacenamiento: la sesión dura mientras la pestaña esté abierta */ }
  memoryToken = token;
}
let memoryToken: string | null = null;

export function authHeaders(): Record<string, string> {
  const t = getToken() ?? memoryToken;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** Se llama cuando la API responde 401 (sesión vencida). */
export function onUnauthorized() {
  setToken(null);
  listeners.forEach((fn) => fn());
}
export function subscribeUnauthorized(fn: () => void) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((x) => x !== fn); };
}
