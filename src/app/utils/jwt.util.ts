export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  rol: string;
  menus: string;
  /** Solo tiene valor si el rol es MEDICO. */
  medicoId?: number | null;
  iat: number;
  exp: number;
}

export interface JwtMenu {
  code: string;
  activo: boolean;
  title?: string;
  url?: string;
  icon?: string;
}

export function getJwtPayload(): JwtPayload | null {
  const token = sessionStorage.getItem('token');
  if (token === null) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) {
    throw new Error('El token JWT tiene un formato invalido');
  }

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  const payload: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));

  if (
    !isRecord(payload) ||
    typeof payload['sub'] !== 'string' ||
    typeof payload['username'] !== 'string' ||
    typeof payload['email'] !== 'string' ||
    typeof payload['rol'] !== 'string' ||
    typeof payload['menus'] !== 'string' ||
    !esMedicoIdValido(payload['medicoId']) ||
    typeof payload['iat'] !== 'number' ||
    typeof payload['exp'] !== 'number'
  ) {
    throw new Error('El contenido del token JWT es invalido');
  }

  return {
    sub: payload['sub'],
    username: payload['username'],
    email: payload['email'],
    rol: payload['rol'],
    menus: payload['menus'],
    medicoId: payload['medicoId'] ?? null,
    iat: payload['iat'],
    exp: payload['exp']
  };
}

export function getJwtMenus(): JwtMenu[] {
  const payload = getJwtPayload();
  if (payload === null) {
    return [];
  }

  const menus: unknown = JSON.parse(payload.menus);
  if (!Array.isArray(menus) || !menus.every(isJwtMenu)) {
    throw new Error('Los menus del token JWT son invalidos');
  }
  return menus;
}

function esMedicoIdValido(value: unknown): value is number | null | undefined {
  return value === undefined || value === null || typeof value === 'number';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJwtMenu(value: unknown): value is JwtMenu {
  return (
    isRecord(value) &&
    typeof value['code'] === 'string' &&
    typeof value['activo'] === 'boolean'
  );
}
