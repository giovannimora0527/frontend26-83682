import { JwtPayload } from '../utils/jwt.util';

/** Crea un JWT sin firma real, solo para pruebas. */
export function crearTokenPrueba(claims: Partial<JwtPayload> = {}): string {
  const codificar = (valor: unknown) =>
    btoa(JSON.stringify(valor)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const ahora = Math.floor(Date.now() / 1000);
  const payload = {
    sub: '1', username: 'admin', email: 'admin@clinica.test', rol: 'ADMINISTRADOR', menus: '[]',
    iat: ahora, exp: ahora + 3600, ...claims
  };
  return `${codificar({ alg: 'HS512' })}.${codificar(payload)}.firma`;
}
