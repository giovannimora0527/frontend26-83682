import { codigoRol, nombreRol } from './estados-ui';

describe('Roles', () => {
  it('traduce entre el nombre del perfil y su código', () => {
    expect(codigoRol('Recepcion')).toBe('SECRETARIA');
    expect(codigoRol('Recepción')).toBe('SECRETARIA');
    expect(codigoRol('DESPACHO_MEDICO')).toBe('DESPACHO_MEDICO');
    expect(codigoRol('otro')).toBeNull();
    expect(nombreRol('SECRETARIA')).toBe('Recepcion');
    expect(nombreRol('Despacho Medico')).toBe('Despacho Medico');
    expect(nombreRol('otro')).toBe('otro');
  });
});
